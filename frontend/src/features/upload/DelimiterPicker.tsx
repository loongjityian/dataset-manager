import type { Delimiter } from '../../api/types'
import { cx } from '../../lib/styles'

const OPTIONS: { value: Delimiter; label: string }[] = [
  { value: ',', label: 'Comma' },
  { value: ';', label: 'Semicolon' },
]

export function DelimiterPicker({ value, onChange }: { value: Delimiter; onChange: (value: Delimiter) => void }) {
  return (
    <fieldset>
      <legend className="text-sm font-medium">Delimiter</legend>
      <div className="mt-2 inline-flex rounded-md border border-line-strong bg-paper p-0.5">
        {OPTIONS.map((option) => (
          <label
            key={option.value}
            className={cx(
              'cursor-pointer rounded px-3 py-1 text-sm transition-colors has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-accent',
              value === option.value ? 'bg-surface font-medium text-ink shadow-sm' : 'text-muted hover:text-ink',
            )}
          >
            <input
              type="radio"
              name="delimiter"
              value={option.value}
              checked={value === option.value}
              onChange={() => onChange(option.value)}
              className="sr-only"
            />
            {option.label} <span className="font-mono text-faint">{option.value}</span>
          </label>
        ))}
      </div>
      <p className="mt-1.5 text-xs text-muted">Files saved by Excel in some regions use semicolons.</p>
    </fieldset>
  )
}
