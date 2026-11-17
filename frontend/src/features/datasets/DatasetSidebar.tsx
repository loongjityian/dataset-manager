import { useState } from 'react'
import { NavLink } from 'react-router'
import { errorMessage } from '../../api/client'
import { datasetPath } from '../../app/paths'
import { Icon } from '../../components/Icon'
import { formatNumber, formatRelative } from '../../lib/format'
import { button, cx } from '../../lib/styles'
import { useDatasets } from './queries'

type Props = {
  open: boolean
  onClose: () => void
  onUpload: () => void
}

export function DatasetSidebar({ open, onClose, onUpload }: Props) {
  const [filter, setFilter] = useState('')

  return (
    <>
      {open && <div className="fade-in fixed inset-0 z-30 bg-ink/30 md:hidden" onClick={onClose} />}
      <aside
        className={cx(
          'fixed inset-y-0 left-0 z-40 flex w-72 flex-col border-r border-line bg-paper transition-[transform,visibility] md:static md:translate-x-0',
          open ? 'translate-x-0' : '-translate-x-full max-md:invisible',
        )}
      >
        <div className="flex items-center gap-2.5 px-5 pt-5 pb-4">
          <Logo />
          <span className="text-[15px] font-semibold tracking-tight">Dataset Manager</span>
        </div>

        <div className="px-4">
          <button type="button" className={cx(button.primary, 'w-full')} onClick={onUpload}>
            <Icon name="upload" />
            Upload CSV
          </button>
          <label className="relative mt-3 block">
            <span className="sr-only">Filter datasets</span>
            <Icon name="search" className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-faint" />
            <input
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              placeholder="Filter datasets"
              className="h-8 w-full rounded-md border border-transparent bg-sunken pr-2 pl-8 text-sm placeholder:text-faint focus:border-line-strong focus:outline-none"
            />
          </label>
        </div>

        <DatasetList filter={filter} onNavigate={onClose} />
      </aside>
    </>
  )
}

function DatasetList({ filter, onNavigate }: { filter: string; onNavigate: () => void }) {
  const { data: datasets, error, refetch } = useDatasets()
  const query = filter.trim().toLowerCase()
  const visible = datasets?.filter((d) => d.display_name.toLowerCase().includes(query))

  return (
    <>
      <div className="mt-5 flex items-baseline justify-between px-5 pb-2">
        <h2 className="text-[11px] font-medium tracking-[0.12em] text-muted uppercase">Datasets</h2>
        {datasets && <span className="font-mono text-[11px] text-faint">{datasets.length}</span>}
      </div>

      <nav className="min-h-0 flex-1 overflow-y-auto px-2 pb-4" aria-label="Datasets">
        {error && !datasets ? (
          <div className="mx-2 rounded-md border border-danger/30 bg-danger-soft p-3 text-sm text-danger">
            <p>{errorMessage(error)}</p>
            <button type="button" onClick={() => void refetch()} className="mt-2 font-medium underline underline-offset-2">
              Try again
            </button>
          </div>
        ) : !visible ? (
          <div className="space-y-1 px-1">
            {[0, 1, 2].map((i) => (
              <div key={i} className="shimmer h-12 rounded-md" />
            ))}
          </div>
        ) : visible.length === 0 ? (
          <p className="px-3 py-2 text-sm text-muted">{query ? 'No datasets match.' : 'No datasets yet.'}</p>
        ) : (
          <ul className="space-y-px">
            {visible.map((dataset) => (
              <li key={dataset.id}>
                <NavLink
                  to={datasetPath(dataset.id)}
                  onClick={onNavigate}
                  className={({ isActive }) =>
                    cx(
                      'relative block rounded-md px-3 py-2 transition-colors',
                      isActive ? 'bg-surface shadow-[0_0_0_1px_var(--line)]' : 'hover:bg-sunken',
                    )
                  }
                >
                  {({ isActive }) => (
                    <>
                      {isActive && <span className="absolute top-2 bottom-2 left-0 w-[3px] rounded-r bg-accent" />}
                      <span className="block truncate text-sm font-medium">{dataset.display_name}</span>
                      <span className="mt-0.5 flex gap-2 font-mono text-[11px] text-muted">
                        <span>{formatNumber(dataset.row_count)} rows</span>
                        <span className="text-faint">·</span>
                        <span>{formatRelative(dataset.created_at)}</span>
                      </span>
                    </>
                  )}
                </NavLink>
              </li>
            ))}
          </ul>
        )}
      </nav>
    </>
  )
}

function Logo() {
  return (
    <svg viewBox="0 0 24 24" className="size-6" aria-hidden="true">
      <rect x="2" y="2" width="20" height="20" rx="5" className="fill-ink" />
      <path d="M7 8h10M7 12h10M7 16h6" className="stroke-paper" strokeWidth="1.8" strokeLinecap="round" />
      <circle cx="17" cy="16" r="1.6" className="fill-accent" />
    </svg>
  )
}
