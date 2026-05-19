from contextlib import asynccontextmanager
import sentry_sdk
from sentry_sdk.integrations.fastapi import FastApiIntegration
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.db import create_db_and_tables


@asynccontextmanager
async def lifespan(app: FastAPI):
    create_db_and_tables()
    yield


if settings.SENTRY_DSN:
    sentry_sdk.init(
        dsn=settings.SENTRY_DSN,
        integrations=[FastApiIntegration()],
        traces_sample_rate=0.2,
        environment=settings.ENVIRONMENT,
    )

app = FastAPI(
    title="Recorded by Rishik API",
    version="1.0.0",
    lifespan=lifespan,
    # Hide docs in production
    docs_url="/docs" if settings.ENVIRONMENT != "production" else None,
    redoc_url="/redoc" if settings.ENVIRONMENT != "production" else None,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers
from app.routers import public, client, admin  # noqa: E402

app.include_router(public.router, prefix="/api/v1", tags=["public"])
app.include_router(client.router, prefix="/api/v1", tags=["client"])
app.include_router(admin.router, prefix="/api/v1/admin", tags=["admin"])


@app.get("/health", include_in_schema=False)
def health():
    return {"status": "ok"}


@app.get("/api/v1/sentry-test", include_in_schema=False)
def sentry_test():
    raise ValueError("Sentry test error — this is intentional")
