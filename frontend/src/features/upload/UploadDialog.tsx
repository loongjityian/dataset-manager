import { useState } from 'react'
import { useNavigate } from 'react-router'
import type { Delimiter, UploadResult } from '../../api/types'
import { datasetPath } from '../../app/paths'
import { ErrorText } from '../../components/ErrorText'
import { Icon } from '../../components/Icon'
import { Modal } from '../../components/Modal'
import { button } from '../../lib/styles'
import { DelimiterPicker } from './DelimiterPicker'
import { FilePicker } from './FilePicker'
import { useUploadDatasets } from './queries'
import { UploadResults } from './UploadResults'

export function UploadDialog({ onClose }: { onClose: () => void }) {
  const navigate = useNavigate()
  const upload = useUploadDatasets()
  const [files, setFiles] = useState<File[]>([])
  const [delimiter, setDelimiter] = useState<Delimiter>(',')
  const [results, setResults] = useState<UploadResult[] | null>(null)

  const submit = () =>
    upload.mutate(
      { files, delimiter },
      {
        onSuccess: (uploaded) => {
          setResults(uploaded)
          // Results come back in upload order. Keep the failed files for a retry; names can repeat.
          setFiles(files.filter((_, i) => uploaded[i]?.error))
          // Show the first new dataset behind the dialog.
          const created = uploaded.find((r) => r.dataset)?.dataset
          if (created) navigate(datasetPath(created.id))
        },
      },
    )

  const added = results?.filter((r) => r.dataset).length ?? 0
  const failed = (results?.length ?? 0) - added
  const summary = [added && `${added} added`, failed && `${failed} failed`].filter(Boolean).join(' · ')

  return (
    <Modal title="Upload CSV files" onClose={onClose}>
      <div className="flex items-start justify-between px-6 pt-5">
        <div>
          <h2 className="font-display text-2xl leading-none">{results ? 'Upload complete' : 'Upload CSV files'}</h2>
          <p className="mt-2 text-sm text-muted">{results ? summary : 'Each file becomes its own dataset.'}</p>
        </div>
        <button type="button" className={button.icon} onClick={onClose} aria-label="Close">
          <Icon name="x" />
        </button>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
        {results ? (
          <UploadResults results={results} />
        ) : (
          <div className="space-y-5">
            <FilePicker files={files} onChange={setFiles} />
            <DelimiterPicker value={delimiter} onChange={setDelimiter} />
          </div>
        )}
        <ErrorText error={upload.error} className="mt-4" />
      </div>

      <div className="flex justify-end gap-2 border-t border-line px-6 py-3">
        {results ? (
          <>
            {failed > 0 && (
              <button type="button" className={button.secondary} onClick={() => setResults(null)}>
                Retry failed
              </button>
            )}
            <button type="button" className={button.primary} onClick={onClose}>
              Done
            </button>
          </>
        ) : (
          <>
            <button type="button" className={button.ghost} onClick={onClose}>
              Cancel
            </button>
            <button type="button" className={button.primary} disabled={files.length === 0 || upload.isPending} onClick={submit}>
              {upload.isPending ? 'Uploading…' : files.length > 1 ? `Upload ${files.length} files` : 'Upload'}
            </button>
          </>
        )}
      </div>
    </Modal>
  )
}
