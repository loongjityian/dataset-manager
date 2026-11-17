import pytest
from fastapi.testclient import TestClient

from tests.helpers import MISSING_ID, upload


@pytest.fixture
def rows_url(client: TestClient) -> str:
    """A dataset with columns order_id, amount and rows 1..3."""
    dataset_id = upload(client, "sales.csv", b"order_id,amount\n1,10\n2,\n3,30\n")
    return f"/datasets/{dataset_id}/rows"


def test_browse_paginates_in_id_order(client: TestClient, rows_url: str) -> None:
    page = client.get(rows_url, params={"limit": 2, "offset": 1}).json()

    assert page == {
        "rows": [
            {"_id": 2, "order_id": "2", "amount": None},
            {"_id": 3, "order_id": "3", "amount": "30"},
        ],
        "total": 3,
        "limit": 2,
        "offset": 1,
    }


@pytest.mark.parametrize("params", [{"limit": 0}, {"limit": 501}, {"offset": -1}])
def test_browse_rejects_bad_paging(client: TestClient, rows_url: str, params: dict[str, int]) -> None:
    assert client.get(rows_url, params=params).status_code == 422


def test_insert_stores_values_as_text(client: TestClient, rows_url: str) -> None:
    response = client.post(rows_url, json={"order_id": 4, "amount": 12.5})

    assert response.status_code == 200
    assert response.json() == {"_id": 4, "order_id": "4", "amount": "12.5"}
    page = client.get(rows_url).json()
    assert page["rows"][-1] == response.json()
    assert page["total"] == 4
    assert client.get(rows_url.removesuffix("/rows")).json()["row_count"] == 4


@pytest.mark.parametrize(("value", "expected"), [(True, "true"), (False, "false"), (0, "0")])
def test_insert_converts_scalars_and_blanks(client: TestClient, rows_url: str, value: bool | int, expected: str) -> None:
    row = client.post(rows_url, json={"order_id": value, "amount": ""}).json()

    assert row == {"_id": 4, "order_id": expected, "amount": None}


def test_insert_missing_columns_are_null(client: TestClient, rows_url: str) -> None:
    assert client.post(rows_url, json={"order_id": "4"}).json()["amount"] is None


def test_insert_empty_body_gives_all_null_row(client: TestClient, rows_url: str) -> None:
    assert client.post(rows_url, json={}).json() == {"_id": 4, "order_id": None, "amount": None}


def test_update_changes_only_given_columns(client: TestClient, rows_url: str) -> None:
    response = client.patch(f"{rows_url}/1", json={"amount": None})

    assert response.json() == {"_id": 1, "order_id": "1", "amount": None}
    page = client.get(rows_url).json()
    assert page["rows"][0] == response.json()
    assert page["rows"][2] == {"_id": 3, "order_id": "3", "amount": "30"}


def test_delete_returns_row_and_removes_it(client: TestClient, rows_url: str) -> None:
    response = client.delete(f"{rows_url}/1")

    assert response.json() == {"_id": 1, "order_id": "1", "amount": "10"}
    assert client.get(rows_url).json()["total"] == 2
    assert client.delete(f"{rows_url}/1").json() == {"detail": "Row not found."}


@pytest.mark.parametrize("body", [{"unknown": "x"}, {"_id": 99}])
def test_unknown_columns_are_400(client: TestClient, rows_url: str, body: dict[str, object]) -> None:
    assert client.post(rows_url, json=body).status_code == 400
    assert client.patch(f"{rows_url}/1", json=body).status_code == 400
    assert client.get(rows_url).json()["rows"] == [
        {"_id": 1, "order_id": "1", "amount": "10"},
        {"_id": 2, "order_id": "2", "amount": None},
        {"_id": 3, "order_id": "3", "amount": "30"},
    ]


@pytest.mark.parametrize("body", [{"amount": {"nested": 1}}, {"amount": [1, 2]}])
def test_invalid_bodies_are_422(client: TestClient, rows_url: str, body: dict[str, object]) -> None:
    assert client.post(rows_url, json=body).status_code == 422
    assert client.patch(f"{rows_url}/1", json=body).status_code == 422


def test_empty_update_is_422(client: TestClient, rows_url: str) -> None:
    assert client.patch(f"{rows_url}/1", json={}).status_code == 422


def test_unknown_row_or_dataset_is_404(client: TestClient, rows_url: str) -> None:
    assert client.patch(f"{rows_url}/99", json={"amount": "1"}).status_code == 404
    assert client.get(f"/datasets/{MISSING_ID}/rows").json() == {"detail": "Dataset not found."}
    assert client.post(f"/datasets/{MISSING_ID}/rows", json={"a": "1"}).status_code == 404
    assert client.delete(f"/datasets/{MISSING_ID}/rows/1").status_code == 404


def test_row_id_must_be_positive(client: TestClient, rows_url: str) -> None:
    assert client.delete(f"{rows_url}/0").status_code == 422
