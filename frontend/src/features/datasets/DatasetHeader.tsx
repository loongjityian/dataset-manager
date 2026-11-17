import type { ReactNode } from 'react'
import type { DatasetDetail } from '../../api/types'
import { Icon } from '../../components/Icon'
import { MenuButton } from '../../components/MenuButton'
import { formatDate, formatNumber } from '../../lib/format'
import { button, cx } from '../../lib/styles'
import { EditableTitle } from './EditableTitle'
import type { Tab } from './useDatasetView'

type Props = {
  dataset: DatasetDetail
  tab: Tab
  onTab: (tab: Tab) => void
  onRename: (name: string) => Promise<unknown>
  onDelete: () => void
  onCopyId: () => void
  onMenu: () => void
}

export function DatasetHeader({ dataset, tab, onTab, onRename, onDelete, onCopyId, onMenu }: Props) {
  return (
    <header className="border-b border-line bg-paper px-4 pt-4 md:px-8 md:pt-7">
      <div className="flex items-start gap-3">
        <MenuButton onClick={onMenu} className="mt-1" />
        <div className="min-w-0 flex-1">
          <EditableTitle key={dataset.id} name={dataset.display_name} onRename={onRename} />
        </div>
        <button type="button" className={cx(button.ghost, 'hover:text-danger')} onClick={onDelete} aria-label="Delete dataset">
          <Icon name="trash" />
          <span className="hidden sm:inline">Delete</span>
        </button>
      </div>

      <dl className="mt-3 flex flex-wrap gap-x-6 gap-y-1.5 font-mono text-xs text-muted">
        <Meta label="ID">
          <button type="button" onClick={onCopyId} className="group inline-flex items-center gap-1 hover:text-ink" title={`Copy ${dataset.id}`}>
            {dataset.id.slice(0, 8)}
            <Icon name="copy" className="size-3 opacity-50 group-hover:opacity-100" />
          </button>
        </Meta>
        <Meta label="Rows">{formatNumber(dataset.row_count)}</Meta>
        <Meta label="Columns">{dataset.columns.length}</Meta>
        <Meta label="Created">{formatDate(dataset.created_at)}</Meta>
      </dl>

      <div role="tablist" className="mt-5 -mb-px flex gap-6">
        <TabButton active={tab === 'rows'} onClick={() => onTab('rows')} count={dataset.row_count}>
          Rows
        </TabButton>
        <TabButton active={tab === 'schema'} onClick={() => onTab('schema')} count={dataset.columns.length}>
          Schema
        </TabButton>
      </div>
    </header>
  )
}

function Meta({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex items-baseline gap-1.5">
      <dt className="text-[10px] tracking-[0.12em] text-faint uppercase">{label}</dt>
      <dd className="text-ink/80">{children}</dd>
    </div>
  )
}

type TabButtonProps = { active: boolean; onClick: () => void; count: number; children: string }

function TabButton({ active, onClick, count, children }: TabButtonProps) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className={cx(
        'flex items-center gap-2 border-b-2 pb-2.5 text-sm font-medium transition-colors',
        active ? 'border-accent text-ink' : 'border-transparent text-muted hover:text-ink',
      )}
    >
      {children}
      <span className={cx('rounded px-1.5 font-mono text-[11px]', active ? 'bg-accent-soft text-accent' : 'bg-sunken text-muted')}>
        {formatNumber(count)}
      </span>
    </button>
  )
}
