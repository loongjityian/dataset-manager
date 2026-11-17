from collections.abc import AsyncGenerator
from contextlib import asynccontextmanager

from fastapi import FastAPI

from app.api import health
from app.db.database import init_db


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None]:
    init_db()
    yield


app = FastAPI(title="Dataset Manager", lifespan=lifespan)
app.include_router(health.router)
