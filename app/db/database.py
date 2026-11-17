import os
import sqlite3
from collections.abc import Generator
from contextlib import closing
from pathlib import Path
from typing import Annotated

from fastapi import Depends

from app.repositories import datasets as datasets_repository

DATABASE_PATH = Path(os.environ.get("DATABASE_PATH", "data/datasets.db"))


def connect() -> sqlite3.Connection:
    # autocommit=False to keep every statement, including CREATE TABLE, inside a transaction.
    conn = sqlite3.connect(DATABASE_PATH, autocommit=False, check_same_thread=False)
    conn.row_factory = sqlite3.Row
    return conn


def get_connection() -> Generator[sqlite3.Connection]:
    """FastAPI dependency: one connection per request, closed when the request ends."""
    with closing(connect()) as conn:
        yield conn


Connection = Annotated[sqlite3.Connection, Depends(get_connection)]


def init_db() -> None:
    DATABASE_PATH.parent.mkdir(parents=True, exist_ok=True)
    with closing(connect()) as conn:
        datasets_repository.create_registry_table(conn)
