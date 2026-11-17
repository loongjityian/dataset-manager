import csv
import io
import sqlite3
import uuid
from dataclasses import replace
from datetime import UTC, datetime
from pathlib import Path

from app.domain import Dataset, Delimiter
from app.exceptions import DatasetNotFoundError, InvalidFileError
from app.repositories import datasets as repository

# Python's csv module rejects cells over 128 KB by default.
csv.field_size_limit(2**31 - 1)
MAX_COLUMNS = 1999  # SQLite allows 2000 columns per table


def list_datasets(conn: sqlite3.Connection) -> list[Dataset]:
    return repository.list_all(conn)


def get_dataset(conn: sqlite3.Connection, dataset_id: str) -> Dataset:
    dataset = repository.get(conn, dataset_id)
    if dataset is None:
        raise DatasetNotFoundError()
    return dataset


def get_columns(conn: sqlite3.Connection, dataset_id: str) -> list[str]:
    """Also the cheap way to check a dataset exists: a missing table has no columns."""
    columns = repository.get_columns(conn, dataset_id)
    if not columns:
        raise DatasetNotFoundError()
    return columns


def rename_dataset(conn: sqlite3.Connection, dataset_id: str, display_name: str) -> Dataset:
    dataset = get_dataset(conn, dataset_id)
    repository.rename(conn, dataset_id, display_name)
    return replace(dataset, display_name=display_name)


def delete_dataset(conn: sqlite3.Connection, dataset_id: str) -> Dataset:
    dataset = get_dataset(conn, dataset_id)
    repository.delete(conn, dataset_id)
    return dataset


def create_dataset(conn: sqlite3.Connection, filename: str, content: bytes, delimiter: Delimiter) -> Dataset:
    columns, rows = parse_csv(content, delimiter)
    dataset = Dataset(
        id=str(uuid.uuid4()),
        display_name=Path(filename).stem,
        created_at=datetime.now(UTC).isoformat(),
        row_count=len(rows),
    )
    repository.create(conn, dataset, columns, rows)
    return dataset


def parse_csv(content: bytes, delimiter: Delimiter) -> tuple[list[str], list[list[str | None]]]:
    """Return the header and rows. Empty cells become None."""
    try:
        text = content.decode("utf-8-sig")  # also strips Excel's byte-order mark
    except UnicodeDecodeError:
        raise InvalidFileError("File is not UTF-8. Save it as 'CSV UTF-8' and upload it again.") from None

    # strict: malformed quoting raises csv.Error instead of silently merging or changing values.
    reader = csv.reader(io.StringIO(text, newline=""), delimiter=delimiter, strict=True)
    try:
        columns = next((row for row in reader if row), None)  # first non-blank line
        if not columns:
            raise InvalidFileError("File is empty.")
        validate_columns(columns)

        rows: list[list[str | None]] = []
        for row in reader:
            if not row:  # blank line
                continue
            if len(row) != len(columns):
                raise InvalidFileError(f"Line {reader.line_num} has {len(row)} values but the header has {len(columns)}. If values are separated by ';', upload with delimiter=';'.")
            rows.append([value or None for value in row])
    except csv.Error as e:
        raise InvalidFileError(f"Line {reader.line_num} could not be read: {e}") from None

    return columns, rows


def validate_columns(columns: list[str]) -> None:
    if len(columns) > MAX_COLUMNS:
        raise InvalidFileError(f"Header has {len(columns)} columns; the maximum is {MAX_COLUMNS}.")
    names = [c.lower() for c in columns]  # SQLite column names are case-insensitive.
    if "" in names:
        raise InvalidFileError("Header has an empty column name.")
    if "_id" in names:
        raise InvalidFileError("Header can't contain '_id'; it is reserved for the row ID.")
    if len(set(names)) != len(names):
        raise InvalidFileError("Header has duplicate column names.")
