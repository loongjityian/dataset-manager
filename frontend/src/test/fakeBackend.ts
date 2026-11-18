// An in-memory stand-in for the FastAPI backend, served through MSW. It follows the
// contract in doc/decisions.md closely enough for UI tests; it is not a second implementation.
import { http, HttpResponse } from 'msw'
import type { CellInput, Column, Dataset, DatasetDetail, Row, RowsPage, RowValues } from '../api/types'

// The fake stores values as sent; it doesn't convert or validate them by column type.
type Table = { dataset: Omit<Dataset, 'row_count'>; columns: Column[]; rows: Row[]; nextRowId: number }

export type RecordedRequest = { method: string; path: string; body: unknown }

const API = '/api'
const notFound = (what: 'Dataset' | 'Row') => HttpResponse.json({ detail: `${what} not found` }, { status: 404 })

export function createFakeBackend() {
  const tables = new Map<string, Table>()
  const requests: RecordedRequest[] = []
  let created = 0

  const summary = (t: Table): Dataset => ({ ...t.dataset, row_count: t.rows.length })

  function addDataset(name: string, columns: Column[], rows: CellInput[][] = []): Dataset {
    const id = crypto.randomUUID()
    // Later datasets are newer.
    const createdAt = new Date(Date.UTC(2026, 10, 1, 9, created++)).toISOString()
    const table: Table = {
      dataset: { id, display_name: name, created_at: createdAt },
      columns,
      rows: rows.map((values, i) => ({ _id: i + 1, ...Object.fromEntries(columns.map(({ name }, j) => [name, values[j] ?? null])) })),
      nextRowId: rows.length + 1,
    }
    tables.set(id, table)
    return summary(table)
  }

  async function record(request: Request) {
    const body = request.headers.get('content-type')?.includes('application/json') ? await request.clone().json() : null
    requests.push({ method: request.method, path: new URL(request.url).pathname.slice(API.length) + new URL(request.url).search, body })
  }

  // No upload handler: jsdom can't send multipart bodies through Node's fetch, so
  // upload tests mock the API module instead (see features/upload/upload.test.tsx).
  const handlers = [
    http.get(`${API}/datasets`, () =>
      HttpResponse.json([...tables.values()].map(summary).sort((a, b) => b.created_at.localeCompare(a.created_at))),
    ),

    http.get(`${API}/datasets/:id`, ({ params }) => {
      const table = tables.get(String(params.id))
      if (!table) return notFound('Dataset')
      return HttpResponse.json<DatasetDetail>({ ...summary(table), columns: table.columns })
    }),

    http.patch(`${API}/datasets/:id`, async ({ request, params }) => {
      await record(request)
      const table = tables.get(String(params.id))
      if (!table) return notFound('Dataset')
      const { display_name } = (await request.json()) as { display_name: string }
      table.dataset.display_name = display_name.trim()
      return HttpResponse.json(summary(table))
    }),

    http.delete(`${API}/datasets/:id`, async ({ request, params }) => {
      await record(request)
      const table = tables.get(String(params.id))
      if (!table) return notFound('Dataset')
      tables.delete(table.dataset.id)
      return HttpResponse.json(summary(table))
    }),

    http.get(`${API}/datasets/:id/rows`, ({ request, params }) => {
      const table = tables.get(String(params.id))
      if (!table) return notFound('Dataset')
      const url = new URL(request.url)
      const limit = Number(url.searchParams.get('limit') ?? 50)
      const offset = Number(url.searchParams.get('offset') ?? 0)
      return HttpResponse.json<RowsPage>({ rows: table.rows.slice(offset, offset + limit), total: table.rows.length, limit, offset })
    }),

    http.post(`${API}/datasets/:id/rows`, async ({ request, params }) => {
      await record(request)
      const table = tables.get(String(params.id))
      if (!table) return notFound('Dataset')
      const values = (await request.json()) as RowValues
      const row: Row = { _id: table.nextRowId++, ...Object.fromEntries(table.columns.map(({ name }) => [name, values[name] ?? null])) }
      table.rows.push(row)
      return HttpResponse.json(row)
    }),

    http.patch(`${API}/datasets/:id/rows/:rowId`, async ({ request, params }) => {
      await record(request)
      const row = tables.get(String(params.id))?.rows.find((r) => r._id === Number(params.rowId))
      if (!row) return notFound('Row')
      Object.assign(row, (await request.json()) as RowValues)
      return HttpResponse.json(row)
    }),

    http.delete(`${API}/datasets/:id/rows/:rowId`, async ({ request, params }) => {
      await record(request)
      const table = tables.get(String(params.id))
      const row = table?.rows.find((r) => r._id === Number(params.rowId))
      if (!table || !row) return notFound('Row')
      table.rows = table.rows.filter((r) => r !== row)
      return HttpResponse.json(row)
    }),
  ]

  return {
    handlers,
    addDataset,
    /** Writes the app sent, in order: method, path after /api, and JSON body. */
    requests,
    rows: (datasetId: string) => tables.get(datasetId)?.rows ?? [],
  }
}

export const textColumns = (...names: string[]): Column[] => names.map((name) => ({ name, type: 'text' }))

/** Builds rows like [["SO-1", "10"], ["SO-2", "20"], …] for paging tests. */
export const numberedRows = (count: number, prefix = 'SO'): string[][] =>
  Array.from({ length: count }, (_, i) => [`${prefix}-${i + 1}`, String((i + 1) * 10)])
