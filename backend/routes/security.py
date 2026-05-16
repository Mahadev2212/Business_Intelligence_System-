# backend/routes/security.py
"""
Security / Audit log endpoint (FR-26, FR-27)
  GET /api/v1/security/logs  - Admin only, filterable by user/event/date
"""
from typing import Optional
from datetime import date

from fastapi import APIRouter, Depends, Query
from sqlalchemy import and_
from sqlalchemy.orm import Session

from database import get_db
from models.orm import SecurityLog, User
from services.auth_service import require_admin

router = APIRouter(prefix="/security", tags=["Security Logs"])


@router.get("/logs")
async def get_logs(
    db: Session = Depends(get_db),
    _admin: User = Depends(require_admin),
    event_type: Optional[str] = Query(None),
    username:   Optional[str] = Query(None),
    from_date:  Optional[date] = Query(None),
    to_date:    Optional[date] = Query(None),
    page:       int = Query(1, ge=1),
    page_size:  int = Query(50, le=200),
):
    q = db.query(SecurityLog)

    filters = []
    if event_type:
        filters.append(SecurityLog.event_type.ilike(f"%{event_type}%"))
    if username:
        filters.append(SecurityLog.username.ilike(f"%{username}%"))
    if from_date:
        filters.append(SecurityLog.created_at >= from_date)
    if to_date:
        filters.append(SecurityLog.created_at <= to_date)

    if filters:
        q = q.filter(and_(*filters))

    total = q.count()
    rows = (
        q.order_by(SecurityLog.created_at.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
        .all()
    )

    return {
        "total": total,
        "page": page,
        "page_size": page_size,
        "logs": [
            {
                "log_id":     r.log_id,
                "user_id":    r.user_id,
                "username":   r.username,
                "event_type": r.event_type,
                "ip_address": str(r.ip_address) if r.ip_address else None,
                "payload":    r.payload,
                "status_code": r.status_code,
                "created_at": str(r.created_at),
            }
            for r in rows
        ],
    }
