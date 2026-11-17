# Dataset Manager

Upload CSV files and browse and edit each one as its own table, through an API or a web UI.

## Run it

You only need Docker.

```sh
docker compose up --build
```

- Web UI: http://localhost:8080
- API: http://localhost:8000

Data is kept in a Docker volume, so it survives restarts. `docker compose down -v` deletes it.

## API

Swagger UI at http://localhost:8000/docs shows every endpoint's request and response format and lets you try them. `{id}` is the dataset ID from the upload or list response.

### Datasets

| Action | Request | Example body |
|---|---|---|
| Upload | `POST /datasets` | Multipart form: `files` (one or more CSVs), optional `delimiter` (`,` or `;`) |
| List | `GET /datasets` | |
| Get schema | `GET /datasets/{id}` | |
| Rename | `PATCH /datasets/{id}` | `{"display_name": "sales 2026"}` |
| Delete | `DELETE /datasets/{id}` | |

### Rows

| Action | Request | Example body |
|---|---|---|
| Browse | `GET /datasets/{id}/rows?limit=50&offset=0` | |
| Insert | `POST /datasets/{id}/rows` | `{"order_id": "1121", "amount": 19.99}` |
| Update | `PATCH /datasets/{id}/rows/{row_id}` | `{"amount": 20}` (only the columns to change) |
| Delete | `DELETE /datasets/{id}/rows/{row_id}` | |

Errors come back as `{"detail": "..."}`: 400 for bad values such as unknown columns, 404 for a missing dataset or row, 422 for invalid parameters.

## Design decisions and trade-offs

- The backend is FastAPI with SQLite. SQLite is one file on a volume, with no database server to run.
- Each dataset gets its own table, named by a UUID. A `datasets` table records each one's display name and upload time. Display names can repeat and be renamed without touching the table.
- Every value is stored as text. Any CSV loads without guessing types, but sorting and comparing are text-based.
- Every table gets an `_id` primary key, so rows have a stable ID even when the CSV has no unique column.
- A file loads completely or not at all. Its error message names the line and says how to fix it.
- The code is split into API, service and repository layers.
- The web UI is React and TypeScript. Its nginx container forwards `/api` to the backend, so the browser talks to a single origin and the backend needs no CORS setup.

## Assumptions and limitations

- The first non-blank line of a CSV is the header.
- The user picks the delimiter when uploading; the app doesn't detect it.
- An empty cell means `null`.
- Rows are identified by the `_id` the app assigns, not by any column in the CSV.
- Only UTF-8 CSV files up to 50 MB, separated by `,` or `;`.
- Column types are not inferred. The schema shows column names only.
- Header names must be non-empty and unique (ignoring case). `_id` is reserved.
- No authentication, and no guarantees for concurrent edits to the same row.

## Development

Run the tests on the host, from the repo root.

Backend:

```sh
cd backend && uv run pytest
```

Frontend:

```sh
cd frontend && pnpm install && pnpm test
```
