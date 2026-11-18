"""Infer column types from CSV text and convert values between JSON, SQLite and text."""

import math
import re
from collections.abc import Iterable

from app.domain import CellInput, ColumnType, StoredValue

# Declared SQLite type for each column type, so the type can be read back from the table.
# NUMERIC keeps whole numbers as exact integers and the rest as floats.
SQL_TYPES: dict[ColumnType, str] = {"boolean": "BOOLEAN", "number": "NUMERIC", "text": "TEXT"}
_FROM_SQL: dict[str, ColumnType] = {sql: column_type for column_type, sql in SQL_TYPES.items()}

# No "+", leading zeros, exponents or separators: "007", "+60" and "1,000" stay text.
_NUMBER = re.compile(r"-?(0|[1-9][0-9]*)(\.[0-9]+)?")
_INT64 = range(-(2**63), 2**63)


def from_sql_type(declared: str) -> ColumnType:
    return _FROM_SQL[declared]


def infer(values: Iterable[str | None]) -> ColumnType:
    """The narrowest type every non-null value fits. All-null columns are text."""
    present = [v for v in values if v is not None]
    if not present:
        return "text"
    narrowest_first: tuple[ColumnType, ...] = ("boolean", "number")
    return next((t for t in narrowest_first if all(_fits(v, t) for v in present)), "text")


def from_text(text: str, column_type: ColumnType) -> StoredValue:
    """Convert trimmed CSV or typed-in text. Raises ValueError if it doesn't fit."""
    match column_type:
        case "boolean":
            if text.lower() in ("true", "false"):
                return int(text.lower() == "true")
        case "number":
            if _NUMBER.fullmatch(text):
                whole, _, fraction = text.partition(".")
                if fraction.strip("0"):
                    if math.isfinite(number := float(text)):
                        return number
                elif int(whole) in _INT64:  # bigger whole numbers stay text, so they stay exact
                    return int(whole)
        case "text":
            return text
    raise ValueError(text)


def to_stored(value: CellInput, column_type: ColumnType) -> StoredValue:
    """Convert a value a client sent. Strings are trimmed. Raises ValueError if it doesn't fit."""
    if isinstance(value, str):
        value = value.strip()
        return from_text(value, column_type) if value else None
    if value is None:
        return None
    if isinstance(value, bool):
        return from_text("true" if value else "false", column_type)
    if column_type == "text":
        return str(value)
    if column_type == "number":
        if isinstance(value, float) and value.is_integer():
            value = int(value)  # whole numbers must fit int64, as with text
        if isinstance(value, int) and value in _INT64:
            return value
        if isinstance(value, float) and math.isfinite(value):
            return value
    raise ValueError(value)


def to_output(value: StoredValue, column_type: ColumnType) -> CellInput:
    if column_type == "boolean" and value is not None:
        return bool(value)
    if isinstance(value, float):
        return float(f"{value:.15g}")  # hides float noise: 0.1 + 0.2 shows as 0.3
    return value


def _fits(text: str, column_type: ColumnType) -> bool:
    try:
        from_text(text, column_type)
    except ValueError:
        return False
    return True
