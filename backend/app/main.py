from contextlib import asynccontextmanager
from pathlib import Path

import structlog
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles

from app.api.v1.health import router as health_router
from app.api.v1.auth import router as auth_router
from app.api.v1.organizations import router as organizations_router
from app.api.v1.projects import router as projects_router
from app.api.v1.workers import router as workers_router
from app.api.v1.evaluations import router as evaluations_router
from app.api.v1.dashboard import router as dashboard_router
from app.config import settings
from app.database import engine
from app.errors import ErrorCode

logger = structlog.get_logger()


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Starting FaenaScore API", debug=settings.DEBUG)
    if not settings.DEBUG and settings.AUTH_MOCK_ENABLED:
        raise RuntimeError("AUTH_MOCK_ENABLED=True is not allowed when DEBUG=False.")
    yield
    await engine.dispose()
    logger.info("Shutting down FaenaScore API")


app = FastAPI(title=settings.APP_NAME, version="0.1.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.exception_handler(Exception)
async def unhandled_exception_handler(request: Request, exc: Exception):
    logger.error("Unhandled exception", path=request.url.path, method=request.method, error=str(exc), exc_info=True)
    return JSONResponse(
        status_code=500,
        content={"detail": "An internal server error occurred.", "code": ErrorCode.INTERNAL_ERROR},
    )


# Routers
app.include_router(health_router, prefix="/api")
app.include_router(auth_router, prefix="/api/v1")
app.include_router(organizations_router, prefix="/api/v1")
app.include_router(projects_router, prefix="/api/v1")
app.include_router(workers_router, prefix="/api/v1")
app.include_router(evaluations_router, prefix="/api/v1")
app.include_router(dashboard_router, prefix="/api/v1")

# Serve frontend static files (production: built by Dockerfile)
static_dir = Path(__file__).parent.parent / "static"
if static_dir.exists():
    app.mount("/", StaticFiles(directory=str(static_dir), html=True), name="static")
