from typing import Annotated

from fastapi import Body
from pydantic import BaseModel

from app.domain import CellInput, Row

# Request body for insert/update: {"column": value, ...}. Objects and arrays are rejected by the type.
RowValues = Annotated[dict[str, CellInput], Body(min_length=1, examples=[{"order_id": "5", "amount": 12.5}])]


class RowsPage(BaseModel):
    rows: list[Row]
    total: int
    limit: int
    offset: int
