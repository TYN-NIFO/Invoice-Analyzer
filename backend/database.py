from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import os
from urllib.parse import quote_plus
from pathlib import Path
from dotenv import load_dotenv

# Load environment variables (.env at project root first, then local fallback)
BASE_DIR = Path(__file__).resolve().parent.parent
load_dotenv(BASE_DIR / ".env")
load_dotenv()

# Prefer full DATABASE_URL (for Neon/hosted DBs), fallback to DB_* env vars
database_url = os.getenv("DATABASE_URL", "").strip()

if database_url:
    if database_url.startswith("postgres://"):
        database_url = database_url.replace("postgres://", "postgresql://", 1)
    if "neon.tech" in database_url and "sslmode=" not in database_url:
        separator = "&" if "?" in database_url else "?"
        database_url = f"{database_url}{separator}sslmode=require"
else:
    db_user = os.getenv("DB_USER", "postgres")
    db_password = quote_plus(os.getenv("DB_PASSWORD", "postgres123"))
    db_host = os.getenv("DB_HOST", "localhost")
    db_port = os.getenv("DB_PORT", "5432")
    db_name = os.getenv("DB_NAME", "invoice")
    database_url = f"postgresql://{db_user}:{db_password}@{db_host}:{db_port}/{db_name}"

# Create engine
engine = create_engine(database_url)

# Create session factory
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Create declarative base
Base = declarative_base()

# Dependency for getting database session
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()