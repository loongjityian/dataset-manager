from collections.abc import AsyncGenerator
from contextlib import asynccontextmanager

from fastapi import FastAPI

from app.api import datasets, health, rows
from app.api.errors import register_error_handlers
from app.db.database import init_db


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None]:
    init_db()
    yield


app = FastAPI(title="Dataset Manager", lifespan=lifespan)
app.include_router(health.router)
app.include_router(datasets.router)
app.include_router(rows.router)
register_error_handlers(app)
