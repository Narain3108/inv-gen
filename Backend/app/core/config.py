"""
Application Configuration
Centralized settings management using Pydantic Settings
"""

from typing import List, Optional
from pydantic import Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application settings loaded from environment variables"""
    
    # Application Info
    APP_NAME: str = "Invoice Management API"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = False
    ENVIRONMENT: str = "production"
    
    # API Configuration
    API_V1_PREFIX: str = "/api/v1"
    MAX_PAGE_SIZE: int = 1000
    DEFAULT_PAGE_SIZE: int = 50
    
    # CORS
    CORS_ORIGINS: str = "http://localhost:3000"
    CORS_ALLOW_CREDENTIALS: bool = True
    CORS_ALLOW_METHODS: str = "*"
    CORS_ALLOW_HEADERS: str = "*"
    
    # Firebase Admin SDK Configuration
    FIREBASE_CREDENTIALS_PATH: str = "./firebase-credentials.json"
    FIREBASE_PROJECT_ID: str = "bill-6a1a2"
    
    # Cloudinary Configuration
    CLOUDINARY_CLOUD_NAME: str = "dvwu6jtfm"
    CLOUDINARY_UPLOAD_PRESET: str = "logosign"
    CLOUDINARY_API_KEY: Optional[str] = None
    CLOUDINARY_API_SECRET: Optional[str] = None
    
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore"
    )
    
    @property
    def cors_origins_list(self) -> List[str]:
        """Parse CORS origins from comma-separated string"""
        if isinstance(self.CORS_ORIGINS, str):
            return [origin.strip() for origin in self.CORS_ORIGINS.split(",")]
        return [self.CORS_ORIGINS]


# Global settings instance
settings = Settings()
