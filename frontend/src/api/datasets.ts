import { request } from './client'
import type { Dataset, DatasetDetail, Delimiter, UploadResult } from './types'

const path = (id: string) => `/datasets/${encodeURIComponent(id)}`

export const listDatasets = (signal?: AbortSignal) => request<Dataset[]>('/datasets', { signal })

export const getDataset = (id: string, signal?: AbortSignal) => request<DatasetDetail>(path(id), { signal })

export const renameDataset = (id: string, displayName: string) =>
  request<Dataset>(path(id), { method: 'PATCH', json: { display_name: displayName } })

export const deleteDataset = (id: string) => request<Dataset>(path(id), { method: 'DELETE' })

export function uploadDatasets(files: File[], delimiter: Delimiter) {
  const form = new FormData()
  for (const file of files) form.append('files', file)
  form.append('delimiter', delimiter)
  return request<UploadResult[]>('/datasets', { method: 'POST', form })
}
