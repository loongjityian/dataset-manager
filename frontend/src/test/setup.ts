import '@testing-library/jest-dom/vitest'
import { cleanup, configure } from '@testing-library/react'
import { afterAll, afterEach, beforeAll } from 'vitest'
import { server } from './server'

// jsdom has no <dialog> methods yet; open and close it by its attribute.
HTMLDialogElement.prototype.showModal ??= function (this: HTMLDialogElement) {
  this.setAttribute('open', '')
}
HTMLDialogElement.prototype.close ??= function (this: HTMLDialogElement) {
  this.removeAttribute('open')
  this.dispatchEvent(new Event('close'))
}

// The default 1s is too tight when test files run in parallel.
configure({ asyncUtilTimeout: 3000 })

// Fail on any request a test didn't expect.
beforeAll(() => server.listen({ onUnhandledFrame: 'error' }))
afterEach(() => {
  cleanup()
  server.resetHandlers()
  server.events.removeAllListeners()
})
afterAll(() => server.close())
