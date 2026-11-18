import sqlite3

from app.domain import StoredRow, StoredValue
from app.utils.sql import quote


def list_page(conn: sqlite3.Connection, dataset_id: str, limit: int, offset: int) -> list[StoredRow]:
    rows = conn.execute(
        f"SELECT * FROM {quote(dataset_id)} ORDER BY _id LIMIT ? OFFSET ?", (limit, offset)
    ).fetchall()
    return [dict(row) for row in rows]


def insert(conn: sqlite3.Connection, dataset_id: str, values: dict[str, StoredValue]) -> StoredRow:
    if values:
        names = ", ".join(quote(c) for c in values)
        placeholders = ", ".join("?" for _ in values)
        sql = f"INSERT INTO {quote(dataset_id)} ({names}) VALUES ({placeholders}) RETURNING *"
    else:
        sql = f"INSERT INTO {quote(dataset_id)} DEFAULT VALUES RETURNING *"
    row = _write_one(conn, sql, list(values.values()))
    assert row is not None  # INSERT ... RETURNING always returns the new row
    return row


def update(conn: sqlite3.Connection, dataset_id: str, row_id: int, values: dict[str, StoredValue]) -> StoredRow | None:
    """Update the given cells. Returns None if the row doesn't exist."""
    assignments = ", ".join(f"{quote(c)} = ?" for c in values)
    sql = f"UPDATE {quote(dataset_id)} SET {assignments} WHERE _id = ? RETURNING *"
    return _write_one(conn, sql, [*values.values(), row_id])


def delete(conn: sqlite3.Connection, dataset_id: str, row_id: int) -> StoredRow | None:
    """Delete a row. Returns the deleted row, or None if it doesn't exist."""
    return _write_one(conn, f"DELETE FROM {quote(dataset_id)} WHERE _id = ? RETURNING *", [row_id])


def _write_one(conn: sqlite3.Connection, sql: str, params: list[StoredValue]) -> StoredRow | None:
    """Run one write in a transaction and return the affected row."""
    with conn:
        row = conn.execute(sql, params).fetchone()
    return dict(row) if row else None
