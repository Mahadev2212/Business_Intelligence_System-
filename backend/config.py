# backend/config.py
from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    # ---- Database -------------------------------------------------------
    DATABASE_URL: str = "postgresql://postgres:postgres@localhost:5432/bi_system"
    DB_ENCRYPTION_KEY: str = "change_this_32_char_secret_key!!"  # 32+ chars

    # ---- JWT ------------------------------------------------------------
    SECRET_KEY: str = "change_this_jwt_secret_key_in_production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60

    # ---- OpenAI (NL-to-SQL) --------------------------------------------
    OPENAI_API_KEY: str = ""
    OPENAI_MODEL: str = "gpt-4o"

    # ---- Anomaly detection threshold -----------------------------------
    ANOMALY_THRESHOLD: float = 0.65

    class Config:
        env_file = "../.env"
        extra = "ignore"


@lru_cache
def get_settings() -> Settings:
    return Settings()
