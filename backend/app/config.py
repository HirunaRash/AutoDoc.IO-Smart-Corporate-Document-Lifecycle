from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    # App
    APP_NAME: str = "AutoDoc.IO"
    DEBUG: bool = False
    SECRET_KEY: str = "change-me-in-production"

    # PostgreSQL
    DATABASE_URL: str = "postgresql+asyncpg://postgres:password@db:5432/autodoc"

    # Pinecone
    PINECONE_API_KEY: str = ""
    PINECONE_INDEX_NAME: str = "autodoc-index"
    PINECONE_ENVIRONMENT: str = "us-east-1"

    # AWS S3 / Supabase Storage
    S3_BUCKET_NAME: str = "autodoc-documents"
    S3_REGION: str = "us-east-1"
    AWS_ACCESS_KEY_ID: str = ""
    AWS_SECRET_ACCESS_KEY: str = ""
    S3_ENDPOINT_URL: str = ""  # Leave empty for real AWS, set for Supabase/MinIO

    # OpenAI / HuggingFace
    OPENAI_API_KEY: str = ""
    HUGGINGFACE_API_KEY: str = ""
    # "openai" | "huggingface"
    AI_PROVIDER: str = "openai"

    # Embedding model names
    OPENAI_EMBED_MODEL: str = "text-embedding-3-small"
    OPENAI_CHAT_MODEL: str = "gpt-4o-mini"
    HF_EMBED_MODEL: str = "sentence-transformers/all-MiniLM-L6-v2"
    HF_SUMMARIZE_MODEL: str = "facebook/bart-large-cnn"

    # JWT
    JWT_ALGORITHM: str = "HS256"
    JWT_EXPIRE_MINUTES: int = 60 * 24  # 24 hours

    class Config:
        env_file = ".env"
        extra = "ignore"  # ignore unknown env vars like NEXT_PUBLIC_API_URL


@lru_cache()
def get_settings() -> Settings:
    return Settings()
