import sqlite3

from app.domain import CellInput, Row
from app.exceptions import InvalidRowError, RowNotFoundError
from app.repositories import rows as repository
from app.services import datasets


def list_rows(conn: sqlite3.Connection, dataset_id: str, limit: int, offset: int) -> tuple[list[Row], int]:
    """Return one page of rows and the dataset's total row count."""
    total = datasets.get_dataset(conn, dataset_id).row_count
    return repository.list_page(conn, dataset_id, limit, offset), total


def insert_row(conn: sqlite3.Connection, dataset_id: str, values: dict[str, CellInput]) -> Row:
    return repository.insert(conn, dataset_id, _to_stored(conn, dataset_id, values))


def update_row(conn: sqlite3.Connection, dataset_id: str, row_id: int, values: dict[str, CellInput]) -> Row:
    return _found(repository.update(conn, dataset_id, row_id, _to_stored(conn, dataset_id, values)))


def delete_row(conn: sqlite3.Connection, dataset_id: str, row_id: int) -> Row:
    datasets.get_columns(conn, dataset_id)  # 404 for a missing dataset
    return _found(repository.delete(conn, dataset_id, row_id))


def _found(row: Row | None) -> Row:
    if row is None:
        raise RowNotFoundError()
    return row


def _to_stored(conn: sqlite3.Connection, dataset_id: str, values: dict[str, CellInput]) -> dict[str, str | None]:
    """Check the columns exist and convert every value to text or None."""
    unknown = values.keys() - set(datasets.get_columns(conn, dataset_id))
    if unknown:
        raise InvalidRowError(f"Unknown columns: {', '.join(sorted(unknown))}.")
    return {column: _to_text(value) for column, value in values.items()}


def _to_text(value: CellInput) -> str | None:
    if value is None or value == "":
        return None
    if isinstance(value, bool):  # before str(): Python would write "True"
        return "true" if value else "false"
    return str(value)
