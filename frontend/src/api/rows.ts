import { request } from './client'
import type { PageParams, Row, RowValues, RowsPage } from './types'

const path = (datasetId: string, rowId?: number) =>
  `/datasets/${encodeURIComponent(datasetId)}/rows${rowId === undefined ? '' : `/${rowId}`}`

export function listRows(datasetId: string, { limit, offset }: PageParams, signal?: AbortSignal) {
  const query = new URLSearchParams({ limit: String(limit), offset: String(offset) })
  return request<RowsPage>(`${path(datasetId)}?${query}`, { signal })
}

export const insertRow = (datasetId: string, values: RowValues) =>
  request<Row>(path(datasetId), { method: 'POST', json: values })

export const updateRow = (datasetId: string, rowId: number, values: RowValues) =>
  request<Row>(path(datasetId, rowId), { method: 'PATCH', json: values })

export const deleteRow = (datasetId: string, rowId: number) => request<Row>(path(datasetId, rowId), { method: 'DELETE' })
