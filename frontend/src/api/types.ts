// Mirrors the backend schemas in backend/app/schemas.

export type Delimiter = ',' | ';'

/** A value a client may send for one cell. */
export type CellInput = string | number | boolean | null

/** A stored row: `_id` plus text or NULL cells. */
export type Row = Record<string, string | number | null> & { _id: number }

export type RowValues = Record<string, CellInput>

export type Dataset = {
  id: string
  display_name: string
  created_at: string
  row_count: number
}

export type DatasetDetail = Dataset & {
  /** Column names in order, excluding `_id`. */
  columns: string[]
}

export type UploadResult = {
  filename: string
  dataset: Dataset | null
  error: string | null
}

export type PageParams = { limit: number; offset: number }

export type RowsPage = PageParams & {
  rows: Row[]
  total: number
}
