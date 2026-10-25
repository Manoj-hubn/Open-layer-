from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.database import Base, engine, SessionLocal
from app.models import entities  # noqa: F401
from app.routers import auth, applications, observability, business
from app.seed import seed

app = FastAPI(
    title=settings.app_name,
    version="1.0.0",
    description="Open Layer Application Observability & Intelligent Monitoring Platform REST APIs"
)

# Configure CORS
origins = [x.strip() for x in settings.cors_origins.split(",") if x.strip()]
if "*" in origins:
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=False,
        allow_methods=["*"],
        allow_headers=["*"],
    )
else:
    app.add_middleware(
        CORSMiddleware,
        allow_origins=origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

@app.on_event("startup")
def startup():
    Base.metadata.create_all(bind=engine)
    if settings.seed_demo_data:
        db = SessionLocal()
        try:
            seed(db)
        finally:
            db.close()

# Include routers under /api (standard)
app.include_router(auth.router, prefix=settings.api_prefix)
app.include_router(applications.router, prefix=settings.api_prefix)
app.include_router(observability.router, prefix=settings.api_prefix)
app.include_router(business.router, prefix=settings.api_prefix)

# Also mount under root / without prefix for strict requirement document matching
app.include_router(applications.router, prefix="", tags=["Applications (Root)"])
app.include_router(observability.router, prefix="", tags=["Observability (Root)"])
app.include_router(business.router, prefix="", tags=["Business (Root)"])

@app.get("/")
def root():
    return {
        "name": settings.app_name,
        "docs": "/docs",
        "health": "/health",
        "status": "online",
        "version": "1.0.0"
    }

@app.get("/health")
@app.get("/api/health")
def health():
    return {
        "status": "healthy",
        "service": settings.app_name,
        "database": "connected"
    }
