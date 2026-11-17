import { useRef, useState } from 'react'
import { Icon } from '../../components/Icon'
import { formatBytes } from '../../lib/format'
import { button, cx } from '../../lib/styles'

type Props = { files: File[]; onChange: (files: File[]) => void }

const fileKey = (file: File) => `${file.name}:${file.size}:${file.lastModified}`

/** A drop zone plus the list of chosen files. Choosing the same file twice keeps one copy. */
export function FilePicker({ files, onChange }: Props) {
  const [dragging, setDragging] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const add = (list: FileList | null) => {
    if (!list) return
    const known = new Set(files.map(fileKey))
    onChange([...files, ...Array.from(list).filter((f) => !known.has(fileKey(f)))])
  }

  return (
    <>
      <button
        type="button"
        aria-label="Choose CSV files"
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault()
          setDragging(true)
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault()
          setDragging(false)
          add(e.dataTransfer.files)
        }}
        className={cx(
          'flex w-full cursor-pointer flex-col items-center rounded-lg border-2 border-dashed px-6 py-8 text-center transition-colors',
          dragging ? 'border-accent bg-accent-soft' : 'border-line-strong bg-paper hover:border-muted',
        )}
      >
        <span
          className={cx(
            'flex size-11 items-center justify-center rounded-full transition-transform',
            dragging ? 'scale-110 bg-accent text-white' : 'bg-sunken text-muted',
          )}
        >
          <Icon name="upload" className="size-5" />
        </span>
        <span className="mt-3 text-sm font-medium">Drop CSV files here or click to browse</span>
        <span className="mt-1 text-xs text-muted">UTF-8 · up to 50 MB each · several at once</span>
      </button>
      <input
        ref={inputRef}
        data-testid="file-input"
        type="file"
        accept=".csv,text/csv"
        multiple
        hidden
        onChange={(e) => {
          add(e.target.files)
          e.target.value = ''
        }}
      />

      {files.length > 0 && (
        <ul className="mt-4 divide-y divide-line rounded-lg border border-line" aria-label="Chosen files">
          {files.map((file) => (
            <li key={fileKey(file)} className="flex items-center gap-3 px-3 py-2">
              <Icon name="file" className="size-4 shrink-0 text-muted" />
              <span className="min-w-0 flex-1 truncate font-mono text-[13px]">{file.name}</span>
              <span className="font-mono text-xs text-faint">{formatBytes(file.size)}</span>
              <button
                type="button"
                className={cx(button.icon, 'size-6')}
                onClick={() => onChange(files.filter((f) => f !== file))}
                aria-label={`Remove ${file.name}`}
              >
                <Icon name="x" className="size-3.5" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </>
  )
}
