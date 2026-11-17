from collections.abc import Generator
from pathlib import Path

import pytest
from fastapi.testclient import TestClient

from app.db import database
from app.main import app


@pytest.fixture
def client(tmp_path: Path, monkeypatch: pytest.MonkeyPatch) -> Generator[TestClient]:
    monkeypatch.setattr(database, "DATABASE_PATH", tmp_path / "test.db")
    with TestClient(app) as client:  # "with" runs startup, which creates the registry table
        yield client
