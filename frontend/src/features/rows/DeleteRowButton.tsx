import { useState } from 'react'
import { Icon } from '../../components/Icon'
import { button, cx } from '../../lib/styles'

type Props = { rowId: number; onDelete: () => Promise<void> }

/** Deletes the row straight away. Hidden until hover or focus, except on touch screens. */
export function DeleteRowButton({ rowId, onDelete }: Props) {
  const [deleting, setDeleting] = useState(false)

  const remove = async () => {
    setDeleting(true)
    try {
      await onDelete()
    } finally {
      setDeleting(false)
    }
  }

  return (
    <button
      type="button"
      className={cx(
        button.icon,
        'opacity-0 group-hover:opacity-100 hover:text-danger focus-visible:opacity-100 disabled:opacity-40 [@media(hover:none)]:opacity-100',
      )}
      disabled={deleting}
      onClick={() => void remove()}
      aria-label={`Delete row ${rowId}`}
    >
      <Icon name="trash" className="size-3.5" />
    </button>
  )
}
