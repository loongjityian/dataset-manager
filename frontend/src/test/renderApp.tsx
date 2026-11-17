import { render } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createMemoryRouter } from 'react-router'
import { RouterProvider } from 'react-router/dom'
import { AppProviders } from '../app/AppProviders'
import { createQueryClient } from '../app/queryClient'
import { routes } from '../app/routes'
import { createFakeBackend } from './fakeBackend'
import { server } from './server'

/** A fresh fake backend wired into MSW for one test. */
export function setupBackend() {
  const backend = createFakeBackend()
  server.use(...backend.handlers)
  return backend
}

/** Renders the whole app at `path` with its real routes, providers and API client. */
export function renderApp(path = '/') {
  // The app's own cache settings, so tests see the same fetching; only retries are off.
  const queryClient = createQueryClient()
  const defaults = queryClient.getDefaultOptions()
  queryClient.setDefaultOptions({ ...defaults, queries: { ...defaults.queries, retry: false }, mutations: { retry: false } })
  const router = createMemoryRouter(routes, { initialEntries: [path] })
  const user = userEvent.setup()
  render(
    <AppProviders queryClient={queryClient}>
      <RouterProvider router={router} />
    </AppProviders>,
  )
  return {
    user,
    /** The current path plus query string. */
    location: () => router.state.location.pathname + router.state.location.search,
    back: () => router.navigate(-1),
  }
}
