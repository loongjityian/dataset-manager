import { errorMessage } from '../api/client'

/** An inline error message for forms and dialogs; renders nothing without an error. */
export function ErrorText({ error, className = '' }: { error: unknown; className?: string }) {
  if (!error) return null
  return (
    <p role="alert" className={`rounded-md bg-danger-soft px-3 py-2 text-sm text-danger ${className}`}>
      {errorMessage(error)}
    </p>
  )
}
