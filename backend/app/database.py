import logging
from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, sessionmaker
from sqlalchemy.exc import OperationalError
from app.config import settings

logger = logging.getLogger("open_layer.database")

def init_engine(db_url: str):
    connect_args = {}
    engine_kwargs = {}
    if db_url.startswith("sqlite"):
        connect_args["check_same_thread"] = False
    else:
        engine_kwargs["pool_pre_ping"] = True
        engine_kwargs["pool_recycle"] = 1800
    try:
        eng = create_engine(db_url, connect_args=connect_args, **engine_kwargs)
        # Test connection
        with eng.connect() as conn:
            pass
        return eng
    except OperationalError as err:
        if not db_url.startswith("sqlite"):
            logger.warning(f"Could not connect to configured database at {db_url} ({err}). Falling back to local SQLite.")
            fallback_url = "sqlite:///./open_layer.db"
            return create_engine(fallback_url, connect_args={"check_same_thread": False})
        raise

engine = init_engine(settings.database_url)
SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False)

class Base(DeclarativeBase):
    pass

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
