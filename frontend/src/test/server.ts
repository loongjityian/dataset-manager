import { setupServer } from 'msw/node'

/** Intercepts fetch in tests. Each test adds its own handlers with `server.use`. */
export const server = setupServer()

/** Records the path (after /api) of every GET from now on, to check what a change refetches. */
export function trackReads(): string[] {
  const reads: string[] = []
  server.events.on('request:start', ({ request }) => {
    if (request.method !== 'GET') return
    const url = new URL(request.url)
    reads.push(url.pathname.replace(/^\/api/, '') + url.search)
  })
  return reads
}
