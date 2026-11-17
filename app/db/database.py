import os
import sqlite3
from collections.abc import Generator
from contextlib import closing
from pathlib import Path

DATABASE_PATH = Path(os.environ.get("DATABASE_PATH", "data/datasets.db"))


def connect() -> sqlite3.Connection:
    # autocommit=False to keep every statement, including CREATE TABLE, inside a transaction.
    # check_same_thread=False because FastAPI may run a dependency and its endpoint on
    conn = sqlite3.connect(DATABASE_PATH, autocommit=False, check_same_thread=False)
    conn.row_factory = sqlite3.Row
    return conn


def get_connection() -> Generator[sqlite3.Connection]:
    """FastAPI dependency: one connection per request, closed when the request ends."""
    with closing(connect()) as conn:
        yield conn


def init_db() -> None:
    DATABASE_PATH.parent.mkdir(parents=True, exist_ok=True)
    with closing(connect()) as conn, conn:
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS datasets (
                id           TEXT PRIMARY KEY,
                display_name TEXT NOT NULL,
                created_at   TEXT NOT NULL
            )
            """
        )
