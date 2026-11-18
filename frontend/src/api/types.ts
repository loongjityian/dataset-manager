// Mirrors the backend schemas in backend/app/schemas.

export type Delimiter = ',' | ';'

/** A value a client may send for one cell. */
export type CellInput = string | number | boolean | null

export type ColumnType = 'boolean' | 'number' | 'text'

export type Column = { name: string; type: ColumnType }

/** A returned row: `_id` plus typed or NULL cells. */
export type Row = Record<string, CellInput> & { _id: number }

export type RowValues = Record<string, CellInput>

export type Dataset = {
  id: string
  display_name: string
  created_at: string
  row_count: number
}

export type DatasetDetail = Dataset & {
  /** Columns in order, excluding `_id`. */
  columns: Column[]
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
