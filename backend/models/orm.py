# backend/models/orm.py
from sqlalchemy import (
    Column, Integer, String, Boolean, Date, DateTime,
    Numeric, ForeignKey, Text, LargeBinary, func
)
from sqlalchemy.dialects.postgresql import BYTEA, JSONB, INET
from sqlalchemy.orm import relationship
from database import Base


class User(Base):
    __tablename__ = "users"

    user_id       = Column(Integer, primary_key=True, index=True)
    username      = Column(String(50),  unique=True, nullable=False, index=True)
    email         = Column(String(150), unique=True, nullable=False)
    password_hash = Column(Text, nullable=False)
    role          = Column(String(20), nullable=False, default="viewer")
    is_active     = Column(Boolean, default=True)
    last_login    = Column(DateTime(timezone=True))
    created_at    = Column(DateTime(timezone=True), server_default=func.now())
    updated_at    = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())


class DimCustomer(Base):
    __tablename__ = "dim_customers"

    customer_id = Column(Integer, primary_key=True)
    name        = Column(String(150), nullable=False)
    email       = Column(BYTEA)      # AES-256 encrypted via pgcrypto
    phone       = Column(BYTEA)
    segment     = Column(String(50), default="Standard")
    region_id   = Column(Integer, ForeignKey("dim_regions.region_id"))
    join_date   = Column(Date, default=func.current_date())
    created_at  = Column(DateTime(timezone=True), server_default=func.now())


class DimProduct(Base):
    __tablename__ = "dim_products"

    product_id   = Column(Integer, primary_key=True)
    name         = Column(String(200), nullable=False)
    category     = Column(String(100))
    sub_category = Column(String(100))
    unit_price   = Column(Numeric(10, 2), nullable=False)
    cost_price   = Column(Numeric(10, 2))
    is_active    = Column(Boolean, default=True)
    created_at   = Column(DateTime(timezone=True), server_default=func.now())


class DimRegion(Base):
    __tablename__ = "dim_regions"

    region_id = Column(Integer, primary_key=True)
    city      = Column(String(100))
    state     = Column(String(100))
    country   = Column(String(100), default="India")
    zone      = Column(String(50))


class DimTime(Base):
    __tablename__ = "dim_time"

    time_id    = Column(Integer, primary_key=True)
    date       = Column(Date, unique=True, nullable=False)
    week       = Column(Integer)
    month      = Column(Integer)
    quarter    = Column(Integer)
    year       = Column(Integer)
    day_name   = Column(String(10))
    is_weekend = Column(Boolean, default=False)


class FactSales(Base):
    __tablename__ = "fact_sales"

    sale_id      = Column(Integer, primary_key=True)
    customer_id  = Column(Integer, ForeignKey("dim_customers.customer_id"), nullable=False)
    product_id   = Column(Integer, ForeignKey("dim_products.product_id"), nullable=False)
    time_id      = Column(Integer, ForeignKey("dim_time.time_id"), nullable=False)
    region_id    = Column(Integer, ForeignKey("dim_regions.region_id"))
    quantity     = Column(Integer, nullable=False)
    unit_price   = Column(Numeric(10, 2), nullable=False)
    discount_pct = Column(Numeric(5, 2), default=0)
    # amount is a generated column — not mapped as writable
    status       = Column(String(20), default="completed")
    created_at   = Column(DateTime(timezone=True), server_default=func.now())


class MlAnomaly(Base):
    __tablename__ = "ml_anomalies"

    anomaly_id    = Column(Integer, primary_key=True)
    sale_id       = Column(Integer, ForeignKey("fact_sales.sale_id"))
    anomaly_score = Column(Numeric(8, 6), nullable=False)
    is_flagged    = Column(Boolean, default=False)
    method        = Column(String(50), default="IsolationForest")
    flagged_at    = Column(DateTime(timezone=True), server_default=func.now())
    run_id        = Column(String(50))


class MlForecast(Base):
    __tablename__ = "ml_forecasts"

    forecast_id     = Column(Integer, primary_key=True)
    forecast_date   = Column(Date, nullable=False)
    predicted_value = Column(Numeric(14, 2), nullable=False)
    lower_bound     = Column(Numeric(14, 2))
    upper_bound     = Column(Numeric(14, 2))
    model_version   = Column(String(50), default="ARIMA")
    created_at      = Column(DateTime(timezone=True), server_default=func.now())
    run_id          = Column(String(50))


class MlChurnScore(Base):
    __tablename__ = "ml_churn_scores"

    score_id      = Column(Integer, primary_key=True)
    customer_id   = Column(Integer, ForeignKey("dim_customers.customer_id"), nullable=False)
    churn_prob    = Column(Numeric(6, 4), nullable=False)
    risk_label    = Column(String(20), nullable=False)
    rfm_score     = Column(Numeric(6, 2))
    model_version = Column(String(50), default="RandomForest_v1")
    scored_at     = Column(DateTime(timezone=True), server_default=func.now())
    run_id        = Column(String(50))


class SecurityLog(Base):
    __tablename__ = "security_logs"

    log_id      = Column(Integer, primary_key=True)
    user_id     = Column(Integer, ForeignKey("users.user_id"))
    username    = Column(String(50))
    event_type  = Column(String(50), nullable=False)
    ip_address  = Column(INET)
    user_agent  = Column(Text)
    payload     = Column(JSONB)
    status_code = Column(Integer)
    created_at  = Column(DateTime(timezone=True), server_default=func.now())


class QueryHistory(Base):
    __tablename__ = "query_history"

    query_id      = Column(Integer, primary_key=True)
    user_id       = Column(Integer, ForeignKey("users.user_id"), nullable=False)
    nl_question   = Column(Text, nullable=False)
    generated_sql = Column(Text, nullable=False)
    row_count     = Column(Integer)
    exec_time_ms  = Column(Integer)
    success       = Column(Boolean, default=True)
    created_at    = Column(DateTime(timezone=True), server_default=func.now())
