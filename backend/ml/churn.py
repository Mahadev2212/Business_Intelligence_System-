# backend/ml/churn.py
"""
RFM scoring + RandomForest churn prediction (FR-21).
"""
import logging
from datetime import date, timedelta

import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.preprocessing import StandardScaler
from sqlalchemy import text

from database import SessionLocal

log = logging.getLogger(__name__)


def run_churn_prediction(run_id: str = "manual"):
    db = SessionLocal()
    try:
        log.info(f"[{run_id}] Starting churn prediction …")

        rows = db.execute(text("""
            SELECT
                fs.customer_id,
                MAX(dt.date)   AS last_purchase,
                COUNT(*)       AS frequency,
                SUM(fs.quantity * fs.unit_price * (1 - fs.discount_pct/100)) AS monetary
            FROM fact_sales fs
            JOIN dim_time dt ON fs.time_id = dt.time_id
            WHERE fs.status = 'completed'
            GROUP BY fs.customer_id
        """)).fetchall()

        if not rows:
            log.warning(f"[{run_id}] No sales data for churn model")
            return

        today = date.today()
        df = pd.DataFrame(rows, columns=["customer_id", "last_purchase", "frequency", "monetary"])
        df["recency"] = df["last_purchase"].apply(lambda d: (today - d).days)
        df["monetary"] = df["monetary"].astype(float)

        # RFM normalised scores (1–5 bins)
        for col in ["recency", "frequency", "monetary"]:
            try:
                df[f"{col}_score"] = pd.qcut(df[col], q=5, labels=[5, 4, 3, 2, 1] if col == "recency" else [1, 2, 3, 4, 5], duplicates="drop")
            except Exception:
                df[f"{col}_score"] = 3  # fallback if not enough distinct values

        df["rfm_score"] = (
            df["recency_score"].astype(float) +
            df["frequency_score"].astype(float) +
            df["monetary_score"].astype(float)
        )

        # Synthetic churn labels for training (rule-based):
        # High recency (inactive long) + low frequency + low monetary → churn
        df["churn_label"] = (
            (df["recency"] > 90) & (df["frequency"] < 3) & (df["monetary"] < 5000)
        ).astype(int)

        features = df[["recency", "frequency", "monetary", "rfm_score"]].fillna(0)
        scaler = StandardScaler()
        X = scaler.fit_transform(features)

        clf = RandomForestClassifier(n_estimators=100, random_state=42, class_weight="balanced")
        clf.fit(X, df["churn_label"])

        churn_probs = clf.predict_proba(X)[:, 1]

        db.execute(text("DELETE FROM ml_churn_scores WHERE run_id != 'SEED_CHURN_001'"))

        for i, row in df.iterrows():
            prob = float(churn_probs[i])
            label = "High" if prob >= 0.65 else "Medium" if prob >= 0.35 else "Low"
            db.execute(text("""
                INSERT INTO ml_churn_scores
                    (customer_id, churn_prob, risk_label, rfm_score, model_version, run_id)
                VALUES (:cid, :prob, :label, :rfm, 'RandomForest_v1', :run_id)
            """), {
                "cid": int(row.customer_id), "prob": round(prob, 4),
                "label": label, "rfm": round(float(row.rfm_score), 2),
                "run_id": run_id,
            })

        db.commit()
        log.info(f"[{run_id}] Churn prediction done for {len(df)} customers.")

    except Exception as e:
        log.error(f"[{run_id}] Churn prediction failed: {e}")
        db.rollback()
    finally:
        db.close()
