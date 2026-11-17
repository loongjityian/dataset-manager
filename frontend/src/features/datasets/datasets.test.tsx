import { screen, waitFor, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { renderApp, setupBackend } from '../../test/renderApp'
import { trackReads } from '../../test/server'

describe('datasets', () => {
  it('cancels dataset deletion without changing the dataset', async () => {
    const backend = setupBackend()
    const sales = backend.addDataset('sales', ['order_id'], [['SO-1']])
    const { user } = renderApp(`/datasets/${sales.id}`)
    await user.click(await screen.findByRole('button', { name: 'Delete dataset' }))
    await user.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Cancel' }))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'sales' })).toBeInTheDocument()
    expect(backend.rows(sales.id)).toEqual([{ _id: 1, order_id: 'SO-1' }])
    expect(backend.requests).toEqual([])
  })

  it('opens the newest dataset and shows its rows', async () => {
    const backend = setupBackend()
    backend.addDataset('customers', ['name'], [['Aisha']])
    const sales = backend.addDataset('sales', ['order_id', 'amount'], [['SO-1', '10']])

    const app = renderApp('/')

    expect(await screen.findByRole('heading', { name: 'sales' })).toBeInTheDocument()
    expect(await screen.findByLabelText('order_id of row 1')).toHaveTextContent('SO-1')
    expect(app.location()).toBe(`/datasets/${sales.id}`)
  })

  it('invites an upload when there are no datasets', async () => {
    setupBackend()
    renderApp('/')

    const heading = await screen.findByRole('heading', { name: 'No datasets' })
    expect(heading).toBeInTheDocument()
    expect(within(heading.parentElement!).getByRole('button', { name: 'Upload CSV' })).toBeEnabled()
  })

  it('says when a dataset does not exist', async () => {
    setupBackend()
    renderApp(`/datasets/${crypto.randomUUID()}`)

    expect(await screen.findByText('Dataset not found')).toBeInTheDocument()
  })

  it('shows the schema tab from the URL', async () => {
    const backend = setupBackend()
    const sales = backend.addDataset('sales', ['order_id', 'amount'])
    renderApp(`/datasets/${sales.id}?tab=schema`)

    expect(await screen.findByRole('tab', { name: /Schema/, selected: true })).toBeInTheDocument()
    expect(screen.getByRole('cell', { name: 'amount' })).toBeInTheDocument()
  })

  it('renames a dataset everywhere it appears', async () => {
    const backend = setupBackend()
    const sales = backend.addDataset('sales', ['order_id'])
    const { user } = renderApp(`/datasets/${sales.id}`)

    await user.click(await screen.findByRole('button', { name: 'Rename sales' }))
    const input = screen.getByLabelText('Dataset name')
    await user.clear(input)
    await user.type(input, '  sales 2026  {Enter}')

    expect(await screen.findByRole('heading', { name: 'sales 2026' })).toBeInTheDocument()
    expect(within(screen.getByRole('navigation', { name: 'Datasets' })).getByText('sales 2026')).toBeInTheDocument()
    expect(backend.requests).toEqual([{ method: 'PATCH', path: `/datasets/${sales.id}`, body: { display_name: 'sales 2026' } }])
  })

  it('cancels a rename with Escape without saving', async () => {
    const backend = setupBackend()
    const sales = backend.addDataset('sales', ['order_id'])
    const { user } = renderApp(`/datasets/${sales.id}`)

    await user.click(await screen.findByRole('button', { name: 'Rename sales' }))
    await user.type(screen.getByLabelText('Dataset name'), 'xyz{Escape}')

    expect(screen.getByRole('heading', { name: 'sales' })).toBeInTheDocument()
    expect(backend.requests).toEqual([])
  })

  it('says a deleted dataset is gone when going Back to it', async () => {
    const backend = setupBackend()
    const sales = backend.addDataset('sales', ['order_id'])
    const app = renderApp(`/datasets/${sales.id}`)
    const { user } = app

    await user.click(await screen.findByRole('tab', { name: /Schema/ }))
    await user.click(screen.getByRole('button', { name: 'Delete dataset' }))
    await user.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Delete dataset' }))
    await screen.findByText('No datasets')
    await app.back()

    expect(await screen.findByText('Dataset not found')).toBeInTheDocument()
  })

  it('deletes a dataset after confirmation and opens the next one', async () => {
    const backend = setupBackend()
    const customers = backend.addDataset('customers', ['name'])
    const sales = backend.addDataset('sales', ['order_id'])
    const app = renderApp(`/datasets/${sales.id}`)
    const { user } = app

    await user.click(await screen.findByRole('button', { name: 'Delete dataset' }))
    const dialog = screen.getByRole('dialog', { name: 'Delete dataset' })
    expect(backend.requests).toEqual([])
    const reads = trackReads()
    await user.click(within(dialog).getByRole('button', { name: 'Delete dataset' }))

    expect(await screen.findByRole('heading', { name: 'customers' })).toBeInTheDocument()
    expect(app.location()).toBe(`/datasets/${customers.id}`)
    expect(screen.getByRole('status')).toHaveTextContent('Deleted “sales”')
    expect(backend.requests).toEqual([{ method: 'DELETE', path: `/datasets/${sales.id}`, body: null }])
    // The list is updated in place, so only the next dataset is fetched.
    await waitFor(() =>
      expect(reads).toEqual([`/datasets/${customers.id}`, `/datasets/${customers.id}/rows?limit=50&offset=0`]),
    )
  })
})
