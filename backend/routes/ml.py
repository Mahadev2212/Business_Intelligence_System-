# backend/routes/ml.py
"""
ML pipeline trigger endpoints (Admin only):
  POST /api/v1/ml/anomaly/run   - Runs IsolationForest on fact_sales
  POST /api/v1/ml/forecast/run  - Runs ARIMA forecast
  POST /api/v1/ml/churn/run     - Runs RFM + RandomForest churn model
"""
import uuid
from fastapi import APIRouter, Depends, BackgroundTasks
from sqlalchemy.orm import Session

from database import get_db
from models.orm import User
from services.auth_service import require_admin
from ml.anomaly import run_anomaly_detection
from ml.forecasting import run_forecast
from ml.churn import run_churn_prediction

router = APIRouter(prefix="/ml", tags=["ML Pipelines"])


@router.post("/anomaly/run")
async def trigger_anomaly(
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    _admin: User = Depends(require_admin),
):
    run_id = str(uuid.uuid4())[:8]
    background_tasks.add_task(run_anomaly_detection, run_id)
    return {"message": "Anomaly detection started", "run_id": run_id}


@router.post("/forecast/run")
async def trigger_forecast(
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    _admin: User = Depends(require_admin),
):
    run_id = str(uuid.uuid4())[:8]
    background_tasks.add_task(run_forecast, run_id)
    return {"message": "Forecast job started", "run_id": run_id}


@router.post("/churn/run")
async def trigger_churn(
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    _admin: User = Depends(require_admin),
):
    run_id = str(uuid.uuid4())[:8]
    background_tasks.add_task(run_churn_prediction, run_id)
    return {"message": "Churn prediction started", "run_id": run_id}
