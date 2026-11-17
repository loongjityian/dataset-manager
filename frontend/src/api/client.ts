/** Requests go to the same origin; the dev server and nginx proxy `/api` to the backend. */
const API_BASE = '/api'

/** An API failure carrying the backend's `detail` message and the HTTP status (0 when unreachable). */
export class ApiError extends Error {
  status: number

  constructor(status: number, message: string) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

type RequestOptions = {
  method?: 'GET' | 'POST' | 'PATCH' | 'DELETE'
  /** Sent as JSON. */
  json?: unknown
  /** Sent as multipart form data. */
  form?: FormData
  signal?: AbortSignal
}

export async function request<T>(path: string, { method = 'GET', json, form, signal }: RequestOptions = {}): Promise<T> {
  const init: RequestInit = { method, signal }
  if (json !== undefined) {
    init.headers = { 'Content-Type': 'application/json' }
    init.body = JSON.stringify(json)
  } else if (form) {
    init.body = form
  }

  let response: Response
  try {
    // An absolute URL, because Node's fetch in tests has no page to resolve a relative one against.
    response = await fetch(new URL(API_BASE + path, window.location.origin), init)
  } catch (error) {
    if (signal?.aborted) throw error
    throw new ApiError(0, "Can't reach the server. Check that it's running and try again.")
  }

  const body: unknown = await response.json().catch(() => null)
  if (!response.ok) throw new ApiError(response.status, detailMessage(body) ?? `Request failed (${response.status}).`)
  return body as T
}

/** Reads FastAPI's `{detail}`: a string from the app, or a list of validation errors. */
function detailMessage(body: unknown): string | null {
  if (typeof body !== 'object' || body === null || !('detail' in body)) return null
  const { detail } = body
  if (typeof detail === 'string') return detail
  if (Array.isArray(detail)) {
    const messages = detail.map((item: unknown) =>
      typeof item === 'object' && item !== null && 'msg' in item ? String(item.msg) : null,
    )
    return messages.filter(Boolean).join('. ') || null
  }
  return null
}

export function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'Something went wrong. Try again.'
}

/** Unknown and malformed IDs both mean the thing doesn't exist from the user's point of view. */
export function isNotFound(error: unknown): boolean {
  return error instanceof ApiError && (error.status === 404 || error.status === 422)
}
