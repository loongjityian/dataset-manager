import type { Dataset } from '../../api/types'
import { ErrorText } from '../../components/ErrorText'
import { Modal } from '../../components/Modal'
import { plural } from '../../lib/format'
import { button } from '../../lib/styles'

type Props = {
  dataset: Dataset
  deleting: boolean
  error: unknown
  onClose: () => void
  onConfirm: () => void
}

export function DeleteDatasetDialog({ dataset, deleting, error, onClose, onConfirm }: Props) {
  return (
    <Modal title="Delete dataset" onClose={onClose}>
      <div className="px-6 pt-6 pb-5">
        <h2 className="font-display text-2xl leading-tight">Delete “{dataset.display_name}”?</h2>
        <p className="mt-2 text-sm text-muted">
          This removes the dataset and its {plural(dataset.row_count, 'row')} for good. It can't be undone.
        </p>
        <ErrorText error={error} className="mt-3" />
      </div>
      <div className="flex justify-end gap-2 border-t border-line px-6 py-3">
        <button type="button" className={button.ghost} onClick={onClose}>
          Cancel
        </button>
        <button type="button" className={button.danger} disabled={deleting} onClick={onConfirm}>
          {deleting ? 'Deleting…' : 'Delete dataset'}
        </button>
      </div>
    </Modal>
  )
}
