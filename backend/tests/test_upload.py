import pytest
from fastapi.testclient import TestClient

from app.api import datasets


def test_each_file_gets_its_own_result(client: TestClient) -> None:
    files = [
        ("files", ("sales.csv", b"id,amount\n1,10\n2,\n")),
        ("files", ("ragged.csv", b"a,b\n1\n")),
        ("files", ("notes.txt", b"a,b\n")),
    ]

    response = client.post("/datasets", files=files)

    assert response.status_code == 200
    sales, ragged, notes = response.json()
    assert sales["dataset"]["display_name"] == "sales"
    assert sales["dataset"]["row_count"] == 2
    assert sales["error"] is None
    assert ragged["dataset"] is None and "Line 2" in ragged["error"]
    assert notes["error"] == "Only .csv files are supported."
    # Failed files leave nothing behind.
    assert [d["display_name"] for d in client.get("/datasets").json()] == ["sales"]


def test_rejects_files_over_size_limit(client: TestClient, monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setattr(datasets, "MAX_FILE_BYTES", 5)

    result = client.post("/datasets", files=[("files", ("big.csv", b"a,b\n1,2\n"))]).json()[0]

    assert result == {"filename": "big.csv", "dataset": None, "error": "File is larger than 50 MB."}


def test_rejects_unknown_delimiter(client: TestClient) -> None:
    response = client.post(
        "/datasets", files=[("files", ("a.csv", b"a\n"))], data={"delimiter": "|"}
    )

    assert response.status_code == 422
