"""MedStock AI — FastAPI Backend Application."""
from __future__ import annotations

import sys
from contextlib import asynccontextmanager
from pathlib import Path

# Ensure the backend directory is on sys.path
sys.path.insert(0, str(Path(__file__).resolve().parent))

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import get_settings
from app.core.database import create_tables
from app.core.logging import setup_logging

# Import all models so Base.metadata knows about them
import app.models  # noqa: F401

# Import all routers
from app.api import (
    auth,
    medicines,
    facilities,
    suppliers,
    batches,
    inventory,
    dashboard,
    forecasts,
    alerts,
    recommendations,
    analytics,
    assistant,
    uploads,
    reports,
    notifications,
)


settings = get_settings()
setup_logging()


@asynccontextmanager
async def lifespan(_app: FastAPI):
    """Create tables and seed on first run; fold the SQLite WAL back in on exit."""
    create_tables()

    # Auto-seed if the database is empty
    from app.core.database import SessionLocal
    from app.models.user import User

    db = SessionLocal()
    try:
        if not db.query(User).first():
            from app.seed.seed_database import seed
            seed()
    finally:
        db.close()

    yield

    # Checkpoint the write-ahead log so medstock.db-wal does not keep growing
    # between runs. SQLite removes the -wal/-shm files once all connections close.
    if settings.database_url.startswith("sqlite"):
        from sqlalchemy import text
        from app.core.database import engine

        try:
            with engine.connect() as conn:
                conn.execute(text("PRAGMA wal_checkpoint(TRUNCATE)"))
        except Exception:  # never block shutdown on housekeeping
            pass
        engine.dispose()


app = FastAPI(
    lifespan=lifespan,
    title="MedStock AI",
    description="AI-powered hospital medicine inventory, demand forecasting, stockout prediction, and procurement recommendation platform.",
    version="1.0.0",
    docs_url="/api/docs",
    redoc_url="/api/redoc",
)

# CORS — explicit origins from settings, plus any localhost / private-LAN
# origin on any port so the SPA works when opened from another device.
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_origin_regex=r"https?://(localhost|127\.0\.0\.1|(?:10|192\.168)\.\d{1,3}\.\d{1,3}|172\.(?:1[6-9]|2\d|3[01])\.\d{1,3}\.\d{1,3})(:\d+)?",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers
app.include_router(auth.router)
app.include_router(medicines.router)
app.include_router(facilities.router)
app.include_router(suppliers.router)
app.include_router(batches.router)
app.include_router(inventory.router)
app.include_router(dashboard.router)
app.include_router(forecasts.router)
app.include_router(alerts.router)
app.include_router(recommendations.router)
app.include_router(analytics.router)
app.include_router(assistant.router)
app.include_router(uploads.router)
app.include_router(reports.router)
app.include_router(notifications.router)


@app.get("/health", tags=["System"])
def health_check():
    return {"status": "healthy", "database": "connected", "version": "1.0.0"}


# Serve the built frontend from the same origin as the API (Docker/Hugging
# Face deployment only — the static/ directory doesn't exist in local dev,
# where the frontend runs on its own Vite dev server instead).
_static_dir = Path(__file__).resolve().parent.parent / "static"
if _static_dir.is_dir():
    from fastapi.staticfiles import StaticFiles
    from fastapi.responses import FileResponse

    app.mount("/assets", StaticFiles(directory=_static_dir / "assets"), name="assets")

    @app.get("/{full_path:path}", include_in_schema=False)
    def serve_spa(full_path: str):
        """Any path not matched by an API route above falls through to here.

        Serve the requested file if it exists (favicons, etc. sit at the
        static root); otherwise return index.html so React Router can handle
        client-side routes like /dashboard or /inventory/123.
        """
        candidate = _static_dir / full_path
        if full_path and candidate.is_file():
            return FileResponse(candidate)
        return FileResponse(_static_dir / "index.html")


if __name__ == "__main__":
    import os
    import uvicorn

    # PORT lets you avoid a clash without editing code:  set PORT=8001
    port = int(os.environ.get("PORT", "8000"))

    # The reloader watches this directory, which also holds the live SQLite
    # files — without these excludes every write restarts the server.
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=port,
        reload=True,
        reload_excludes=["*.db", "*.db-wal", "*.db-shm", ".pytest_cache/*"],
    )
