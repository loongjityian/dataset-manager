import { errorMessage } from '../api/client'
import { button } from '../lib/styles'
import { Notice } from './Notice'

/** A failed load, with a button to try again. */
export function LoadError({ title, error, onRetry }: { title: string; error: unknown; onRetry: () => void }) {
  return (
    <Notice icon="alert" title={title} body={errorMessage(error)}>
      <button type="button" className={button.secondary} onClick={onRetry}>
        Try again
      </button>
    </Notice>
  )
}
