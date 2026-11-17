import { useRouteError } from 'react-router'
import { Notice } from '../components/Notice'
import { button } from '../lib/styles'

/** Shown when a page crashes while rendering. */
export function RouteError() {
  const error = useRouteError()
  console.error(error)

  return (
    <Notice icon="alert" title="Something went wrong" body="This page hit an unexpected error. Reloading usually fixes it.">
      <button type="button" className={button.secondary} onClick={() => window.location.reload()}>
        Reload
      </button>
    </Notice>
  )
}
