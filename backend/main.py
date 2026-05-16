# backend/main.py
"""
AI-Powered Secure Business Intelligence System — FastAPI Entry Point
TRD-ASBI-001 | Version 1.0 | May 2026
"""
import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from database import engine
from models import orm  # ensure all models are imported so metadata is populated

from routes.auth      import router as auth_router
from routes.dashboard import router as dashboard_router
from routes.query     import router as query_router
from routes.security  import router as security_router
from routes.ml        import router as ml_router

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(name)s — %(message)s")
log = logging.getLogger(__name__)


# ---- Startup / Shutdown lifecycle -----------------------------------

@asynccontextmanager
async def lifespan(app: FastAPI):
    log.info("BI System starting up …")
    # Tables are created by init.sql; we just verify the connection.
    try:
        from sqlalchemy import text
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        log.info("Database connection OK")
    except Exception as e:
        log.error(f"Database connection FAILED: {e}")
    yield
    log.info("BI System shutting down.")


# ---- Application ----------------------------------------------------

app = FastAPI(
    title="AI-Powered Secure Business Intelligence System",
    description="PRD-ASBI-001 / TRD-ASBI-001 — DBMS Mini Project #68",
    version="1.0.0",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
)

# ---- CORS -----------------------------------------------------------
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---- Global exception handler ----------------------------------------
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    log.error(f"Unhandled exception on {request.url}: {exc}", exc_info=True)
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={"detail": "Internal server error"},
    )

# ---- Routers --------------------------------------------------------
PREFIX = "/api/v1"
app.include_router(auth_router,      prefix=PREFIX)
app.include_router(dashboard_router, prefix=PREFIX)
app.include_router(query_router,     prefix=PREFIX)
app.include_router(security_router,  prefix=PREFIX)
app.include_router(ml_router,        prefix=PREFIX)


@app.get("/health", tags=["Health"])
async def health():
    return {"status": "ok", "version": "1.0.0"}
