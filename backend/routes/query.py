# backend/routes/query.py
"""
Natural Language → SQL endpoint (FR-13 to FR-17)
  POST /api/v1/query/nl   - accepts English question, returns data + SQL
  GET  /api/v1/query/history - returns query history for current user
"""
import re
import time
from typing import Any

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import text
from sqlalchemy.orm import Session

from config import get_settings
from database import get_db
from models.orm import User, QueryHistory, SecurityLog
from services.auth_service import require_manager

router = APIRouter(prefix="/query", tags=["NL Query"])
settings = get_settings()

# Tables the NL engine is allowed to touch (read-only whitelist)
ALLOWED_TABLES = {
    "fact_sales", "dim_customers", "dim_products",
    "dim_regions", "dim_time", "ml_anomalies",
    "ml_forecasts", "ml_churn_scores",
}

# SQL injection / destructive keyword guard
BLOCKED_PATTERNS = re.compile(
    r"\b(DROP|DELETE|INSERT|UPDATE|ALTER|TRUNCATE|GRANT|REVOKE|EXEC|EXECUTE|"
    r"xp_|sp_|UNION\s+ALL|INTO\s+OUTFILE|LOAD_FILE)\b",
    re.IGNORECASE,
)


def _validate_sql(sql: str) -> str:
    """
    Reject any SQL that is not a plain SELECT or contains dangerous keywords.
    Raises HTTPException on violation.
    """
    clean = sql.strip().rstrip(";")
    if not clean.upper().startswith("SELECT"):
        raise HTTPException(status_code=400, detail="Only SELECT queries are permitted")
    if BLOCKED_PATTERNS.search(clean):
        raise HTTPException(status_code=400, detail="Query blocked: destructive or injection pattern detected")
    return clean


async def _nl_to_sql(question: str) -> str:
    """
    Call OpenAI GPT-4o to translate a natural language question into a SQL
    SELECT statement constrained to the BI star schema.

    Falls back to a simple heuristic if no API key is configured.
    """
    schema_hint = """
Tables: fact_sales(sale_id, customer_id, product_id, time_id, region_id, quantity, unit_price, discount_pct, amount, status, created_at),
dim_customers(customer_id, name, segment, region_id, join_date),
dim_products(product_id, name, category, unit_price),
dim_time(time_id, date, week, month, quarter, year),
dim_regions(region_id, city, state, country, zone),
ml_anomalies(anomaly_id, sale_id, anomaly_score, is_flagged),
ml_forecasts(forecast_id, forecast_date, predicted_value),
ml_churn_scores(score_id, customer_id, churn_prob, risk_label)
"""
    if not settings.OPENAI_API_KEY:
        # Simple heuristic fallback for demo when no API key is set
        q_lower = question.lower()
        if "revenue" in q_lower:
            return "SELECT ROUND(SUM(amount)::numeric,2) AS total_revenue FROM fact_sales WHERE status='completed'"
        if "anomal" in q_lower:
            return "SELECT * FROM ml_anomalies WHERE is_flagged=TRUE ORDER BY anomaly_score DESC LIMIT 20"
        if "churn" in q_lower:
            return "SELECT customer_id, churn_prob, risk_label FROM ml_churn_scores ORDER BY churn_prob DESC LIMIT 20"
        if "forecast" in q_lower:
            return "SELECT forecast_date, predicted_value FROM ml_forecasts ORDER BY forecast_date LIMIT 30"
        return "SELECT * FROM fact_sales ORDER BY created_at DESC LIMIT 10"

    import httpx
    system_prompt = (
        "You are a SQL generator. Given a natural language question, produce ONLY a valid PostgreSQL "
        "SELECT statement using these tables:\n" + schema_hint +
        "\nRules: only SELECT, no subqueries modifying data, LIMIT 200 max, return ONLY the SQL."
    )
    async with httpx.AsyncClient(timeout=20) as client:
        resp = await client.post(
            "https://api.openai.com/v1/chat/completions",
            headers={"Authorization": f"Bearer {settings.OPENAI_API_KEY}"},
            json={
                "model": settings.OPENAI_MODEL,
                "messages": [
                    {"role": "system", "content": system_prompt},
                    {"role": "user",   "content": question},
                ],
                "temperature": 0,
                "max_tokens": 300,
            },
        )
    resp.raise_for_status()
    sql = resp.json()["choices"][0]["message"]["content"].strip()
    # Strip markdown fences if present
    sql = re.sub(r"```sql|```", "", sql).strip()
    return sql


# ---- Pydantic schemas -----------------------------------------------

class NLQueryRequest(BaseModel):
    question: str


# ---- Endpoints ------------------------------------------------------

@router.post("/nl")
async def nl_query(
    body: NLQueryRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_manager),
):
    """Translate a natural-language question to SQL and return results."""
    if not body.question.strip():
        raise HTTPException(status_code=400, detail="Question cannot be empty")

    raw_sql = await _nl_to_sql(body.question)
    safe_sql = _validate_sql(raw_sql)

    start = time.monotonic()
    try:
        result = db.execute(text(safe_sql))
        rows = [dict(r._mapping) for r in result.fetchall()]
        exec_ms = int((time.monotonic() - start) * 1000)
        success = True
    except Exception as exc:
        exec_ms = int((time.monotonic() - start) * 1000)
        # Log the failure
        db.add(SecurityLog(
            user_id=current_user.user_id,
            username=current_user.username,
            event_type="NL_QUERY_ERROR",
            payload={"question": body.question, "sql": safe_sql, "error": str(exc)},
            status_code=500,
        ))
        db.commit()
        raise HTTPException(status_code=500, detail=f"Query execution failed: {exc}")

    # Persist query history (FR-16)
    db.add(QueryHistory(
        user_id=current_user.user_id,
        nl_question=body.question,
        generated_sql=safe_sql,
        row_count=len(rows),
        exec_time_ms=exec_ms,
        success=success,
    ))
    db.add(SecurityLog(
        user_id=current_user.user_id,
        username=current_user.username,
        event_type="NL_QUERY",
        payload={"question": body.question, "row_count": len(rows)},
        status_code=200,
    ))
    db.commit()

    return {
        "question":    body.question,
        "sql":         safe_sql,   # FR-17: transparency
        "rows":        rows[:200],
        "row_count":   len(rows),
        "exec_time_ms": exec_ms,
    }


@router.get("/history")
async def query_history(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_manager),
    limit: int = 20,
):
    rows = (
        db.query(QueryHistory)
        .filter(QueryHistory.user_id == current_user.user_id)
        .order_by(QueryHistory.created_at.desc())
        .limit(limit)
        .all()
    )
    return [
        {
            "query_id":     r.query_id,
            "nl_question":  r.nl_question,
            "generated_sql": r.generated_sql,
            "row_count":    r.row_count,
            "exec_time_ms": r.exec_time_ms,
            "created_at":   str(r.created_at),
        }
        for r in rows
    ]
