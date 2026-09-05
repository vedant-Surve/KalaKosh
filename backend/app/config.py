"""
KalaKosh backend configuration.
All values are loaded from environment variables (.env) — nothing is hardcoded
so the same code runs against local MySQL, a managed MySQL instance, etc.
"""
import os
from dotenv import load_dotenv

load_dotenv()


class Settings:
    # --- Database ---
    DB_USER: str = os.getenv("DB_USER", "root")
    DB_PASSWORD: str = os.getenv("DB_PASSWORD", "")
    DB_HOST: str = os.getenv("DB_HOST", "localhost")
    DB_PORT: str = os.getenv("DB_PORT", "3306")
    DB_NAME: str = os.getenv("DB_NAME", "kalakosh_db")

    @property
    def DATABASE_URL(self) -> str:
        return (
            f"mysql+pymysql://{self.DB_USER}:{self.DB_PASSWORD}"
            f"@{self.DB_HOST}:{self.DB_PORT}/{self.DB_NAME}"
        )

    # --- Auth / JWT ---
    JWT_SECRET_KEY: str = os.getenv("JWT_SECRET_KEY", "change-this-secret-in-production")
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "1440"))

    # --- CORS ---
    FRONTEND_ORIGIN: str = os.getenv("FRONTEND_ORIGIN", "http://localhost:5173")

    # --- File uploads (audio narration, artwork images) ---
    UPLOAD_DIR: str = os.getenv("UPLOAD_DIR", "uploads")
    MAX_UPLOAD_MB: int = int(os.getenv("MAX_UPLOAD_MB", "25"))

    # --- Pratyaksha (Grok API) ---
    GROK_API_KEY: str = os.getenv("GROK_API_KEY", "")
    GROK_MODEL: str = os.getenv("GROK_MODEL", "grok-3-mini")
    GROK_BASE_URL: str = os.getenv("GROK_BASE_URL", "https://api.x.ai/v1")


settings = Settings()
