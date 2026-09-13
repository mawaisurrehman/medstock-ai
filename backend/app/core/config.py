"""Core configuration module."""
from __future__ import annotations

import os
from pathlib import Path
from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


# backend/ root: config.py lives at backend/app/core/config.py
BASE_DIR = Path(__file__).resolve().parent.parent.parent


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    model_config = SettingsConfigDict(
        env_file=str(BASE_DIR / ".env"),
        env_file_encoding="utf-8",
        extra="ignore",
    )

    # Database
    database_url: str = f"sqlite:///{BASE_DIR / 'medstock.db'}"

    # JWT
    jwt_secret_key: str = "change_this_secret_in_production"
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = 1440  # 24 hours

    # Qwen AI — any OpenAI-compatible endpoint (Alibaba Model Studio, Ollama,
    # OpenRouter, …). The model name must match what that provider serves.
    qwen_api_key: str = ""
    qwen_base_url: str = ""
    qwen_model: str = "qwen-plus"

    # Groq OpenAI-compatible endpoint. The default model must be one your
    # Groq API key can see in its catalog — override GROQ_MODEL if not.
    groq_api_key: str = ""
    groq_base_url: str = "https://api.groq.com/openai/v1"
    groq_model: str = "llama-3.3-70b-versatile"

    # Upload
    upload_max_size_mb: int = 20

    # Business
    emergency_purchase_premium: float = 1.35

    # CORS
    cors_origins: str = "http://localhost:5173"

    @property
    def cors_origin_list(self) -> list[str]:
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()
