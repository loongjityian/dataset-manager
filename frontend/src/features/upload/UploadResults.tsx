import type { UploadResult } from '../../api/types'
import { Icon } from '../../components/Icon'
import { formatNumber } from '../../lib/format'
import { cx } from '../../lib/styles'

/** One line per uploaded file: the dataset it created, or why it failed. */
export function UploadResults({ results }: { results: UploadResult[] }) {
  return (
    <ul className="space-y-2" aria-label="Upload results">
      {results.map((result, i) => {
        const { dataset } = result
        return (
          <li
            key={`${result.filename}-${i}`}
            className={cx(
              'rise flex items-start gap-3 rounded-lg border px-3 py-2.5',
              dataset ? 'border-line bg-paper' : 'border-danger/25 bg-danger-soft',
            )}
            style={{ animationDelay: `${i * 60}ms` }}
          >
            <span className={cx('mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full text-white', dataset ? 'bg-ok' : 'bg-danger')}>
              <Icon name={dataset ? 'check' : 'x'} className="size-3" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate font-mono text-[13px]">{result.filename}</p>
              <p className={cx('mt-0.5 text-xs', dataset ? 'text-muted' : 'text-danger')}>
                {dataset ? `${formatNumber(dataset.row_count)} rows imported` : result.error}
              </p>
            </div>
          </li>
        )
      })}
    </ul>
  )
}
