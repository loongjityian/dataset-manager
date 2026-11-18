import csv
import io
import sqlite3
import uuid
from collections import Counter
from dataclasses import replace
from datetime import UTC, datetime
from pathlib import Path

from app.domain import Column, Dataset, Delimiter, StoredValue
from app.exceptions import DatasetNotFoundError, InvalidFileError
from app.repositories import datasets as repository
from app.utils import column_types

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


def get_columns(conn: sqlite3.Connection, dataset_id: str) -> list[Column]:
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
    names, rows = parse_csv(content, delimiter)
    columns, typed_rows = _apply_types(names, rows)
    dataset = Dataset(
        id=str(uuid.uuid4()),
        display_name=Path(filename).stem,
        created_at=datetime.now(UTC).isoformat(),
        row_count=len(rows),
    )
    repository.create(conn, dataset, columns, typed_rows)
    return dataset


def _apply_types(names: list[str], rows: list[list[str | None]]) -> tuple[list[Column], list[list[StoredValue]]]:
    """Infer each column's type and convert its values to it."""
    columns = [Column(name, column_types.infer(row[i] for row in rows)) for i, name in enumerate(names)]
    typed_rows = [[None if value is None else column_types.from_text(value, column.type) for value, column in zip(row, columns)] for row in rows]
    return columns, typed_rows


def parse_csv(content: bytes, delimiter: Delimiter) -> tuple[list[str], list[list[str | None]]]:
    """Return the header and rows. Empty cells become None."""
    try:
        text = content.decode("utf-8-sig")  # also strips Excel's byte-order mark
    except UnicodeDecodeError:
        raise InvalidFileError("File is not UTF-8. Save it as 'CSV UTF-8' and upload it again.") from None

    # strict: malformed quoting raises csv.Error instead of silently merging or changing values.
    reader = csv.reader(io.StringIO(text, newline=""), delimiter=delimiter, strict=True)
    columns: list[str] | None = None
    rows: list[list[str | None]] = []
    last_line = 0  # the line the previous row ended on, so errors can point at where a row starts
    try:
        for row in reader:
            if not row:  # blank line
                pass
            elif columns is None:
                columns = row
                validate_columns(columns)
                if len(columns) == 1:
                    _check_delimiter(text, delimiter)
            elif len(row) != len(columns):
                raise InvalidFileError(f"Line {reader.line_num} has {len(row)} values, but the header has {len(columns)} columns. Check that line for a missing or extra separator, or an unquoted value that contains one.")
            else:
                rows.append([value.strip() or None for value in row])
            last_line = reader.line_num
    except csv.Error:
        raise InvalidFileError(f'There is a quote (") problem in the row starting on line {last_line + 1}: a quote is never closed, or a value contains a quote but isn\'t wrapped in quotes. Wrap such values in quotes and double any inner quotes ("").') from None

    if columns is None:
        raise InvalidFileError("File is empty.")
    return columns, rows


def _check_delimiter(text: str, delimiter: Delimiter) -> None:
    """Reject a one-column header that splits into several columns with the other delimiter."""
    other = ";" if delimiter == "," else ","
    header = next((row for row in csv.reader(io.StringIO(text, newline=""), delimiter=other) if row), [])
    if len(header) > 1:
        raise InvalidFileError(f"Only one column was found. The values look separated by '{other}'; upload again with '{other}' as the delimiter.")


def validate_columns(columns: list[str]) -> None:
    if len(columns) > MAX_COLUMNS:
        raise InvalidFileError(f"Header has {len(columns)} columns; the maximum is {MAX_COLUMNS}.")
    empty = [str(i) for i, c in enumerate(columns, 1) if not c]
    if empty:
        raise InvalidFileError(f"Header has no name for column {', '.join(empty)}. Every column needs a name.")
    names = [c.lower() for c in columns]  # SQLite column names are case-insensitive.
    if "_id" in names:
        raise InvalidFileError("Header can't have a column named '_id'; it is reserved for the row ID. Rename that column.")
    counts = Counter(names)
    duplicates = sorted({c for c in columns if counts[c.lower()] > 1})
    if duplicates:
        raise InvalidFileError(f"Header has duplicate column names: {', '.join(duplicates)}. Names must be unique (ignoring case).")
