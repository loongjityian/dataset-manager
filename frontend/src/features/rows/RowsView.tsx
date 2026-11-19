import { useEffect, useState } from 'react'
import { errorMessage } from '../../api/client'
import type { Row } from '../../api/types'
import { Icon } from '../../components/Icon'
import { LoadError } from '../../components/LoadError'
import { Notice } from '../../components/Notice'
import { useToast } from '../../components/toast/context'
import { button } from '../../lib/styles'
import { Pagination } from './Pagination'
import { useDeleteRow, useInsertRow, useRows, useUpdateRow } from './queries'
import { RowsTable, type CellRef } from './RowsTable'

type Props = {
  datasetId: string
  columns: string[]
  /** 1-based; kept in the URL by the dataset page. */
  page: number
  size: number
  setPage: (page: number, options?: { replace?: boolean }) => void
  setSize: (size: number) => void
}

export function RowsView({ datasetId, columns, page, size, setPage, setSize }: Props) {
  const notify = useToast()
  const { data, error, isFetching, isPlaceholderData, refetch } = useRows(datasetId, { limit: size, offset: (page - 1) * size })
  const insert = useInsertRow(datasetId)
  const update = useUpdateRow(datasetId)
  const remove = useDeleteRow(datasetId)
  const [editing, setEditing] = useState<CellRef | null>(null)

  // Past the last page (after deleting its last row, or from an old link): show the last page instead.
  // Wait for fresh data: a cached page can predate a row just added.
  const lastPage = data && !isPlaceholderData && !isFetching ? Math.max(1, Math.ceil(data.total / size)) : null
  useEffect(() => {
    if (lastPage !== null && page > lastPage) setPage(lastPage, { replace: true })
  }, [lastPage, page, setPage])

  // A new row is all NULL, sent as no values. It lands last, so show
  // the last page and start editing its first cell.
  const addRow = async () => {
    try {
      const created = await insert.mutateAsync({})
      if (data) setPage(Math.ceil((data.total + 1) / size))
      setEditing({ rowId: created._id, column: columns[0] })
    } catch (e) {
      notify(errorMessage(e), 'error')
    }
  }

  const updateCell = (row: Row, column: string, value: string) =>
    update.mutateAsync({ rowId: row._id, values: { [column]: value === '' ? null : value } })

  const deleteRow = async (row: Row) => {
    try {
      await remove.mutateAsync(row._id)
      notify(`Row ${row._id} deleted`)
    } catch (e) {
      notify(errorMessage(e), 'error')
    }
  }

  const addButton = (className: string) => (
    <button type="button" className={className} onClick={() => void addRow()} disabled={insert.isPending}>
      <Icon name="plus" />
      Add row
    </button>
  )

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex items-center gap-3 px-4 py-3 md:px-8">
        {addButton(button.secondary)}
        <p className="hidden text-xs text-muted sm:block">Double-click a cell to edit it. Tab moves to the next one.</p>
        {isFetching && data && (
          <span role="status" aria-label="Loading rows" className="ml-auto size-3.5 animate-spin rounded-full border-2 border-line-strong border-t-accent" />
        )}
      </div>

      <div className="relative min-h-0 flex-1 overflow-auto border-y border-line bg-surface">
        {error && !data ? (
          <LoadError title="Couldn't load rows" error={error} onRetry={() => void refetch()} />
        ) : data?.total === 0 ? (
          <Notice icon="table" title="No rows yet" body="This dataset only has a header. Add the first row to get started.">
            {addButton(button.primary)}
          </Notice>
        ) : (
          <RowsTable
            columns={columns}
            rows={data?.rows ?? null}
            dimmed={isPlaceholderData}
            editing={editing}
            onEditingChange={setEditing}
            onUpdateCell={updateCell}
            onDeleteRow={deleteRow}
          />
        )}
      </div>

      {data && data.total > 0 && (
        <Pagination
          total={data.total}
          page={page}
          size={size}
          disabled={isPlaceholderData}
          onPage={setPage}
          onSize={setSize}
        />
      )}
    </div>
  )
}
