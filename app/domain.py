from dataclasses import dataclass
from typing import Literal

Delimiter = Literal[",", ";"]
CellInput = str | int | float | bool | None  # what a client may send for one cell
Row = dict[str, str | int | None]  # a stored row: "_id" plus text or NULL cells


@dataclass(frozen=True)
class Dataset:
    id: str
    display_name: str
    created_at: str
    row_count: int
