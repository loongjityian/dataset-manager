import type { Dispatch, SetStateAction } from 'react'
import type { Row } from '../../api/types'
import { cx } from '../../lib/styles'
import { DeleteRowButton } from './DeleteRowButton'
import { EditableCell, type Move } from './EditableCell'

/** The cell being edited. */
export type CellRef = { rowId: number; column: string }

type Props = {
  columns: string[]
  /** `null` while the first page loads. */
  rows: Row[] | null
  /** Fades the rows while a different page loads. */
  dimmed: boolean
  editing: CellRef | null
  onEditingChange: Dispatch<SetStateAction<CellRef | null>>
  onUpdateCell: (row: Row, column: string, value: string) => Promise<unknown>
  onDeleteRow: (row: Row) => Promise<void>
}

const SKELETON_ROWS = 10

export function RowsTable({ columns, rows, dimmed, editing, onEditingChange, onUpdateCell, onDeleteRow }: Props) {
  // Tab and Shift+Tab move along the row; past either end, editing stops.
  // A slow save closes its cell only if that cell is still the one being edited.
  const close = (rowId: number, columnIndex: number, move: Move) => {
    const next = move === null ? undefined : columns[columnIndex + move]
    onEditingChange((current) =>
      current?.rowId !== rowId || current.column !== columns[columnIndex] ? current : next === undefined ? null : { rowId, column: next },
    )
  }

  return (
    <table
      aria-busy={rows === null}
      className={cx('w-max min-w-full border-separate border-spacing-0 font-mono text-[13px] transition-opacity', dimmed && 'opacity-60')}
    >
      <thead>
        <tr>
          <th className="sticky top-0 left-0 z-20 w-16 border-r border-b border-line bg-sunken px-3 py-2 text-left font-sans text-[11px] font-medium text-faint">
            _id
          </th>
          {columns.map((column) => (
            <th key={column} className="sticky top-0 z-10 border-r border-b border-line bg-sunken px-3 py-2 text-left font-sans text-xs font-medium text-ink">
              {column}
            </th>
          ))}
          <th className="sticky top-0 right-0 z-20 w-12 border-b border-line bg-sunken">
            <span className="sr-only">Actions</span>
          </th>
        </tr>
      </thead>
      <tbody>
        {rows === null
          ? Array.from({ length: SKELETON_ROWS }, (_, i) => <SkeletonRow key={i} index={i} columns={columns} />)
          : rows.map((row) => (
              <tr key={row._id} className="group">
                <td className="sticky left-0 z-[5] border-r border-b border-line bg-surface px-3 text-[12px] text-faint group-hover:bg-paper">
                  {row._id}
                </td>
                {columns.map((column, i) => (
                  <EditableCell
                    key={column}
                    label={`${column} of row ${row._id}`}
                    value={row[column] ?? null}
                    editing={editing?.rowId === row._id && editing.column === column}
                    onEdit={() => onEditingChange({ rowId: row._id, column })}
                    onClose={(move) => close(row._id, i, move)}
                    onSave={(value) => onUpdateCell(row, column, value)}
                  />
                ))}
                <td className="sticky right-0 border-b border-line bg-surface px-1.5 text-right group-hover:bg-paper">
                  <DeleteRowButton rowId={row._id} onDelete={() => onDeleteRow(row)} />
                </td>
              </tr>
            ))}
      </tbody>
    </table>
  )
}

function SkeletonRow({ index, columns }: { index: number; columns: string[] }) {
  return (
    <tr>
      <td className="border-b border-line px-3 py-2.5">
        <div className="shimmer h-3 w-6 rounded" />
      </td>
      {columns.map((column) => (
        <td key={column} className="border-b border-line px-3 py-2.5">
          {/* Varied widths look more like real data. */}
          <div className="shimmer h-3 rounded" style={{ width: `${48 + ((index * 37 + column.length * 13) % 80)}px` }} />
        </td>
      ))}
      <td className="border-b border-line" />
    </tr>
  )
}
