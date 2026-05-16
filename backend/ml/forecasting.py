# backend/ml/forecasting.py
"""
ARIMA (statsmodels) 30-day sales forecasting (FR-20).
"""
import logging
from datetime import timedelta, date

import pandas as pd
import numpy as np
from sqlalchemy import text

from database import SessionLocal

log = logging.getLogger(__name__)


def run_forecast(run_id: str = "manual"):
    db = SessionLocal()
    try:
        log.info(f"[{run_id}] Starting ARIMA forecast …")

        rows = db.execute(text("""
            SELECT dt.date, SUM(fs.quantity * fs.unit_price * (1 - fs.discount_pct/100)) AS daily_revenue
            FROM fact_sales fs
            JOIN dim_time dt ON fs.time_id = dt.time_id
            WHERE fs.status = 'completed'
            GROUP BY dt.date
            ORDER BY dt.date
        """)).fetchall()

        if len(rows) < 30:
            log.warning(f"[{run_id}] Insufficient data for ARIMA ({len(rows)} days)")
            _fallback_forecast(db, run_id)
            return

        df = pd.DataFrame(rows, columns=["date", "revenue"])
        df["date"] = pd.to_datetime(df["date"])
        df = df.set_index("date").asfreq("D").fillna(method="ffill").fillna(0)

        try:
            from statsmodels.tsa.arima.model import ARIMA
            model = ARIMA(df["revenue"], order=(2, 1, 2))
            fit = model.fit()
            forecast = fit.forecast(steps=30)
            conf_int = fit.get_forecast(steps=30).conf_int()
        except Exception as arima_err:
            log.warning(f"[{run_id}] ARIMA failed ({arima_err}), using exponential smoothing fallback")
            _fallback_forecast(db, run_id)
            return

        db.execute(text("DELETE FROM ml_forecasts WHERE run_id != 'SEED_FORECAST_001'"))

        last_date = df.index[-1].date()
        for i, (pred, ci_row) in enumerate(zip(forecast, conf_int.values)):
            fdate = last_date + timedelta(days=i + 1)
            db.execute(text("""
                INSERT INTO ml_forecasts (forecast_date, predicted_value, lower_bound, upper_bound, model_version, run_id)
                VALUES (:d, :p, :lo, :hi, 'ARIMA', :run_id)
            """), {"d": fdate, "p": round(float(pred), 2),
                   "lo": round(float(ci_row[0]), 2), "hi": round(float(ci_row[1]), 2),
                   "run_id": run_id})

        db.commit()
        log.info(f"[{run_id}] Forecast complete (30 days).")

    except Exception as e:
        log.error(f"[{run_id}] Forecast failed: {e}")
        db.rollback()
    finally:
        db.close()


def _fallback_forecast(db, run_id: str):
    """Simple exponential-smoothing fallback."""
    from statsmodels.tsa.holtwinters import ExponentialSmoothing
    rows = db.execute(text("""
        SELECT dt.date, SUM(fs.quantity * fs.unit_price * (1 - fs.discount_pct/100)) AS revenue
        FROM fact_sales fs
        JOIN dim_time dt ON fs.time_id = dt.time_id
        WHERE fs.status = 'completed'
        GROUP BY dt.date ORDER BY dt.date
    """)).fetchall()
    if not rows:
        return
    df = pd.DataFrame(rows, columns=["date", "revenue"])
    df["date"] = pd.to_datetime(df["date"])
    df = df.set_index("date").asfreq("D").fillna(0)

    model = ExponentialSmoothing(df["revenue"], trend="add", seasonal=None)
    fit = model.fit()
    forecast = fit.forecast(30)

    db.execute(text("DELETE FROM ml_forecasts WHERE run_id != 'SEED_FORECAST_001'"))
    last_date = df.index[-1].date()
    for i, pred in enumerate(forecast):
        fdate = last_date + timedelta(days=i + 1)
        db.execute(text("""
            INSERT INTO ml_forecasts (forecast_date, predicted_value, model_version, run_id)
            VALUES (:d, :p, 'ExpSmoothing', :run_id)
        """), {"d": fdate, "p": round(float(pred), 2), "run_id": run_id})
    db.commit()
