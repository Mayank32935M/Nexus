import logging
from contextlib import asynccontextmanager
from pathlib import Path
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse

from nexus.config import settings, PROJECT_ROOT
from nexus.core.database import init_db
from nexus.memory.indexer import VaultIndexer
from nexus.api.routes_health import router as health_router
from nexus.api.routes_memory import router as memory_router
from nexus.api.routes_projects import router as projects_router
from nexus.api.routes_approvals import router as approvals_router
from nexus.api.routes_handoff import router as handoff_router
from nexus.api.routes_providers import router as providers_router
from nexus.api.routes_audit import router as audit_router

# Configure logging
logging.basicConfig(
    level=logging.INFO if not settings.debug else logging.DEBUG,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger("nexus.main")


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifecycle: setup directories, DB, and vault index on startup."""
    logger.info("Initializing NEXUS Core Backend...")
    settings.ensure_directories()
    init_db()
    indexer = VaultIndexer()
    synced = indexer.sync_vault()
    logger.info("NEXUS Core ready — Vault synchronized (%d documents indexed)", synced)
    yield
    logger.info("NEXUS Core shutting down cleanly.")


app = FastAPI(
    title="NEXUS Intelligence Ecosystem API",
    description="Local-First Personal AI Operating System and Shared Memory Engine",
    version="0.1.0",
    lifespan=lifespan,
)

# CORS configuration for Vite frontend development
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:8000",
        "http://127.0.0.1:8000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API routers under /api
app.include_router(health_router, prefix="/api")
app.include_router(memory_router, prefix="/api")
app.include_router(projects_router, prefix="/api")
app.include_router(approvals_router, prefix="/api")
app.include_router(handoff_router, prefix="/api")
app.include_router(providers_router, prefix="/api")
app.include_router(audit_router, prefix="/api")


# Mount built frontend SPA if available
frontend_dist = PROJECT_ROOT / "frontend" / "dist"
if (frontend_dist / "assets").exists():
    app.mount("/assets", StaticFiles(directory=str(frontend_dist / "assets")), name="assets")

if (frontend_dist / "index.html").exists():
    @app.get("/{full_path:path}")
    def serve_spa(full_path: str):
        file_candidate = frontend_dist / full_path
        if full_path and file_candidate.exists() and file_candidate.is_file():
            return FileResponse(file_candidate)
        return FileResponse(frontend_dist / "index.html")
else:
    @app.get("/")
    def root():
        return {
            "service": "NEXUS Core Intelligence Ecosystem",
            "version": "0.1.0",
            "docs_url": "/docs",
            "status": "online",
        }


def start_server():
    """CLI runner."""
    import uvicorn
    uvicorn.run(
        "nexus.main:app",
        host=settings.nexus_host,
        port=settings.nexus_port,
        reload=settings.debug,
    )


if __name__ == "__main__":
    start_server()
