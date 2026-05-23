from pydantic_settings import BaseSettings
from pydantic import Field

class Settings(BaseSettings):
    PROJECT_NAME: str = "AKPBF ERP Waste Management"
    API_V1_STR: str = "/api/v1"
    
    # Security Configurations
    SECRET_KEY: str = Field(
        default="09d25e094faa6ca2556c818166b7a9563b93f7099f6f0f4caa6cf63b88e8d3e7",
        env="SECRET_KEY"
    )
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 480  # 8 hours

    # Database Settings matching Docker container layout
    DATABASE_URL: str = Field(
        default="postgresql://akpbf_admin:akpbf_secure_password_2026@localhost:5432/akpbf_erp_db",
        env="DATABASE_URL"
    )

    class Config:
        case_sensitive = True
        env_file = ".env"

settings = Settings()
