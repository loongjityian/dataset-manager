import { useSearchParams } from 'react-router'
import { DEFAULT_PAGE_SIZE, PAGE_SIZES } from '../rows/pageSizes'

export type Tab = 'rows' | 'schema'

/**
 * The dataset screen's tab, page and page size, kept in the URL so refresh,
 * back and shared links restore the same view. Defaults are left out of the URL.
 */
export function useDatasetView() {
  const [params, setParams] = useSearchParams()

  const tab: Tab = params.get('tab') === 'schema' ? 'schema' : 'rows'
  const sizeParam = Number(params.get('size'))
  const size = (PAGE_SIZES as readonly number[]).includes(sizeParam) ? sizeParam : DEFAULT_PAGE_SIZE
  const page = Math.max(1, Number.parseInt(params.get('page') ?? '', 10) || 1)

  const update = (changes: Record<string, string | null>, replace = false) =>
    setParams(
      (current) => {
        const next = new URLSearchParams(current)
        for (const [key, value] of Object.entries(changes)) {
          if (value === null) next.delete(key)
          else next.set(key, value)
        }
        return next
      },
      { replace },
    )

  return {
    tab,
    page,
    size,
    setTab: (next: Tab) => update({ tab: next === 'rows' ? null : next }),
    setPage: (next: number, options?: { replace?: boolean }) =>
      update({ page: next <= 1 ? null : String(next) }, options?.replace),
    setSize: (next: number) => update({ size: next === DEFAULT_PAGE_SIZE ? null : String(next), page: null }),
  }
}
