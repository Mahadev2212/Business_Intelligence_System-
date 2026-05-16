-- ============================================================
-- AI-Powered Secure BI System — Database Schema
-- Star Schema + RBAC + AES-256 Encryption via pgcrypto
-- ============================================================

-- Enable pgcrypto for AES-256 column encryption
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ============================================================
-- 1. AUTHENTICATION & RBAC
-- ============================================================

-- PostgreSQL database-level roles (RBAC)
DO $$ BEGIN
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'bi_admin')   THEN CREATE ROLE bi_admin;   END IF;
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'bi_manager') THEN CREATE ROLE bi_manager; END IF;
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'bi_viewer')  THEN CREATE ROLE bi_viewer;  END IF;
END $$;

-- Application users table (passwords hashed with bcrypt at app layer)
CREATE TABLE IF NOT EXISTS users (
    user_id       SERIAL PRIMARY KEY,
    username      VARCHAR(50)  UNIQUE NOT NULL,
    email         VARCHAR(150) UNIQUE NOT NULL,
    password_hash TEXT         NOT NULL,
    role          VARCHAR(20)  NOT NULL DEFAULT 'viewer'
                    CHECK (role IN ('admin', 'manager', 'viewer')),
    is_active     BOOLEAN      NOT NULL DEFAULT TRUE,
    last_login    TIMESTAMPTZ,
    created_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- ============================================================
-- 2. STAR SCHEMA — DIMENSION TABLES
-- ============================================================

-- dim_time: calendar dimension for time-series analysis
CREATE TABLE IF NOT EXISTS dim_time (
    time_id   SERIAL PRIMARY KEY,
    date      DATE    NOT NULL UNIQUE,
    week      INTEGER NOT NULL,
    month     INTEGER NOT NULL,
    quarter   INTEGER NOT NULL,
    year      INTEGER NOT NULL,
    day_name  VARCHAR(10),
    is_weekend BOOLEAN DEFAULT FALSE
);

-- dim_customers: customer master data with AES-256 encrypted PII
CREATE TABLE IF NOT EXISTS dim_customers (
    customer_id  SERIAL PRIMARY KEY,
    name         VARCHAR(150) NOT NULL,
    email        BYTEA,          -- pgp_sym_encrypt(email, key)
    phone        BYTEA,          -- pgp_sym_encrypt(phone, key)
    segment      VARCHAR(50)  DEFAULT 'Standard',  -- Premium / Standard / Budget
    region_id    INTEGER,
    join_date    DATE         NOT NULL DEFAULT CURRENT_DATE,
    created_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- dim_products: product catalogue
CREATE TABLE IF NOT EXISTS dim_products (
    product_id   SERIAL PRIMARY KEY,
    name         VARCHAR(200) NOT NULL,
    category     VARCHAR(100),
    sub_category VARCHAR(100),
    unit_price   NUMERIC(10,2) NOT NULL CHECK (unit_price >= 0),
    cost_price   NUMERIC(10,2) CHECK (cost_price >= 0),
    is_active    BOOLEAN DEFAULT TRUE,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- dim_regions: geographic dimension
CREATE TABLE IF NOT EXISTS dim_regions (
    region_id SERIAL PRIMARY KEY,
    city      VARCHAR(100),
    state     VARCHAR(100),
    country   VARCHAR(100) NOT NULL DEFAULT 'India',
    zone      VARCHAR(50)
);

-- ============================================================
-- 3. STAR SCHEMA — FACT TABLE
-- ============================================================

CREATE TABLE IF NOT EXISTS fact_sales (
    sale_id      SERIAL PRIMARY KEY,
    customer_id  INTEGER NOT NULL REFERENCES dim_customers(customer_id),
    product_id   INTEGER NOT NULL REFERENCES dim_products(product_id),
    time_id      INTEGER NOT NULL REFERENCES dim_time(time_id),
    region_id    INTEGER          REFERENCES dim_regions(region_id),
    quantity     INTEGER  NOT NULL CHECK (quantity > 0),
    unit_price   NUMERIC(10,2) NOT NULL,
    discount_pct NUMERIC(5,2)  DEFAULT 0 CHECK (discount_pct BETWEEN 0 AND 100),
    amount       NUMERIC(12,2) GENERATED ALWAYS AS
                   (quantity * unit_price * (1 - discount_pct / 100)) STORED,
    status       VARCHAR(20) DEFAULT 'completed'
                   CHECK (status IN ('completed','pending','cancelled','refunded')),
    created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- 4. ML OUTPUT TABLES
-- ============================================================

-- Isolation Forest anomaly detection results
CREATE TABLE IF NOT EXISTS ml_anomalies (
    anomaly_id    SERIAL PRIMARY KEY,
    sale_id       INTEGER REFERENCES fact_sales(sale_id),
    anomaly_score NUMERIC(8,6) NOT NULL,
    is_flagged    BOOLEAN      NOT NULL DEFAULT FALSE,
    method        VARCHAR(50)  DEFAULT 'IsolationForest',
    flagged_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    run_id        VARCHAR(50)
);

-- ARIMA / Statsmodels forecast output
CREATE TABLE IF NOT EXISTS ml_forecasts (
    forecast_id      SERIAL PRIMARY KEY,
    forecast_date    DATE         NOT NULL,
    predicted_value  NUMERIC(14,2) NOT NULL,
    lower_bound      NUMERIC(14,2),
    upper_bound      NUMERIC(14,2),
    model_version    VARCHAR(50)  DEFAULT 'ARIMA',
    created_at       TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    run_id           VARCHAR(50)
);

-- RFM-based churn prediction
CREATE TABLE IF NOT EXISTS ml_churn_scores (
    score_id      SERIAL PRIMARY KEY,
    customer_id   INTEGER      NOT NULL REFERENCES dim_customers(customer_id),
    churn_prob    NUMERIC(6,4) NOT NULL CHECK (churn_prob BETWEEN 0 AND 1),
    risk_label    VARCHAR(20)  NOT NULL CHECK (risk_label IN ('Low','Medium','High')),
    rfm_score     NUMERIC(6,2),
    model_version VARCHAR(50)  DEFAULT 'RandomForest_v1',
    scored_at     TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    run_id        VARCHAR(50)
);

-- ============================================================
-- 5. SECURITY & AUDIT
-- ============================================================

CREATE TABLE IF NOT EXISTS security_logs (
    log_id      SERIAL PRIMARY KEY,
    user_id     INTEGER      REFERENCES users(user_id),
    username    VARCHAR(50),
    event_type  VARCHAR(50)  NOT NULL,
    -- e.g. LOGIN_SUCCESS, LOGIN_FAIL, LOGOUT, NL_QUERY, ANOMALY_RUN, INJECTION_BLOCKED
    ip_address  INET,
    user_agent  TEXT,
    payload     JSONB,        -- sanitised event payload
    status_code INTEGER,
    created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- NL-to-SQL query history
CREATE TABLE IF NOT EXISTS query_history (
    query_id       SERIAL PRIMARY KEY,
    user_id        INTEGER  NOT NULL REFERENCES users(user_id),
    nl_question    TEXT     NOT NULL,
    generated_sql  TEXT     NOT NULL,
    row_count      INTEGER,
    exec_time_ms   INTEGER,
    success        BOOLEAN  DEFAULT TRUE,
    created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- 6. INDEXES for query performance
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_fact_sales_time     ON fact_sales(time_id);
CREATE INDEX IF NOT EXISTS idx_fact_sales_customer ON fact_sales(customer_id);
CREATE INDEX IF NOT EXISTS idx_fact_sales_created  ON fact_sales(created_at);
CREATE INDEX IF NOT EXISTS idx_anomalies_flagged   ON ml_anomalies(is_flagged);
CREATE INDEX IF NOT EXISTS idx_churn_risk          ON ml_churn_scores(risk_label);
CREATE INDEX IF NOT EXISTS idx_security_logs_user  ON security_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_security_logs_type  ON security_logs(event_type);
CREATE INDEX IF NOT EXISTS idx_security_logs_time  ON security_logs(created_at);

-- ============================================================
-- 7. RBAC — Grant permissions
-- ============================================================

GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO bi_admin;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO bi_admin;

GRANT SELECT ON dim_customers, dim_products, dim_regions, dim_time,
               fact_sales, ml_anomalies, ml_forecasts, ml_churn_scores TO bi_manager;
GRANT INSERT, UPDATE ON fact_sales, ml_anomalies, ml_forecasts, ml_churn_scores TO bi_manager;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO bi_manager;

GRANT SELECT ON dim_customers, dim_products, dim_regions, dim_time,
               fact_sales, ml_anomalies, ml_forecasts, ml_churn_scores TO bi_viewer;
