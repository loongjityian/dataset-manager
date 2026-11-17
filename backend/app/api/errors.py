from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse

from app.exceptions import DatasetNotFoundError, InvalidRowError, RowNotFoundError

STATUS_CODES: dict[type[Exception], int] = {
    DatasetNotFoundError: 404,
    RowNotFoundError: 404,
    InvalidRowError: 400,
}


def register_error_handlers(app: FastAPI) -> None:
    """Turn the app's errors into HTTP responses with the error message as the detail."""
    for error_type in STATUS_CODES:
        app.add_exception_handler(error_type, _to_response)


def _to_response(request: Request, exc: Exception) -> JSONResponse:
    return JSONResponse(status_code=STATUS_CODES[type(exc)], content={"detail": str(exc)})
