import sqlite3
from dataclasses import asdict
from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, File, Form, UploadFile

from app.db.database import Connection
from app.domain import Delimiter
from app.exceptions import InvalidFileError
from app.schemas.datasets import ColumnResponse, DatasetDetailResponse, DatasetResponse, RenameRequest, UploadResult
from app.services import datasets as service

MAX_FILE_BYTES = 50 * 1024 * 1024  # 50MB limit

router = APIRouter(prefix="/datasets", tags=["datasets"])


@router.post("")
def upload_datasets(
    conn: Connection,
    files: Annotated[list[UploadFile], File(
        description="One or more CSV files.",
        # Swagger UI only shows a file picker for format: binary.
        json_schema_extra={"items": {"type": "string", "format": "binary"}},
    )],
    delimiter: Annotated[Delimiter, Form()] = ",",
) -> list[UploadResult]:
    """Create one dataset per file. Each file succeeds or fails on its own."""
    return [_upload(conn, file, delimiter) for file in files]


@router.get("")
def list_datasets(conn: Connection) -> list[DatasetResponse]:
    """List all datasets, newest first."""
    return [DatasetResponse.model_validate(d) for d in service.list_datasets(conn)]


@router.get("/{dataset_id}")
def get_dataset(conn: Connection, dataset_id: UUID) -> DatasetDetailResponse:
    """Get a dataset and its columns with their inferred types."""
    dataset = service.get_dataset(conn, str(dataset_id))
    columns = [ColumnResponse.model_validate(c) for c in service.get_columns(conn, str(dataset_id))]
    return DatasetDetailResponse(**asdict(dataset), columns=columns)


@router.patch("/{dataset_id}")
def rename_dataset(conn: Connection, dataset_id: UUID, body: RenameRequest) -> DatasetResponse:
    """Change a dataset's display name."""
    dataset = service.rename_dataset(conn, str(dataset_id), body.display_name)
    return DatasetResponse.model_validate(dataset)


@router.delete("/{dataset_id}")
def delete_dataset(conn: Connection, dataset_id: UUID) -> DatasetResponse:
    """Delete a dataset and all its rows. Returns the deleted dataset."""
    return DatasetResponse.model_validate(service.delete_dataset(conn, str(dataset_id)))


def _upload(conn: sqlite3.Connection, file: UploadFile, delimiter: Delimiter) -> UploadResult:
    filename = file.filename or "untitled"
    if not filename.lower().endswith(".csv"):
        return UploadResult(filename=filename, error="Only .csv files are supported.")
    if file.size is not None and file.size > MAX_FILE_BYTES:
        return UploadResult(filename=filename, error="File is larger than 50 MB.")
    try:
        dataset = service.create_dataset(conn, filename, file.file.read(), delimiter)
    except InvalidFileError as e:
        return UploadResult(filename=filename, error=str(e))
    return UploadResult(filename=filename, dataset=DatasetResponse.model_validate(dataset))
