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

### Example uploads

Sample files are included in `examples/`:

- `example1-product-comma.csv`: text, number and boolean columns, including empty cells. Use delimiter `,`.
- `example2-customer-comma.csv`: a simple customer dataset. Use delimiter `,`.
- `example3-inventory-semicolon.csv`: inventory data. Use delimiter `;`.

To upload, open http://localhost:8000/docs, expand `POST /datasets`, and click **Try it out**. Choose a sample under `files`, set its delimiter, then click **Execute**.

Use the returned dataset `id` to try the schema and row endpoints.

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

Errors come back as `{"detail": "..."}`: 400 for bad values such as unknown columns or a value that doesn't fit the column's type, 404 for a missing dataset or row, 422 for invalid parameters.

## Design decisions and trade-offs

- The backend is FastAPI with SQLite. SQLite is one file on a volume, with no database server to run.
- Each dataset gets its own table, named by a UUID. A `datasets` table records each one's display name and upload time. Display names can repeat and be renamed without touching the table.
- Column types are inferred at upload: boolean (`true`/`false`, any case), number or text. A column gets a type only if every non-empty value fits it.
- Types are enforced: a write that doesn't fit its column is rejected, and a column's type never changes. 
- Writes accept either JSON values or strings such as `"3"`, because the web UI sends what you type.
- There is one number type. Numbers are rounded to 15 significant digits.
- Every table gets an `_id` primary key, so rows have a stable ID even when the CSV has no unique column.
- A file loads completely or not at all. Its error message names the line and says how to fix it.
- The code is split into API, service and repository layers.
- The web UI is React and TypeScript. Its nginx container forwards `/api` to the backend, so the browser talks to a single origin and the backend needs no CORS setup.

## Assumptions and limitations

- The first non-blank line of a CSV is the header.
- The user picks the delimiter when uploading; the app doesn't detect it.
- Leading and trailing whitespace is trimmed. 
- An empty or whitespace-only cell means `null`.
- Rows are identified by the `_id` the app assigns, not by any column in the CSV.
- Only UTF-8 CSV files up to 50 MB, separated by `,` or `;`.
- Inferred types can't be changed. 
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
