# backend/routes/dashboard.py
"""
Dashboard & analytics endpoints:
  GET /api/v1/dashboard/kpis          - KPI summary cards
  GET /api/v1/dashboard/charts        - Revenue / regional chart data
  GET /api/v1/dashboard/anomalies     - Flagged anomalies
  GET /api/v1/dashboard/forecast      - 30-day sales forecast
  GET /api/v1/dashboard/churn         - Customer churn scores
"""
from typing import Optional
from datetime import date

from fastapi import APIRouter, Depends, Query
from sqlalchemy import func, text
from sqlalchemy.orm import Session

from database import get_db
from models.orm import FactSales, DimTime, MlAnomaly, MlForecast, MlChurnScore, User
from services.auth_service import require_viewer, require_manager

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])


# ---- KPI Cards (FR-08) -----------------------------------------------

@router.get("/kpis")
async def get_kpis(
    db: Session = Depends(get_db),
    _user: User = Depends(require_viewer),
):
    total_revenue = db.query(func.sum(
        FactSales.quantity * FactSales.unit_price * (1 - FactSales.discount_pct / 100)
    )).scalar() or 0

    active_customers = db.query(func.count(func.distinct(FactSales.customer_id))).scalar() or 0

    anomaly_count = db.query(func.count(MlAnomaly.anomaly_id)).filter(
        MlAnomaly.is_flagged == True
    ).scalar() or 0

    # Average churn probability for high-risk customers
    high_risk_count = db.query(func.count(MlChurnScore.score_id)).filter(
        MlChurnScore.risk_label == "High"
    ).scalar() or 0

    avg_churn = db.query(func.avg(MlChurnScore.churn_prob)).scalar()
    avg_churn = round(float(avg_churn) * 100, 1) if avg_churn else 0.0

    return {
        "total_revenue":    round(float(total_revenue), 2),
        "active_customers": active_customers,
        "anomaly_count":    anomaly_count,
        "high_risk_count":  high_risk_count,
        "avg_churn_pct":    avg_churn,
    }


# ---- Revenue / Chart Data (FR-09) ------------------------------------

@router.get("/charts")
async def get_charts(
    db: Session = Depends(get_db),
    _user: User = Depends(require_viewer),
    from_date: Optional[date] = Query(None),
    to_date:   Optional[date] = Query(None),
):
    """Returns monthly revenue and regional breakdown for line/bar/pie charts."""

    # Monthly revenue (line chart)
    monthly_q = """
        SELECT
            dt.year,
            dt.month,
            ROUND(SUM(fs.quantity * fs.unit_price * (1 - fs.discount_pct / 100))::numeric, 2) AS revenue
        FROM fact_sales fs
        JOIN dim_time dt ON fs.time_id = dt.time_id
        WHERE fs.status = 'completed'
          AND (:from_date IS NULL OR dt.date >= :from_date)
          AND (:to_date   IS NULL OR dt.date <= :to_date)
        GROUP BY dt.year, dt.month
        ORDER BY dt.year, dt.month
    """
    monthly_rows = db.execute(
        text(monthly_q), {"from_date": from_date, "to_date": to_date}
    ).fetchall()

    monthly = [
        {"label": f"{r.year}-{r.month:02d}", "revenue": float(r.revenue)}
        for r in monthly_rows
    ]

    # Regional revenue (pie chart)
    regional_q = """
        SELECT
            COALESCE(dr.zone, 'Unknown') AS zone,
            ROUND(SUM(fs.quantity * fs.unit_price * (1 - fs.discount_pct / 100))::numeric, 2) AS revenue
        FROM fact_sales fs
        LEFT JOIN dim_regions dr ON fs.region_id = dr.region_id
        WHERE fs.status = 'completed'
        GROUP BY dr.zone
        ORDER BY revenue DESC
    """
    region_rows = db.execute(text(regional_q)).fetchall()
    regional = [{"zone": r.zone, "revenue": float(r.revenue)} for r in region_rows]

    # Top 5 products (bar chart)
    product_q = """
        SELECT
            dp.name AS product,
            SUM(fs.quantity) AS units_sold
        FROM fact_sales fs
        JOIN dim_products dp ON fs.product_id = dp.product_id
        WHERE fs.status = 'completed'
        GROUP BY dp.name
        ORDER BY units_sold DESC
        LIMIT 5
    """
    product_rows = db.execute(text(product_q)).fetchall()
    top_products = [{"product": r.product, "units": int(r.units_sold)} for r in product_rows]

    return {"monthly": monthly, "regional": regional, "top_products": top_products}


# ---- Anomalies (FR-18, FR-19) ----------------------------------------

@router.get("/anomalies")
async def get_anomalies(
    db: Session = Depends(get_db),
    _user: User = Depends(require_manager),
    limit: int = Query(50, le=200),
):
    rows = db.execute(text("""
        SELECT
            a.anomaly_id,
            a.sale_id,
            a.anomaly_score,
            a.method,
            a.flagged_at,
            fs.quantity,
            fs.unit_price,
            fs.discount_pct,
            dc.name AS customer_name
        FROM ml_anomalies a
        JOIN fact_sales fs ON a.sale_id = fs.sale_id
        JOIN dim_customers dc ON fs.customer_id = dc.customer_id
        WHERE a.is_flagged = TRUE
        ORDER BY a.anomaly_score DESC
        LIMIT :limit
    """), {"limit": limit}).fetchall()

    return [dict(r._mapping) for r in rows]


# ---- Forecast (FR-20) ------------------------------------------------

@router.get("/forecast")
async def get_forecast(
    db: Session = Depends(get_db),
    _user: User = Depends(require_manager),
):
    rows = db.query(MlForecast).order_by(MlForecast.forecast_date).limit(30).all()
    return [
        {
            "date":      str(r.forecast_date),
            "predicted": float(r.predicted_value),
            "lower":     float(r.lower_bound) if r.lower_bound else None,
            "upper":     float(r.upper_bound) if r.upper_bound else None,
        }
        for r in rows
    ]


# ---- Churn Scores (FR-21) --------------------------------------------

@router.get("/churn")
async def get_churn(
    db: Session = Depends(get_db),
    _user: User = Depends(require_manager),
    risk: Optional[str] = Query(None),
):
    q = db.query(MlChurnScore)
    if risk:
        q = q.filter(MlChurnScore.risk_label == risk)
    rows = q.order_by(MlChurnScore.churn_prob.desc()).limit(100).all()

    return [
        {
            "customer_id": r.customer_id,
            "churn_prob":  float(r.churn_prob),
            "risk_label":  r.risk_label,
            "rfm_score":   float(r.rfm_score) if r.rfm_score else None,
            "scored_at":   str(r.scored_at),
        }
        for r in rows
    ]
