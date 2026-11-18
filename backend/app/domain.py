from dataclasses import dataclass
from typing import Literal

Delimiter = Literal[",", ";"]
ColumnType = Literal["boolean", "number", "text"]
CellInput = str | int | float | bool | None  # what a client may send for one cell
StoredValue = str | int | float | None  # what SQLite holds; booleans are 0/1
StoredRow = dict[str, StoredValue]  # a row as SQLite returns it: "_id" plus stored cells
Row = dict[str, CellInput]  # a row as the API returns it: booleans as true/false, floats rounded


@dataclass(frozen=True)
class Column:
    name: str
    type: ColumnType


@dataclass(frozen=True)
class Dataset:
    id: str
    display_name: str
    created_at: str
    row_count: int
