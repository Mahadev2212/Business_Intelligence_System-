# backend/ml/anomaly.py
"""
IsolationForest anomaly detection on fact_sales (FR-18, FR-19).
Flags transactions with anomaly_score > ANOMALY_THRESHOLD.
"""
import logging
from datetime import datetime, timezone

import numpy as np
import pandas as pd
from sklearn.ensemble import IsolationForest
from sklearn.preprocessing import StandardScaler
from sqlalchemy import text

from database import SessionLocal
from config import get_settings

log = logging.getLogger(__name__)
settings = get_settings()


def run_anomaly_detection(run_id: str = "manual"):
    db = SessionLocal()
    try:
        log.info(f"[{run_id}] Starting anomaly detection …")

        rows = db.execute(text("""
            SELECT
                fs.sale_id,
                fs.quantity,
                fs.unit_price,
                fs.discount_pct,
                (fs.quantity * fs.unit_price * (1 - fs.discount_pct/100)) AS amount
            FROM fact_sales fs
            WHERE fs.status = 'completed'
        """)).fetchall()

        if len(rows) < 10:
            log.warning(f"[{run_id}] Not enough data for anomaly detection ({len(rows)} rows)")
            return

        df = pd.DataFrame(rows, columns=["sale_id", "quantity", "unit_price", "discount_pct", "amount"])
        features = df[["quantity", "unit_price", "discount_pct", "amount"]].fillna(0)

        scaler = StandardScaler()
        X = scaler.fit_transform(features)

        clf = IsolationForest(contamination=0.05, random_state=42, n_estimators=200)
        clf.fit(X)

        # Scores: negative = more anomalous. We invert and normalise to [0,1]
        raw_scores = clf.score_samples(X)
        scores_norm = (raw_scores - raw_scores.min()) / (raw_scores.max() - raw_scores.min() + 1e-9)
        # High normalised score = anomalous
        anomaly_scores = 1 - scores_norm

        # Clear previous run results
        db.execute(text("DELETE FROM ml_anomalies WHERE run_id != 'SEED_RUN_001'"))

        threshold = settings.ANOMALY_THRESHOLD
        flagged = 0
        for i, row in enumerate(rows):
            score = float(anomaly_scores[i])
            is_flagged = score > threshold
            if is_flagged:
                db.execute(text("""
                    INSERT INTO ml_anomalies (sale_id, anomaly_score, is_flagged, method, run_id)
                    VALUES (:sid, :score, :flag, 'IsolationForest', :run_id)
                """), {"sid": row.sale_id, "score": score, "flag": True, "run_id": run_id})
                flagged += 1

        db.commit()
        log.info(f"[{run_id}] Done. Flagged {flagged} anomalies out of {len(rows)} records.")

    except Exception as e:
        log.error(f"[{run_id}] Anomaly detection failed: {e}")
        db.rollback()
    finally:
        db.close()
