import os
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    app_name: str = "Open Layer Observability API"
    api_prefix: str = "/api"
    # Default to sqlite for instant, zero-cost local execution; override via .env for MySQL or PostgreSQL
    database_url: str = os.getenv(
        "DATABASE_URL",
        "sqlite:///./open_layer.db"
    )
    secret_key: str = os.getenv(
        "SECRET_KEY",
        "open-layer-observability-secure-signing-key-2026-production-ready"
    )
    access_token_minutes: int = 120
    cors_origins: str = os.getenv(
        "CORS_ORIGINS",
        "http://localhost:5173,http://127.0.0.1:5173,http://localhost:3000,http://127.0.0.1:3000,*"
    )
    seed_demo_data: bool = True
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

settings = Settings()
