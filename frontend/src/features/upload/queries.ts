import { useMutation, useQueryClient } from '@tanstack/react-query'
import { uploadDatasets } from '../../api/datasets'
import { queryKeys } from '../../api/queryKeys'
import type { Delimiter } from '../../api/types'

export function useUploadDatasets() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ files, delimiter }: { files: File[]; delimiter: Delimiter }) => uploadDatasets(files, delimiter),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.datasets, exact: true }),
  })
}
