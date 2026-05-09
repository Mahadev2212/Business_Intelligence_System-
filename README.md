# 📊 Business Intelligence System

An AI-powered Business Intelligence platform featuring real-time analytics, anomaly detection, time-series forecasting, and customer churn prediction.

---

## 🏗 Project Structure

```
Business_Intelligence_System-/
├── backend/
│   ├── main.py                 # FastAPI application entry point
│   ├── routes/
│   │   ├── auth.py             # JWT authentication endpoints
│   │   └── query.py            # Data query & AI analysis endpoints
│   ├── models/                 # SQLAlchemy ORM models (extend as needed)
│   ├── anomaly_detection.py    # IsolationForest / Z-score / IQR anomaly detection
│   ├── forecasting.py          # Prophet / exponential smoothing forecasting
│   ├── churn_prediction.py     # Gradient Boosting churn prediction
│   └── requirements.txt        # Python dependencies
├── frontend/
│   ├── public/                 # Static assets
│   ├── src/
│   │   ├── pages/
│   │   │   ├── Dashboard.jsx   # KPI cards, charts, anomaly & churn views
│   │   │   └── SecurityLogs.jsx# Audit log viewer with filtering & pagination
│   │   └── App.jsx             # Root component with sidebar navigation
│   └── package.json            # Node dependencies (React + Vite + Recharts)
├── database/
│   ├── init.sql                # Core schema (users, customers, transactions)
│   └── security.sql            # Security logs, audit trail, sessions
├── .env.example                # Environment variable template
├── .gitignore
└── README.md
```

---

## 🚀 Getting Started

### Prerequisites
- Python 3.10+
- Node.js 18+
- PostgreSQL 15+

### Backend Setup

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate          # Windows
pip install -r requirements.txt
cp ../.env.example ../.env      # fill in your values
uvicorn main:app --reload
```

API available at: `http://localhost:8000`  
Interactive docs: `http://localhost:8000/docs`

### Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

App available at: `http://localhost:5173`

### Database Setup

```bash
psql -U postgres -c "CREATE DATABASE bi_system;"
psql -U postgres -d bi_system -f database/init.sql
psql -U postgres -d bi_system -f database/security.sql
```

---

## 🧠 AI Features

| Feature | Module | Algorithms |
|---|---|---|
| Anomaly Detection | `anomaly_detection.py` | IsolationForest, Z-score, IQR |
| Time-Series Forecasting | `forecasting.py` | Prophet, Exponential Smoothing |
| Churn Prediction | `churn_prediction.py` | Gradient Boosting, Rule-based fallback |

---

## 🔐 Authentication

- JWT-based authentication via `/api/auth/login`
- Default credentials: `admin` / `admin123` *(change in production)*
- Role-based access: `admin`, `analyst`, `viewer`

---

## 📡 API Endpoints

| Method | Path | Description |
|---|---|---|
| POST | `/api/auth/login` | Obtain JWT token |
| POST | `/api/auth/register` | Register new user |
| GET  | `/api/auth/me` | Get current user |
| POST | `/api/query/anomalies` | Run anomaly detection |
| POST | `/api/query/forecast` | Generate forecast |
| POST | `/api/query/churn` | Predict customer churn |
| GET  | `/api/query/datasets` | List available datasets |

---

## 🛠 Tech Stack

**Backend:** Python · FastAPI · SQLAlchemy · PostgreSQL · scikit-learn · NumPy · Pandas  
**Frontend:** React 18 · Vite · Recharts · React Router v6  
**Auth:** JWT (PyJWT) · OAuth2 Password Flow  
**ML:** scikit-learn · Prophet (optional) · XGBoost (optional)

---

## 📄 License

MIT License