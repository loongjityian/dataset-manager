import { Icon } from '../../components/Icon'
import { formatNumber } from '../../lib/format'
import { button, cx } from '../../lib/styles'
import { PAGE_SIZES } from './pageSizes'

type Props = {
  total: number
  /** 1-based. */
  page: number
  size: number
  disabled: boolean
  onPage: (page: number) => void
  onSize: (size: number) => void
}

const pageButton = cx(button.icon, 'border border-line-strong bg-surface disabled:opacity-40')

export function Pagination({ total, page, size, disabled, onPage, onSize }: Props) {
  const pages = Math.max(1, Math.ceil(total / size))
  const first = Math.min((page - 1) * size + 1, total)
  const last = Math.min(page * size, total)

  return (
    <nav aria-label="Pagination" className="flex flex-wrap items-center gap-x-5 gap-y-2 px-4 py-2.5 text-xs text-muted md:px-8">
      <p className="font-mono">
        <span className="text-ink">
          {formatNumber(first)}–{formatNumber(last)}
        </span>{' '}
        of {formatNumber(total)}
      </p>
      <label className="flex items-center gap-2">
        Rows per page
        <select
          value={size}
          disabled={disabled}
          onChange={(e) => onSize(Number(e.target.value))}
          className="h-7 rounded-md border border-line-strong bg-surface px-1.5 font-mono text-xs text-ink"
        >
          {PAGE_SIZES.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      </label>
      <div className="ml-auto flex items-center gap-1">
        <span className="mr-2 font-mono">
          Page {page} of {pages}
        </span>
        <button type="button" className={pageButton} disabled={disabled || page <= 1} onClick={() => onPage(page - 1)} aria-label="Previous page">
          <Icon name="left" />
        </button>
        <button type="button" className={pageButton} disabled={disabled || page >= pages} onClick={() => onPage(page + 1)} aria-label="Next page">
          <Icon name="right" />
        </button>
      </div>
    </nav>
  )
}
