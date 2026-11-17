import { useRef, useState } from 'react'
import { errorMessage } from '../../api/client'
import { Icon } from '../../components/Icon'
import { cx } from '../../lib/styles'

const MAX_NAME_LENGTH = 255
const titleClass = 'font-display text-3xl leading-[1.1] md:text-4xl'

type Props = { name: string; onRename: (name: string) => Promise<unknown> }

/** The dataset name; click it to rename. Enter or blur saves, Escape cancels. */
export function EditableTitle({ name, onRename }: Props) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(name)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  // Escape unmounts the input, which can fire a blur; this stops that blur from saving.
  const cancelled = useRef(false)

  const start = () => {
    cancelled.current = false
    setDraft(name)
    setEditing(true)
  }

  const stop = () => {
    cancelled.current = true
    setEditing(false)
    setError(null)
  }

  const commit = async () => {
    if (cancelled.current || saving) return
    const value = draft.trim()
    if (value === name) return stop()
    if (value.length < 1 || value.length > MAX_NAME_LENGTH) return setError(`Use 1–${MAX_NAME_LENGTH} characters.`)
    setSaving(true)
    try {
      await onRename(value)
      stop()
    } catch (e) {
      setError(errorMessage(e))
    } finally {
      setSaving(false)
    }
  }

  if (!editing) {
    return (
      <button type="button" onClick={start} className="group flex max-w-full items-center gap-3 text-left" aria-label={`Rename ${name}`}>
        <h1 className={cx(titleClass, 'truncate')}>{name}</h1>
        <Icon name="pencil" className="size-4 shrink-0 text-faint opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100" />
      </button>
    )
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        void commit()
      }}
    >
      <input
        autoFocus
        aria-label="Dataset name"
        value={draft}
        disabled={saving}
        maxLength={MAX_NAME_LENGTH}
        onChange={(e) => setDraft(e.target.value)}
        onFocus={(e) => e.target.select()}
        onBlur={() => void commit()}
        onKeyDown={(e) => {
          if (e.key === 'Escape') stop()
        }}
        className={cx(titleClass, 'w-full border-b-2 border-accent bg-transparent focus:outline-none')}
      />
      {error && (
        <p className="mt-1 text-xs text-danger" role="alert">
          {error}
        </p>
      )}
    </form>
  )
}
