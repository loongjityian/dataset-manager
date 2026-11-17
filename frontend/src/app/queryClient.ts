import { QueryClient } from '@tanstack/react-query'
import { ApiError } from '../api/client'

const MAX_RETRIES = 2

export function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 10_000,
        // One user, no concurrent edits: data only changes through this app, which updates
        // the cache itself, so returning to the tab doesn't need a refetch.
        refetchOnWindowFocus: false,
        // Retry only failures that might pass next time: unreachable server or 5xx.
        retry: (failures, error) => failures < MAX_RETRIES && !(error instanceof ApiError && error.status >= 400 && error.status < 500),
      },
    },
  })
}
