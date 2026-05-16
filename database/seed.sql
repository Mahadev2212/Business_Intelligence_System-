-- ============================================================
-- seed.sql — Demo data for AI-Powered Secure BI System
-- Run AFTER init.sql
-- ============================================================

-- ---- dim_time (populate 2023-01-01 to 2025-12-31) ----------
INSERT INTO dim_time (date, week, month, quarter, year, day_name, is_weekend)
SELECT
    d::date,
    EXTRACT(WEEK  FROM d)::int,
    EXTRACT(MONTH FROM d)::int,
    EXTRACT(QUARTER FROM d)::int,
    EXTRACT(YEAR  FROM d)::int,
    TO_CHAR(d, 'Day'),
    EXTRACT(DOW FROM d) IN (0, 6)
FROM generate_series('2023-01-01'::date, '2025-12-31'::date, '1 day') AS d
ON CONFLICT (date) DO NOTHING;

-- ---- dim_regions -------------------------------------------
INSERT INTO dim_regions (city, state, country, zone) VALUES
  ('Bengaluru',  'Karnataka',      'India', 'South'),
  ('Mumbai',     'Maharashtra',    'India', 'West'),
  ('Delhi',      'Delhi',          'India', 'North'),
  ('Chennai',    'Tamil Nadu',     'India', 'South'),
  ('Hyderabad',  'Telangana',      'India', 'South'),
  ('Kolkata',    'West Bengal',    'India', 'East'),
  ('Pune',       'Maharashtra',    'India', 'West'),
  ('Ahmedabad',  'Gujarat',        'India', 'West')
ON CONFLICT DO NOTHING;

-- ---- dim_products ------------------------------------------
INSERT INTO dim_products (name, category, sub_category, unit_price, cost_price) VALUES
  ('Laptop Pro 15',        'Electronics',    'Computers',    85000.00, 62000.00),
  ('Wireless Headphones',  'Electronics',    'Audio',         4500.00,  2800.00),
  ('Office Chair Ergonomic','Furniture',     'Seating',      12000.00,  7500.00),
  ('Standing Desk',        'Furniture',      'Desks',        18000.00, 11000.00),
  ('Monitor 27" 4K',       'Electronics',    'Displays',     32000.00, 22000.00),
  ('Mechanical Keyboard',  'Electronics',    'Accessories',   6500.00,  3800.00),
  ('Webcam HD',            'Electronics',    'Accessories',   3200.00,  1900.00),
  ('Cloud Storage Yearly', 'Software',       'SaaS',          1200.00,   200.00),
  ('Anti-virus Suite',     'Software',       'Security',       800.00,   100.00),
  ('Printer Laser',        'Electronics',    'Printing',     15000.00,  9500.00)
ON CONFLICT DO NOTHING;

-- ---- dim_customers (with placeholder encrypted email) ------
-- NOTE: In production, email/phone are encrypted at the app layer using pgp_sym_encrypt.
-- Here we seed with NULL for demo purposes (app fills on real inserts).
INSERT INTO dim_customers (name, email, segment, region_id, join_date) VALUES
  ('Arjun Sharma',    NULL, 'Premium',  1, '2023-01-15'),
  ('Priya Patel',     NULL, 'Standard', 2, '2023-02-20'),
  ('Rahul Nair',      NULL, 'Budget',   4, '2023-03-10'),
  ('Sneha Reddy',     NULL, 'Premium',  5, '2023-04-05'),
  ('Vikram Singh',    NULL, 'Standard', 3, '2023-05-12'),
  ('Anjali Mehta',    NULL, 'Premium',  7, '2023-06-01'),
  ('Karthik Iyer',    NULL, 'Standard', 1, '2023-07-22'),
  ('Deepa Krishnan',  NULL, 'Budget',   6, '2023-08-08'),
  ('Suresh Gupta',    NULL, 'Premium',  2, '2023-09-14'),
  ('Meera Joshi',     NULL, 'Standard', 8, '2023-10-30')
ON CONFLICT DO NOTHING;

-- ---- fact_sales (300 rows via generate_series) -------------
INSERT INTO fact_sales (customer_id, product_id, time_id, region_id, quantity, unit_price, discount_pct, status)
SELECT
    (random() * 9 + 1)::int,
    (random() * 9 + 1)::int,
    dt.time_id,
    (random() * 7 + 1)::int,
    (random() * 5 + 1)::int,
    p.unit_price,
    ROUND((random() * 20)::numeric, 2),
    CASE WHEN random() > 0.05 THEN 'completed' ELSE 'cancelled' END
FROM generate_series(1, 300) AS i
JOIN LATERAL (
    SELECT time_id FROM dim_time
    WHERE date >= '2024-01-01' AND date <= '2025-05-15'
    ORDER BY random() LIMIT 1
) dt ON TRUE
JOIN LATERAL (
    SELECT product_id, unit_price FROM dim_products ORDER BY random() LIMIT 1
) p ON TRUE;

-- ---- Default admin user (password: Admin@123) ---------------
-- bcrypt hash of "Admin@123" — regenerate in production!
INSERT INTO users (username, email, password_hash, role) VALUES
  ('admin',   'admin@bisystem.local',   '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMaQSzTpqFi5JVh8yMK9g4eE8C', 'admin'),
  ('manager', 'manager@bisystem.local', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMaQSzTpqFi5JVh8yMK9g4eE8C', 'manager'),
  ('viewer',  'viewer@bisystem.local',  '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMaQSzTpqFi5JVh8yMK9g4eE8C', 'viewer')
ON CONFLICT (username) DO NOTHING;

-- ---- ml_anomalies (seeded anomalies for demo) ---------------
INSERT INTO ml_anomalies (sale_id, anomaly_score, is_flagged, run_id)
SELECT
    sale_id,
    ROUND((random() * 0.4 + 0.6)::numeric, 6),
    TRUE,
    'SEED_RUN_001'
FROM fact_sales
ORDER BY random()
LIMIT 12;

-- ---- ml_forecasts (30-day ARIMA forecast) -------------------
INSERT INTO ml_forecasts (forecast_date, predicted_value, lower_bound, upper_bound, run_id)
SELECT
    ('2025-05-16'::date + (i || ' days')::interval)::date,
    ROUND((250000 + sin(i * 0.3) * 30000 + random() * 20000)::numeric, 2),
    ROUND((220000 + sin(i * 0.3) * 25000)::numeric, 2),
    ROUND((280000 + sin(i * 0.3) * 35000 + 20000)::numeric, 2),
    'SEED_FORECAST_001'
FROM generate_series(1, 30) AS i;

-- ---- ml_churn_scores ----------------------------------------
INSERT INTO ml_churn_scores (customer_id, churn_prob, risk_label, rfm_score, run_id)
SELECT
    customer_id,
    ROUND((random())::numeric, 4),
    CASE
        WHEN random() < 0.33 THEN 'Low'
        WHEN random() < 0.66 THEN 'Medium'
        ELSE 'High'
    END,
    ROUND((random() * 5)::numeric, 2),
    'SEED_CHURN_001'
FROM dim_customers;
