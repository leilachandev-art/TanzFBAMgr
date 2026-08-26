import os
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

# Use DATABASE_URL env var if set (Supabase/Railway PostgreSQL), else local SQLite
DATABASE_URL = os.environ.get("DATABASE_URL")

if DATABASE_URL:
    # Fix for providers that use postgres:// instead of postgresql://
    if DATABASE_URL.startswith("postgres://"):
        DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)
    # Add sslmode=require if not already specified (required by Supabase)
    if "sslmode" not in DATABASE_URL:
        sep = "&" if "?" in DATABASE_URL else "?"
        DATABASE_URL = DATABASE_URL + sep + "sslmode=require"
    engine = create_engine(
        DATABASE_URL,
        pool_size=5,
        max_overflow=10,
        pool_pre_ping=True,
        connect_args={"sslmode": "require"},
    )
else:
    BASE_DIR = os.path.dirname(os.path.abspath(__file__))
    _sqlite_url = f"sqlite:///{os.path.join(BASE_DIR, 'fba.db')}"
    engine = create_engine(_sqlite_url, connect_args={"check_same_thread": False},
                           pool_size=10, max_overflow=20)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
