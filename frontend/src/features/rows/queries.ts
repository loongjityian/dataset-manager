import { keepPreviousData, useMutation, useQuery, useQueryClient, type QueryClient } from '@tanstack/react-query'
import { queryKeys } from '../../api/queryKeys'
import { deleteRow, insertRow, listRows, updateRow } from '../../api/rows'
import type { Dataset, DatasetDetail, PageParams, RowValues, RowsPage } from '../../api/types'

export function useRows(datasetId: string, page: PageParams) {
  return useQuery({
    queryKey: queryKeys.rowsPage(datasetId, page),
    queryFn: ({ signal }) => listRows(datasetId, page, signal),
    // Keep the current page on screen while the next one loads.
    placeholderData: keepPreviousData,
  })
}

export function useInsertRow(datasetId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (values: RowValues) => insertRow(datasetId, values),
    onSuccess: () => afterInsertOrDelete(queryClient, datasetId, 1),
  })
}

export function useDeleteRow(datasetId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (rowId: number) => deleteRow(datasetId, rowId),
    onSuccess: () => afterInsertOrDelete(queryClient, datasetId, -1),
  })
}

export function useUpdateRow(datasetId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ rowId, values }: { rowId: number; values: RowValues }) => updateRow(datasetId, rowId, values),
    // The response is the whole updated row, so patch it in place.
    onSuccess: (updated) => {
      queryClient.setQueriesData<RowsPage>({ queryKey: queryKeys.rows(datasetId) }, (page) =>
        page && { ...page, rows: page.rows.map((r) => (r._id === updated._id ? updated : r)) },
      )
    },
  })
}

/**
 * Adjusts the row count shown in the header and dataset list, then reloads the rows:
 * an insert or delete shifts rows between pages. The mutation waits for the reload and fails if it fails.
 */
function afterInsertOrDelete(queryClient: QueryClient, datasetId: string, delta: number) {
  queryClient.setQueryData<DatasetDetail>(queryKeys.dataset(datasetId), (d) => d && { ...d, row_count: d.row_count + delta })
  queryClient.setQueryData<Dataset[]>(queryKeys.datasets, (list) =>
    list?.map((d) => (d.id === datasetId ? { ...d, row_count: d.row_count + delta } : d)),
  )
  return queryClient.invalidateQueries({ queryKey: queryKeys.rows(datasetId) }, { throwOnError: true })
}
