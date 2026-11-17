from typing import Annotated

from fastapi import Body
from pydantic import BaseModel

from app.domain import CellInput, Row

# Request body: {"column": value, ...}. Objects and arrays are rejected by the type.
_EXAMPLES = [{"order_id": "5", "amount": 12.5}]
# Insert: columns left out are NULL, so {} inserts an all-NULL row.
NewRowValues = Annotated[dict[str, CellInput], Body(examples=_EXAMPLES)]
# Update: {} would change nothing, so at least one column is required.
RowValues = Annotated[dict[str, CellInput], Body(min_length=1, examples=_EXAMPLES)]


class RowsPage(BaseModel):
    rows: list[Row]
    total: int
    limit: int
    offset: int
