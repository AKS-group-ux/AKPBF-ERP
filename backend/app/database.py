from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker
from app.core.config import settings

# Setup standard enterprise-ready SQLAlchemy engine pool
engine = create_engine(
    settings.DATABASE_URL,
    pool_size=20,
    max_overflow=10,
    pool_pre_ping=True
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    """
    Database session dependency yield lifecycle manager.
    Injects transactional context safely into API route callbacks.
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
