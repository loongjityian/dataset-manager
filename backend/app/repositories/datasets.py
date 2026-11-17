import sqlite3

from app.domain import Dataset
from app.utils.sql import quote

REGISTRY_COLUMNS = "id, display_name, created_at"


def create_registry_table(conn: sqlite3.Connection) -> None:
    with conn:
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS datasets (
                id           TEXT PRIMARY KEY,
                display_name TEXT NOT NULL,
                created_at   TEXT NOT NULL
            )
            """
        )


def create(
    conn: sqlite3.Connection,
    dataset: Dataset,
    columns: list[str],
    rows: list[list[str | None]],
) -> None:
    """Create the dataset's table, load its rows and register it, all in one transaction."""
    table = quote(dataset.id)
    column_defs = ", ".join(f"{quote(c)} TEXT" for c in columns)
    column_names = ", ".join(quote(c) for c in columns)
    placeholders = ", ".join("?" for _ in columns)

    with conn:
        conn.execute(f"CREATE TABLE {table} (_id INTEGER PRIMARY KEY, {column_defs})")
        conn.executemany(f"INSERT INTO {table} ({column_names}) VALUES ({placeholders})", rows)
        conn.execute(
            f"INSERT INTO datasets ({REGISTRY_COLUMNS}) VALUES (?, ?, ?)",
            (dataset.id, dataset.display_name, dataset.created_at),
        )


def list_all(conn: sqlite3.Connection) -> list[Dataset]:
    rows = conn.execute(
        f"SELECT {REGISTRY_COLUMNS} FROM datasets ORDER BY created_at DESC, rowid DESC"
    ).fetchall()
    return [_to_dataset(conn, row) for row in rows]


def get(conn: sqlite3.Connection, dataset_id: str) -> Dataset | None:
    row = conn.execute(f"SELECT {REGISTRY_COLUMNS} FROM datasets WHERE id = ?", (dataset_id,)).fetchone()
    return _to_dataset(conn, row) if row else None


def get_columns(conn: sqlite3.Connection, dataset_id: str) -> list[str]:
    rows = conn.execute("SELECT name FROM pragma_table_info(?)", (dataset_id,)).fetchall()
    return [row["name"] for row in rows if row["name"] != "_id"]


def rename(conn: sqlite3.Connection, dataset_id: str, display_name: str) -> None:
    with conn:
        conn.execute("UPDATE datasets SET display_name = ? WHERE id = ?", (display_name, dataset_id))


def delete(conn: sqlite3.Connection, dataset_id: str) -> None:
    """Drop the dataset's table and its registry entry in one transaction."""
    with conn:
        conn.execute(f"DROP TABLE {quote(dataset_id)}")
        conn.execute("DELETE FROM datasets WHERE id = ?", (dataset_id,))


def _to_dataset(conn: sqlite3.Connection, row: sqlite3.Row) -> Dataset:
    row_count = conn.execute(f"SELECT COUNT(*) FROM {quote(row['id'])}").fetchone()[0]
    return Dataset(row["id"], row["display_name"], row["created_at"], row_count)
