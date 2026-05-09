-- ============================================================
--  Business Intelligence System — Main Database Schema
--  Database: PostgreSQL 15+
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ── Users ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
    id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    username      VARCHAR(50) UNIQUE NOT NULL,
    email         VARCHAR(255) UNIQUE NOT NULL,
    full_name     VARCHAR(150),
    password_hash TEXT        NOT NULL,
    role          VARCHAR(30) NOT NULL DEFAULT 'viewer',  -- admin | analyst | viewer
    is_active     BOOLEAN     NOT NULL DEFAULT TRUE,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── Customers ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS customers (
    id                      UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    external_id             VARCHAR(100) UNIQUE,
    name                    VARCHAR(200) NOT NULL,
    email                   VARCHAR(255),
    segment                 VARCHAR(50),   -- enterprise | mid-market | smb | startup
    tenure_months           INTEGER DEFAULT 0,
    monthly_charges         NUMERIC(10,2) DEFAULT 0,
    total_charges           NUMERIC(12,2) DEFAULT 0,
    num_products            INTEGER DEFAULT 1,
    support_calls           INTEGER DEFAULT 0,
    days_since_last_purchase INTEGER DEFAULT 0,
    satisfaction_score      NUMERIC(3,1) DEFAULT 5.0,
    churn_probability       NUMERIC(5,4),
    churn_predicted_at      TIMESTAMPTZ,
    created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── Sales / Transactions ──────────────────────────────────
CREATE TABLE IF NOT EXISTS transactions (
    id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id   UUID        REFERENCES customers(id) ON DELETE SET NULL,
    amount        NUMERIC(12,2) NOT NULL,
    currency      CHAR(3)     NOT NULL DEFAULT 'USD',
    product_id    VARCHAR(100),
    channel       VARCHAR(50),  -- web | mobile | in-store | partner
    status        VARCHAR(30)  NOT NULL DEFAULT 'completed',
    occurred_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── Anomaly Detection Results ─────────────────────────────
CREATE TABLE IF NOT EXISTS anomaly_results (
    id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    dataset_name  VARCHAR(100),
    method        VARCHAR(50),
    detected_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    total_points  INTEGER,
    anomaly_count INTEGER,
    anomaly_indices JSONB,
    anomaly_values  JSONB,
    summary_stats   JSONB,
    created_by    UUID REFERENCES users(id)
);

-- ── Forecast Results ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS forecast_results (
    id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    dataset_name  VARCHAR(100),
    method        VARCHAR(50),
    frequency     CHAR(1)    DEFAULT 'D',
    periods       INTEGER,
    forecast_data JSONB,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by    UUID REFERENCES users(id)
);

-- ── Indexes ────────────────────────────────────────────────
CREATE INDEX idx_transactions_customer   ON transactions(customer_id);
CREATE INDEX idx_transactions_occurred   ON transactions(occurred_at DESC);
CREATE INDEX idx_customers_segment       ON customers(segment);
CREATE INDEX idx_anomaly_results_date    ON anomaly_results(detected_at DESC);
CREATE INDEX idx_forecast_results_date   ON forecast_results(created_at DESC);

-- ── Seed admin user ───────────────────────────────────────
INSERT INTO users (username, email, full_name, password_hash, role)
VALUES ('admin', 'admin@example.com', 'Admin User', 'REPLACE_WITH_BCRYPT_HASH', 'admin')
ON CONFLICT (username) DO NOTHING;
