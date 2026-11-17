from typing import Annotated

from pydantic import BaseModel, ConfigDict, StringConstraints


class DatasetResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    display_name: str
    created_at: str
    row_count: int


class DatasetDetailResponse(DatasetResponse):
    columns: list[str]


class UploadResult(BaseModel):
    filename: str
    dataset: DatasetResponse | None = None
    error: str | None = None


class RenameRequest(BaseModel):
    display_name: Annotated[str, StringConstraints(strip_whitespace=True, min_length=1, max_length=255)]
