import { http, HttpResponse } from 'msw'
import { describe, expect, it } from 'vitest'
import { server } from '../test/server'
import { ApiError, isNotFound, request } from './client'

const failure = (promise: Promise<unknown>) => promise.then(() => expect.fail('expected the request to fail'), (e: unknown) => e)

describe('request', () => {
  it('sends JSON under /api and returns the parsed body', async () => {
    server.use(http.post('/api/things', async ({ request }) => HttpResponse.json({ echo: await request.json() })))

    await expect(request('/things', { method: 'POST', json: { a: 1 } })).resolves.toEqual({ echo: { a: 1 } })
  })

  it("uses the backend's detail message", async () => {
    server.use(http.get('/api/things', () => HttpResponse.json({ detail: 'Dataset not found' }, { status: 404 })))

    const error = await failure(request('/things'))
    expect(error).toBeInstanceOf(ApiError)
    expect(error).toMatchObject({ status: 404, message: 'Dataset not found' })
    expect(isNotFound(error)).toBe(true)
  })

  it('joins validation error messages', async () => {
    server.use(
      http.get('/api/things', () =>
        HttpResponse.json({ detail: [{ msg: 'Field required' }, { msg: 'Input should be a valid integer' }] }, { status: 422 }),
      ),
    )

    await expect(failure(request('/things'))).resolves.toMatchObject({
      status: 422,
      message: 'Field required. Input should be a valid integer',
    })
  })

  it('falls back to the status when the body has no detail', async () => {
    server.use(http.get('/api/things', () => new HttpResponse('Bad gateway', { status: 502 })))

    await expect(failure(request('/things'))).resolves.toMatchObject({ status: 502, message: 'Request failed (502).' })
  })

  it('explains when the server is unreachable', async () => {
    server.use(http.get('/api/things', () => HttpResponse.error()))

    await expect(failure(request('/things'))).resolves.toMatchObject({ status: 0, message: expect.stringContaining("Can't reach the server") })
  })
})
