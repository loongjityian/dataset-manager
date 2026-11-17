import { screen, within } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ApiError } from '../../api/client'
import { uploadDatasets } from '../../api/datasets'
import type { UploadResult } from '../../api/types'
import { renderApp, setupBackend } from '../../test/renderApp'

// jsdom can't send multipart bodies through Node's fetch, so upload is mocked at the
// API module. The real request is covered by the Playwright test in e2e/.
vi.mock('../../api/datasets', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../../api/datasets')>()),
  uploadDatasets: vi.fn(),
}))

const upload = vi.mocked(uploadDatasets)

const csv = (name: string, text = 'a\n1\n') => new File([text], name, { type: 'text/csv' })

async function openUploadDialog() {
  const app = renderApp('/')
  await app.user.click((await screen.findAllByRole('button', { name: 'Upload CSV' }))[0])
  return { ...app, dialog: screen.getByRole('dialog', { name: 'Upload CSV files' }) }
}

beforeEach(() => {
  upload.mockReset()
})

describe('choosing files', () => {
  it('lists chosen files, ignores duplicates and lets you remove one', async () => {
    setupBackend()
    const { user, dialog } = await openUploadDialog()
    expect(within(dialog).getByRole('button', { name: 'Upload' })).toBeDisabled()

    const orders = csv('orders.csv')
    await user.upload(screen.getByTestId('file-input'), [orders, csv('customers.csv')])
    await user.upload(screen.getByTestId('file-input'), orders)

    const chosen = within(dialog).getByRole('list', { name: 'Chosen files' })
    expect(within(chosen).getAllByRole('listitem')).toHaveLength(2)
    expect(within(dialog).getByRole('button', { name: 'Upload 2 files' })).toBeEnabled()

    await user.click(within(dialog).getByRole('button', { name: 'Remove orders.csv' }))
    expect(within(chosen).getAllByRole('listitem')).toHaveLength(1)
    expect(within(dialog).getByRole('button', { name: 'Upload' })).toBeEnabled()
  })
})

describe('uploading', () => {
  it('shows progress while the upload runs', async () => {
    setupBackend()
    let finish: (results: UploadResult[]) => void = () => {}
    upload.mockReturnValue(new Promise((resolve) => (finish = resolve)))
    const { user, dialog } = await openUploadDialog()

    await user.upload(screen.getByTestId('file-input'), csv('orders.csv'))
    await user.click(within(dialog).getByRole('button', { name: 'Upload' }))

    expect(within(dialog).getByRole('button', { name: 'Uploading…' })).toBeDisabled()
    finish([{ filename: 'orders.csv', dataset: null, error: 'File is empty.' }])
    expect(await within(dialog).findByText('File is empty.')).toBeInTheDocument()
  })

  it('reports each file, sends the chosen delimiter and opens the new dataset', async () => {
    const backend = setupBackend()
    upload.mockImplementation(async () => {
      const orders = backend.addDataset('orders', ['id', 'item'], [['1', 'Lamp'], ['2', 'Desk']])
      return [
        { filename: 'orders.csv', dataset: orders, error: null },
        { filename: 'broken.csv', dataset: null, error: 'Line 2 has 3 values but the header has 2.' },
      ]
    })
    const app = await openUploadDialog()
    const { user, dialog } = app

    const files = [csv('orders.csv'), csv('broken.csv')]
    await user.upload(screen.getByTestId('file-input'), files)
    await user.click(within(dialog).getByRole('radio', { name: /Semicolon/ }))
    await user.click(within(dialog).getByRole('button', { name: 'Upload 2 files' }))

    const results = await within(dialog).findByRole('list', { name: 'Upload results' })
    expect(within(dialog).getByText('1 added · 1 failed')).toBeInTheDocument()
    expect(within(results).getByText('2 rows imported')).toBeInTheDocument()
    expect(within(results).getByText('Line 2 has 3 values but the header has 2.')).toBeInTheDocument()
    expect(upload).toHaveBeenCalledWith(files, ';')

    // The new dataset opens behind the dialog and joins the list.
    expect(await screen.findByRole('heading', { name: 'orders', hidden: true })).toBeInTheDocument()
    expect(app.location()).toMatch(/^\/datasets\//)
    await user.click(within(dialog).getByRole('button', { name: 'Done' }))
    expect(within(screen.getByRole('navigation', { name: 'Datasets' })).getByText('orders')).toBeInTheDocument()
  })

  it('keeps only the failed files when retrying, even when names repeat', async () => {
    setupBackend()
    upload.mockResolvedValue([
      { filename: 'same.csv', dataset: { id: crypto.randomUUID(), display_name: 'same', created_at: '2026-11-01T00:00:00Z', row_count: 1 }, error: null },
      { filename: 'same.csv', dataset: null, error: 'File is empty.' },
    ])
    const { user, dialog } = await openUploadDialog()

    const failing = csv('same.csv', 'a\n')
    await user.upload(screen.getByTestId('file-input'), [csv('same.csv'), failing])
    await user.click(within(dialog).getByRole('button', { name: 'Upload 2 files' }))
    await user.click(await within(dialog).findByRole('button', { name: 'Retry failed' }))
    await user.click(within(dialog).getByRole('button', { name: 'Upload' }))

    expect(upload).toHaveBeenLastCalledWith([failing], ',')
  })

  it('shows a request failure and keeps the files so you can try again', async () => {
    setupBackend()
    upload.mockRejectedValue(new ApiError(0, "Can't reach the server. Check that it's running and try again."))
    const { user, dialog } = await openUploadDialog()

    await user.upload(screen.getByTestId('file-input'), csv('orders.csv'))
    await user.click(within(dialog).getByRole('button', { name: 'Upload' }))

    expect(await within(dialog).findByRole('alert')).toHaveTextContent("Can't reach the server")
    expect(within(dialog).getByRole('list', { name: 'Chosen files' })).toHaveTextContent('orders.csv')
    expect(within(dialog).getByRole('button', { name: 'Upload' })).toBeEnabled()
  })
})
