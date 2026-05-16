# backend/database.py
from sqlalchemy import create_engine, text
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from config import get_settings

settings = get_settings()

engine = create_engine(
    settings.DATABASE_URL,
    pool_pre_ping=True,
    pool_size=10,
    max_overflow=20,
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def get_db():
    """FastAPI dependency — yields a DB session and always closes it."""
    db = SessionLocal()
    try:
        # Set the encryption key as a session-level setting so pgcrypto can use it
        db.execute(
            text("SET app.encryption_key = :key"),
            {"key": settings.DB_ENCRYPTION_KEY},
        )
        yield db
    finally:
        db.close()
