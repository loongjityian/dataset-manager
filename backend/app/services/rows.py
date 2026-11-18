import sqlite3

from app.domain import CellInput, Column, ColumnType, Row, StoredRow, StoredValue
from app.exceptions import InvalidRowError, RowNotFoundError
from app.repositories import rows as repository
from app.services import datasets
from app.utils import column_types

# Completes "<column> must be ...". Text columns accept anything.
_EXPECTED: dict[ColumnType, str] = {"boolean": "true or false", "number": "a number"}


def list_rows(conn: sqlite3.Connection, dataset_id: str, limit: int, offset: int) -> tuple[list[Row], int]:
    """Return one page of rows and the dataset's total row count."""
    total = datasets.get_dataset(conn, dataset_id).row_count
    types = _types(datasets.get_columns(conn, dataset_id))
    return [_to_output(row, types) for row in repository.list_page(conn, dataset_id, limit, offset)], total


def insert_row(conn: sqlite3.Connection, dataset_id: str, values: dict[str, CellInput]) -> Row:
    types = _types(datasets.get_columns(conn, dataset_id))
    return _to_output(repository.insert(conn, dataset_id, _to_stored(types, values)), types)


def update_row(conn: sqlite3.Connection, dataset_id: str, row_id: int, values: dict[str, CellInput]) -> Row:
    types = _types(datasets.get_columns(conn, dataset_id))
    return _to_output(_found(repository.update(conn, dataset_id, row_id, _to_stored(types, values))), types)


def delete_row(conn: sqlite3.Connection, dataset_id: str, row_id: int) -> Row:
    types = _types(datasets.get_columns(conn, dataset_id))  # also 404 for a missing dataset
    return _to_output(_found(repository.delete(conn, dataset_id, row_id)), types)


def _types(columns: list[Column]) -> dict[str, ColumnType]:
    return {column.name: column.type for column in columns}


def _found(row: StoredRow | None) -> StoredRow:
    if row is None:
        raise RowNotFoundError()
    return row


def _to_stored(types: dict[str, ColumnType], values: dict[str, CellInput]) -> dict[str, StoredValue]:
    """Check the columns exist and convert every value to its column's type."""
    unknown = values.keys() - types.keys()
    if unknown:
        raise InvalidRowError(f"Unknown columns: {', '.join(sorted(unknown))}.")
    stored: dict[str, StoredValue] = {}
    for column, value in values.items():
        try:
            stored[column] = column_types.to_stored(value, types[column])
        except ValueError:
            raise InvalidRowError(f"{column} must be {_EXPECTED[types[column]]}.") from None
    return stored


def _to_output(row: StoredRow, types: dict[str, ColumnType]) -> Row:
    return {name: value if name == "_id" else column_types.to_output(value, types[name]) for name, value in row.items()}
