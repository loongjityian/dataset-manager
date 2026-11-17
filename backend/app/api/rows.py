from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Path, Query

from app.db.database import Connection
from app.domain import Row
from app.schemas.rows import NewRowValues, RowsPage, RowValues
from app.services import rows as service

router = APIRouter(prefix="/datasets/{dataset_id}/rows", tags=["rows"])

RowId = Annotated[int, Path(ge=1)]


@router.get("")
def list_rows(
    conn: Connection,
    dataset_id: UUID,
    limit: Annotated[int, Query(ge=1, le=500)] = 50,
    offset: Annotated[int, Query(ge=0)] = 0,
) -> RowsPage:
    """Browse a dataset's rows in _id order."""
    rows, total = service.list_rows(conn, str(dataset_id), limit, offset)
    return RowsPage(rows=rows, total=total, limit=limit, offset=offset)


@router.post("")
def insert_row(conn: Connection, dataset_id: UUID, values: NewRowValues) -> Row:
    """Insert a row. Columns left out are stored as NULL; `{}` inserts an empty row."""
    return service.insert_row(conn, str(dataset_id), values)


@router.patch("/{row_id}")
def update_row(conn: Connection, dataset_id: UUID, row_id: RowId, values: RowValues) -> Row:
    """Update only the given columns of a row."""
    return service.update_row(conn, str(dataset_id), row_id, values)


@router.delete("/{row_id}")
def delete_row(conn: Connection, dataset_id: UUID, row_id: RowId) -> Row:
    """Delete a row. Returns the deleted row."""
    return service.delete_row(conn, str(dataset_id), row_id)
