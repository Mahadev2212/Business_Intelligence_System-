-- ============================================================
--  Business Intelligence System — Security & Audit Schema
--  Append to main database after running init.sql
-- ============================================================

-- ── Security Logs ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS security_logs (
    id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    event_type    VARCHAR(100) NOT NULL,
    severity      VARCHAR(20)  NOT NULL CHECK (severity IN ('critical','high','medium','low','info')),
    user_id       UUID        REFERENCES users(id) ON DELETE SET NULL,
    username      VARCHAR(50),
    ip_address    INET,
    user_agent    TEXT,
    resource      VARCHAR(255),
    status        VARCHAR(20)  NOT NULL DEFAULT 'open' CHECK (status IN ('open','resolved','ignored')),
    details       JSONB,
    resolved_by   UUID REFERENCES users(id),
    resolved_at   TIMESTAMPTZ,
    occurred_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── Audit Trail ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS audit_trail (
    id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id       UUID        REFERENCES users(id) ON DELETE SET NULL,
    action        VARCHAR(100) NOT NULL,   -- CREATE | READ | UPDATE | DELETE | EXPORT | LOGIN | LOGOUT
    entity_type   VARCHAR(100),           -- e.g. 'customer', 'report', 'user'
    entity_id     UUID,
    old_value     JSONB,
    new_value     JSONB,
    ip_address    INET,
    occurred_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── Session Tokens ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS sessions (
    id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id       UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash    TEXT        NOT NULL UNIQUE,
    ip_address    INET,
    user_agent    TEXT,
    is_active     BOOLEAN     NOT NULL DEFAULT TRUE,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at    TIMESTAMPTZ NOT NULL,
    last_used_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── Role Permissions ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS role_permissions (
    id            SERIAL PRIMARY KEY,
    role          VARCHAR(30)  NOT NULL,
    resource      VARCHAR(100) NOT NULL,
    action        VARCHAR(50)  NOT NULL,
    allowed       BOOLEAN      NOT NULL DEFAULT TRUE,
    UNIQUE (role, resource, action)
);

-- ── Indexes ────────────────────────────────────────────────
CREATE INDEX idx_security_logs_severity   ON security_logs(severity);
CREATE INDEX idx_security_logs_occurred   ON security_logs(occurred_at DESC);
CREATE INDEX idx_security_logs_status     ON security_logs(status);
CREATE INDEX idx_audit_trail_user         ON audit_trail(user_id);
CREATE INDEX idx_audit_trail_occurred     ON audit_trail(occurred_at DESC);
CREATE INDEX idx_sessions_user            ON sessions(user_id);
CREATE INDEX idx_sessions_token           ON sessions(token_hash);

-- ── Seed default role permissions ────────────────────────
INSERT INTO role_permissions (role, resource, action, allowed) VALUES
  ('admin',    '*',            '*',      TRUE),
  ('analyst',  'dashboard',    'read',   TRUE),
  ('analyst',  'anomalies',    'read',   TRUE),
  ('analyst',  'forecast',     'read',   TRUE),
  ('analyst',  'churn',        'read',   TRUE),
  ('analyst',  'security',     'read',   FALSE),
  ('viewer',   'dashboard',    'read',   TRUE),
  ('viewer',   'security',     'read',   FALSE),
  ('viewer',   'export',       '*',      FALSE)
ON CONFLICT (role, resource, action) DO NOTHING;
