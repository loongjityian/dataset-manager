from fastapi.testclient import TestClient

MISSING_ID = "00000000-0000-4000-8000-000000000000"


def upload(client: TestClient, filename: str, content: bytes) -> str:
    """Upload one CSV and return the new dataset's ID."""
    response = client.post("/datasets", files=[("files", (filename, content))])
    return response.json()[0]["dataset"]["id"]
