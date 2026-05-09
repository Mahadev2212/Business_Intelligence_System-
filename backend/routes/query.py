from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from anomaly_detection import detect_anomalies
from forecasting import generate_forecast
from churn_prediction import predict_churn
from routes.auth import verify_token, TokenData

router = APIRouter()


class QueryRequest(BaseModel):
    query: str
    dataset: Optional[str] = "default"
    filters: Optional[Dict[str, Any]] = {}
    limit: Optional[int] = 100


class AnomalyRequest(BaseModel):
    data: List[float]
    sensitivity: Optional[float] = 0.05
    method: Optional[str] = "isolation_forest"


class ForecastRequest(BaseModel):
    data: List[float]
    periods: Optional[int] = 30
    frequency: Optional[str] = "D"


class ChurnRequest(BaseModel):
    customer_data: List[Dict[str, Any]]
    threshold: Optional[float] = 0.5


@router.post("/execute")
def execute_query(
    request: QueryRequest,
    token_data: TokenData = Depends(verify_token)
):
    """Execute a natural language or SQL-like query against the data."""
    try:
        # Placeholder — integrate with real DB or NLP-to-SQL engine
        result = {
            "query": request.query,
            "dataset": request.dataset,
            "rows_returned": 0,
            "data": [],
            "execution_time_ms": 12
        }
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/anomalies")
def run_anomaly_detection(
    request: AnomalyRequest,
    token_data: TokenData = Depends(verify_token)
):
    """Detect anomalies in the provided time-series data."""
    try:
        result = detect_anomalies(
            data=request.data,
            sensitivity=request.sensitivity,
            method=request.method
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/forecast")
def run_forecast(
    request: ForecastRequest,
    token_data: TokenData = Depends(verify_token)
):
    """Generate a time-series forecast for the provided data."""
    try:
        result = generate_forecast(
            data=request.data,
            periods=request.periods,
            frequency=request.frequency
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/churn")
def run_churn_prediction(
    request: ChurnRequest,
    token_data: TokenData = Depends(verify_token)
):
    """Predict customer churn probability."""
    try:
        result = predict_churn(
            customer_data=request.customer_data,
            threshold=request.threshold
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/datasets")
def list_datasets(token_data: TokenData = Depends(verify_token)):
    """List available datasets."""
    return {
        "datasets": [
            {"id": "sales", "name": "Sales Data", "rows": 15000},
            {"id": "customers", "name": "Customer Data", "rows": 8500},
            {"id": "inventory", "name": "Inventory Data", "rows": 3200},
            {"id": "financials", "name": "Financial Data", "rows": 24000},
        ]
    }
