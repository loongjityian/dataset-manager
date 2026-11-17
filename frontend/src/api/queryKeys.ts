import type { PageParams } from './types'

// Keys nest under ['datasets', id] so one invalidation can refresh a dataset and its rows.
export const queryKeys = {
  datasets: ['datasets'] as const,
  dataset: (id: string) => ['datasets', id] as const,
  rows: (id: string) => ['datasets', id, 'rows'] as const,
  rowsPage: (id: string, page: PageParams) => ['datasets', id, 'rows', page] as const,
}
