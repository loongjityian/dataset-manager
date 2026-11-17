import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { deleteDataset, getDataset, listDatasets, renameDataset } from '../../api/datasets'
import { queryKeys } from '../../api/queryKeys'
import type { Dataset, DatasetDetail } from '../../api/types'

export function useDatasets() {
  return useQuery({ queryKey: queryKeys.datasets, queryFn: ({ signal }) => listDatasets(signal) })
}

export function useDataset(id: string) {
  return useQuery({ queryKey: queryKeys.dataset(id), queryFn: ({ signal }) => getDataset(id, signal) })
}

export function useRenameDataset(id: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (displayName: string) => renameDataset(id, displayName),
    onSuccess: (updated) => {
      queryClient.setQueryData<DatasetDetail>(queryKeys.dataset(id), (d) => d && { ...d, ...updated })
      queryClient.setQueryData<Dataset[]>(queryKeys.datasets, (list) => list?.map((d) => (d.id === id ? updated : d)))
    },
  })
}

export function useDeleteDataset() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: deleteDataset,
    onSuccess: (deleted) => {
      // Drop it from the list now; its detail and rows queries expire once nothing shows them.
      queryClient.setQueryData<Dataset[]>(queryKeys.datasets, (list) => list?.filter((d) => d.id !== deleted.id))
    },
  })
}
