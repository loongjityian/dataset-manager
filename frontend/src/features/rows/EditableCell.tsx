import { useRef, useState } from 'react'
import { errorMessage } from '../../api/client'
import { cx } from '../../lib/styles'

/** Where to go after a cell closes: the next or previous cell (Tab / Shift+Tab), or nowhere. */
export type Move = 1 | -1 | null

type Props = {
  /** Accessible name, e.g. "amount of row 3". */
  label: string
  value: string | number | null
  editing: boolean
  onEdit: () => void
  onClose: (move: Move) => void
  /** Saves the new text; an empty string means NULL. */
  onSave: (value: string) => Promise<unknown>
}

/** A table cell edited in place. Double-click, Enter or F2 opens it. */
export function EditableCell({ label, value, editing, onEdit, onClose, onSave }: Props) {
  const text = value === null ? '' : String(value)

  return (
    <td
      tabIndex={editing ? -1 : 0}
      aria-label={editing ? undefined : label}
      onDoubleClick={() => !editing && onEdit()}
      onKeyDown={(e) => {
        if (!editing && (e.key === 'Enter' || e.key === 'F2')) {
          e.preventDefault()
          onEdit()
        }
      }}
      title={editing ? undefined : text || 'NULL'}
      className={cx(
        'relative h-9 max-w-72 border-r border-b border-line px-3 group-hover:bg-paper focus:outline-none focus-visible:shadow-[inset_0_0_0_2px_var(--accent)]',
        editing && 'shadow-[inset_0_0_0_2px_var(--accent)]',
      )}
    >
      {/* Stays in place while editing (hidden) so the column keeps its width. */}
      <span className={cx('block truncate', editing && 'invisible')} aria-hidden={editing || undefined}>
        {value === null ? <span className="rounded bg-sunken px-1 py-px text-[10px] tracking-wider text-faint">NULL</span> : text}
      </span>
      {editing && <CellEditor label={label} initial={text} onSave={onSave} onClose={onClose} />}
    </td>
  )
}

type EditorProps = Pick<Props, 'label' | 'onSave' | 'onClose'> & { initial: string }

/** Enter, Tab or blur saves (only if the value changed); Escape cancels. */
function CellEditor({ label, initial, onSave, onClose }: EditorProps) {
  const [draft, setDraft] = useState(initial)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  // Closing unmounts the input, which fires a blur; this stops that blur from saving again.
  const closed = useRef(false)

  const close = (move: Move) => {
    closed.current = true
    // Without a move, keep keyboard focus on this cell.
    if (move === null) inputRef.current?.closest('td')?.focus()
    onClose(move)
  }

  const commit = async (move: Move) => {
    if (closed.current || saving) return
    if (draft === initial) return close(move)
    setSaving(true)
    setError(null)
    try {
      await onSave(draft)
      close(move)
    } catch (e) {
      setError(errorMessage(e))
      setSaving(false)
    }
  }

  return (
    <>
      {/* A textarea, because an <input> drops the line breaks a CSV value can contain. */}
      <textarea
        ref={inputRef}
        autoFocus
        aria-label={label}
        value={draft}
        disabled={saving}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={() => void commit(null)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault()
            void commit(null)
          }
          if (e.key === 'Tab') {
            e.preventDefault()
            void commit(e.shiftKey ? -1 : 1)
          }
          if (e.key === 'Escape') close(null)
        }}
        placeholder="NULL"
        wrap="off"
        // Laid over the cell at its exact size; longer text scrolls inside it.
        className={cx(
          'absolute inset-0.5 min-w-0 resize-none bg-surface px-2.5 py-1.5 font-mono leading-5 text-[13px] placeholder:text-faint focus:outline-none',
          saving && 'text-muted',
        )}
      />
      {error && (
        <span role="alert" className="absolute top-full left-0 z-30 mt-1 w-64 rounded-md bg-danger px-2 py-1 font-sans text-xs text-white shadow">
          {error}
        </span>
      )}
    </>
  )
}
