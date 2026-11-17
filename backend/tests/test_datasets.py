from fastapi.testclient import TestClient

from tests.helpers import MISSING_ID, upload


def test_list_is_newest_first_with_row_counts(client: TestClient) -> None:
    upload(client, "first.csv", b"a\n1\n")
    upload(client, "second.csv", b"a\n1\n2\n")

    datasets = client.get("/datasets").json()

    assert [(d["display_name"], d["row_count"]) for d in datasets] == [("second", 2), ("first", 1)]


def test_get_returns_columns_without_id(client: TestClient) -> None:
    dataset_id = upload(client, "sales.csv", b"order_id,amount\n1,10\n")

    dataset = client.get(f"/datasets/{dataset_id}").json()

    assert dataset["display_name"] == "sales"
    assert dataset["columns"] == ["order_id", "amount"]


def test_rename_trims_and_saves(client: TestClient) -> None:
    dataset_id = upload(client, "sales.csv", b"a\n")

    response = client.patch(f"/datasets/{dataset_id}", json={"display_name": "  Sales 2026 "})

    assert response.json()["display_name"] == "Sales 2026"
    assert client.get(f"/datasets/{dataset_id}").json()["display_name"] == "Sales 2026"


def test_rename_rejects_blank_name(client: TestClient) -> None:
    dataset_id = upload(client, "sales.csv", b"a\n")

    assert client.patch(f"/datasets/{dataset_id}", json={"display_name": "  "}).status_code == 422


def test_delete_removes_dataset(client: TestClient) -> None:
    dataset_id = upload(client, "sales.csv", b"a\n1\n")

    response = client.delete(f"/datasets/{dataset_id}")

    assert response.status_code == 200
    assert response.json()["id"] == dataset_id
    assert client.get(f"/datasets/{dataset_id}").status_code == 404
    assert client.get("/datasets").json() == []


def test_unknown_id_is_404(client: TestClient) -> None:
    assert client.get(f"/datasets/{MISSING_ID}").json() == {"detail": "Dataset not found."}
    assert client.patch(f"/datasets/{MISSING_ID}", json={"display_name": "x"}).status_code == 404
    assert client.delete(f"/datasets/{MISSING_ID}").status_code == 404


def test_malformed_id_is_422(client: TestClient) -> None:
    assert client.get("/datasets/not-a-uuid").status_code == 422
