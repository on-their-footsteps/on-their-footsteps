from pydantic_settings import BaseSettings
from typing import List, Optional
import secrets

class Settings(BaseSettings):
    # Database
    DATABASE_URL: str = "sqlite:///./on_their_footsteps.db"
    DATABASE_TEST_URL: str = "sqlite:///./test.db"
    
    # Security
    SECRET_KEY: str = secrets.token_urlsafe(32)  # Generate secure key if not provided
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    
    # CORS
    ALLOWED_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "https://on-their-footsteps.vercel.app"
    ]
    
    # Application
    DEBUG: Optional[bool] = True
    HOST: Optional[str] = "0.0.0.0"
    PORT: Optional[int] = 8000
    LOG_LEVEL: Optional[str] = "INFO"
    
    # Upload
    UPLOAD_DIR: Optional[str] = "./static/uploads"
    MAX_FILE_SIZE: Optional[int] = 10 * 1024 * 1024  # 10MB
    ALLOWED_IMAGE_TYPES: Optional[List[str]] = ["image/jpeg", "image/png", "image/webp"]
    
    # Redis
    REDIS_URL: Optional[str] = "redis://localhost:6379"
    
    # Email (Optional)
    SMTP_HOST: Optional[str] = None
    SMTP_PORT: Optional[int] = None
    SMTP_USER: Optional[str] = None
    SMTP_PASSWORD: Optional[str] = None
    
    # Celery (Optional)
    CELERY_BROKER_URL: Optional[str] = None
    CELERY_RESULT_BACKEND: Optional[str] = None
    
    class Config:
        env_file = ".env"
        case_sensitive = True
        extra = "allow"  # Allow extra fields from .env

settings = Settings()