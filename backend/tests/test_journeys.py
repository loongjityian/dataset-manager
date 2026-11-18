"""Persistence and isolation expectations spanning several API operations."""
import sqlite3
from contextlib import closing
from pathlib import Path

import pytest
from fastapi.testclient import TestClient

from app.db import database
from app.main import app
from tests.helpers import upload


def test_duplicate_names_are_independent_datasets(client: TestClient) -> None:
    first = upload(client, "sales.csv", b"code,amount\n001,10\n001,20\n")
    second = upload(client, "sales.csv", b"name\nAda\n")
    assert first != second
    assert len(client.get("/datasets").json()) == 2
    assert client.patch(f"/datasets/{first}/rows/1", json={"amount": "15"}).status_code == 200
    assert client.delete(f"/datasets/{first}/rows/2").status_code == 200
    assert client.get(f"/datasets/{first}/rows").json()["rows"] == [
        {"_id": 1, "code": "001", "amount": 15},
    ]
    assert client.get(f"/datasets/{second}/rows").json()["rows"] == [{"_id": 1, "name": "Ada"}]
    assert client.delete(f"/datasets/{first}").status_code == 200
    assert client.get(f"/datasets/{second}/rows").json()["total"] == 1
    with closing(database.connect()) as conn:
        assert conn.execute("SELECT name FROM sqlite_master WHERE name = ?", (first,)).fetchone() is None


def test_upload_uses_chosen_delimiter(client: TestClient) -> None:
    # The upper-case extension is accepted too.
    result = client.post("/datasets", files=[("files", ("sales.CSV", b"code;amount\n001;10,5\n"))], data={"delimiter": ";"})
    assert result.status_code == 200
    dataset_id = result.json()[0]["dataset"]["id"]
    assert client.get(f"/datasets/{dataset_id}/rows").json()["rows"] == [{"_id": 1, "code": "001", "amount": "10,5"}]


def test_header_only_upload_is_an_empty_text_dataset(client: TestClient) -> None:
    empty = upload(client, "empty.csv", b"name\n")
    assert client.get(f"/datasets/{empty}").json()["columns"] == [{"name": "name", "type": "text"}]
    assert client.get(f"/datasets/{empty}/rows").json() == {"rows": [], "total": 0, "limit": 50, "offset": 0}


def test_saved_changes_survive_application_restart(tmp_path: Path, monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setattr(database, "DATABASE_PATH", tmp_path / "nested" / "saved.db")
    with TestClient(app) as client:
        dataset_id = upload(client, "sales.csv", b"code,amount\n001,10\n002,20\n")
        removed = upload(client, "removed.csv", b"a\n1\n")
        assert client.patch(f"/datasets/{dataset_id}", json={"display_name": "Saved sales"}).status_code == 200
        assert client.patch(f"/datasets/{dataset_id}/rows/1", json={"amount": "15"}).status_code == 200
        assert client.post(f"/datasets/{dataset_id}/rows", json={"code": "003"}).status_code == 200
        assert client.delete(f"/datasets/{dataset_id}/rows/2").status_code == 200
        assert client.delete(f"/datasets/{removed}").status_code == 200
    with TestClient(app) as client:
        listing = client.get("/datasets").json()
        assert [(d["id"], d["display_name"], d["row_count"]) for d in listing] == [(dataset_id, "Saved sales", 2)]
        assert client.get(f"/datasets/{dataset_id}/rows").json()["rows"] == [
            {"_id": 1, "code": "001", "amount": 15},
            {"_id": 3, "code": "003", "amount": None},
        ]
        assert client.get(f"/datasets/{removed}").status_code == 404


def test_failed_import_rolls_back_table_and_rows(client: TestClient) -> None:
    # Fail the registry write after CREATE TABLE and row insertion have succeeded.
    with closing(database.connect()) as conn:
        with conn:
            conn.execute("CREATE TRIGGER reject_import BEFORE INSERT ON datasets BEGIN SELECT RAISE(ABORT, 'import failed'); END")
    with pytest.raises(sqlite3.IntegrityError, match="import failed"):
        upload(client, "sales.csv", b"name\nAda\n")
    with closing(database.connect()) as conn:
        assert [r[0] for r in conn.execute("SELECT name FROM sqlite_master WHERE type = 'table'")] == ["datasets"]
        with conn:
            conn.execute("DROP TRIGGER reject_import")
    assert client.get("/datasets").json() == []
    dataset_id = upload(client, "sales.csv", b"name\nAda\n")
    assert client.get(f"/datasets/{dataset_id}/rows").json()["total"] == 1
