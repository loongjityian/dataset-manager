import { screen, waitFor } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { describe, expect, it } from 'vitest'
import { numberedRows } from '../../test/fakeBackend'
import { renderApp, setupBackend } from '../../test/renderApp'
import { server } from '../../test/server'

function setupSales(rows: (string | null)[][] = [['SO-1', '10'], ['SO-2', null]]) {
  const backend = setupBackend()
  const sales = backend.addDataset('sales', ['order_id', 'amount'], rows)
  return { backend, sales }
}

describe('editing a cell', () => {
  it.each(['enter', 'outside'])('saves only the changed column with %s', async (action) => {
    const { backend, sales } = setupSales()
    const { user } = renderApp(`/datasets/${sales.id}`)
    await user.dblClick(await screen.findByLabelText('amount of row 1'))
    await user.clear(screen.getByRole('textbox', { name: 'amount of row 1' }))
    await user.type(screen.getByRole('textbox', { name: 'amount of row 1' }), '25')
    if (action === 'enter') await user.keyboard('{Enter}')
    else await user.click(document.body)
    await waitFor(() => expect(screen.getByLabelText('amount of row 1')).toHaveTextContent('25'))
    expect(backend.requests).toEqual([{ method: 'PATCH', path: `/datasets/${sales.id}/rows/1`, body: { amount: '25' } }])
  })

  it.each(['enter', 'outside'])('closes an unchanged edit with %s without saving', async (action) => {
    const { backend, sales } = setupSales()
    const { user } = renderApp(`/datasets/${sales.id}`)
    await user.dblClick(await screen.findByLabelText('amount of row 1'))
    if (action === 'enter') await user.keyboard('{Enter}')
    else await user.click(document.body)
    expect(screen.queryByRole('textbox', { name: 'amount of row 1' })).not.toBeInTheDocument()
    expect(backend.requests).toEqual([])
  })

  it('stores an emptied cell as NULL', async () => {
    const { backend, sales } = setupSales()
    const { user } = renderApp(`/datasets/${sales.id}`)

    await user.dblClick(await screen.findByLabelText('amount of row 1'))
    await user.clear(screen.getByRole('textbox', { name: 'amount of row 1' }))
    await user.keyboard('{Enter}')

    await waitFor(() => expect(screen.getByLabelText('amount of row 1')).toHaveTextContent('NULL'))
    expect(backend.requests[0].body).toEqual({ amount: null })
  })

  it('keeps line breaks in a value', async () => {
    const { backend, sales } = setupSales([['SO-1', 'first\nsecond']])
    const { user } = renderApp(`/datasets/${sales.id}`)

    await user.dblClick(await screen.findByLabelText('amount of row 1'))
    await user.type(screen.getByRole('textbox', { name: 'amount of row 1' }), '!{Enter}')

    await waitFor(() => expect(backend.requests).toHaveLength(1))
    expect(backend.requests[0].body).toEqual({ amount: 'first\nsecond!' })
  })

  it('cancels with Escape without saving', async () => {
    const { backend, sales } = setupSales()
    const { user } = renderApp(`/datasets/${sales.id}`)

    await user.dblClick(await screen.findByLabelText('amount of row 1'))
    await user.type(screen.getByRole('textbox', { name: 'amount of row 1' }), '999{Escape}')

    expect(screen.getByLabelText('amount of row 1')).toHaveTextContent('10')
    expect(backend.requests).toEqual([])
  })

  it('keeps the editor open and shows the server error when saving fails', async () => {
    const { sales } = setupSales()
    server.use(
      http.patch('/api/datasets/:id/rows/:rowId', () =>
        HttpResponse.json({ detail: [{ msg: 'Input should be a valid string' }] }, { status: 422 }),
      ),
    )
    const { user } = renderApp(`/datasets/${sales.id}`)

    await user.dblClick(await screen.findByLabelText('amount of row 1'))
    await user.type(screen.getByRole('textbox', { name: 'amount of row 1' }), '1{Enter}')

    expect(await screen.findByRole('alert')).toHaveTextContent('Input should be a valid string')
    expect(screen.getByRole('textbox', { name: 'amount of row 1' })).toHaveValue('101')
  })
})

describe('moving between cells', () => {
  it('keeps a newly opened cell open when an earlier save finishes', async () => {
    const { sales } = setupSales()
    let finish = () => {}
    server.use(
      http.patch('/api/datasets/:id/rows/:rowId', async () => {
        await new Promise<void>((resolve) => (finish = resolve))
        return HttpResponse.json({ _id: 1, order_id: 'SO-1', amount: '101' })
      }),
    )
    const { user } = renderApp(`/datasets/${sales.id}`)

    await user.dblClick(await screen.findByLabelText('amount of row 1'))
    await user.type(screen.getByRole('textbox', { name: 'amount of row 1' }), '1{Enter}')
    await user.dblClick(screen.getByLabelText('amount of row 2'))
    await user.type(screen.getByRole('textbox', { name: 'amount of row 2' }), '5')
    finish()

    await waitFor(() => expect(screen.getByLabelText('amount of row 1')).toHaveTextContent('101'))
    expect(screen.getByRole('textbox', { name: 'amount of row 2' })).toHaveValue('5')
  })

  it('saves on Tab and opens the next cell; Shift+Tab goes back', async () => {
    const { backend, sales } = setupSales()
    const { user } = renderApp(`/datasets/${sales.id}`)

    await user.dblClick(await screen.findByLabelText('order_id of row 1'))
    await user.clear(screen.getByRole('textbox', { name: 'order_id of row 1' }))
    await user.type(screen.getByRole('textbox', { name: 'order_id of row 1' }), 'SO-9{Tab}')

    expect(await screen.findByRole('textbox', { name: 'amount of row 1' })).toHaveFocus()
    expect(backend.requests).toEqual([{ method: 'PATCH', path: `/datasets/${sales.id}/rows/1`, body: { order_id: 'SO-9' } }])

    await user.keyboard('{Shift>}{Tab}{/Shift}')
    expect(await screen.findByRole('textbox', { name: 'order_id of row 1' })).toHaveValue('SO-9')

    // Tab past the last column stops editing; unchanged cells send nothing.
    await user.keyboard('{Tab}{Tab}')
    await waitFor(() => expect(screen.queryByRole('textbox', { name: /of row 1$/ })).not.toBeInTheDocument())
    expect(backend.requests).toHaveLength(1)
  })
})

describe('adding a row', () => {
  it('inserts every column as NULL and opens its first cell for editing', async () => {
    const { backend, sales } = setupSales(numberedRows(50))
    const app = renderApp(`/datasets/${sales.id}`)
    const { user } = app

    await user.click(await screen.findByRole('button', { name: 'Add row' }))

    const firstCell = await screen.findByRole('textbox', { name: 'order_id of row 51' })
    expect(firstCell).toHaveFocus()
    expect(app.location()).toBe(`/datasets/${sales.id}?page=2`)
    await user.type(firstCell, 'SO-NEW{Enter}')

    await waitFor(() => expect(screen.getByLabelText('order_id of row 51')).toHaveTextContent('SO-NEW'))
    expect(screen.getByLabelText('amount of row 51')).toHaveTextContent('NULL')
    expect(backend.requests).toEqual([
      { method: 'POST', path: `/datasets/${sales.id}/rows`, body: {} },
      { method: 'PATCH', path: `/datasets/${sales.id}/rows/51`, body: { order_id: 'SO-NEW' } },
    ])
  })
})

describe('keeping pages in sync', () => {
  it('shows a new row on the current page when it has room', async () => {
    const { sales } = setupSales()
    const { user } = renderApp(`/datasets/${sales.id}`)

    await user.click(await screen.findByRole('button', { name: 'Add row' }))

    expect(await screen.findByRole('textbox', { name: 'order_id of row 3' })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: /Rows/ })).toHaveTextContent('3')
  })

  it('moves the next page’s first row up after a delete', async () => {
    const { sales } = setupSales(numberedRows(60))
    const { user } = renderApp(`/datasets/${sales.id}`)

    await user.click(await screen.findByRole('button', { name: 'Delete row 1' }))

    expect(await screen.findByLabelText('order_id of row 51')).toBeInTheDocument()
  })
})

describe('deleting a row', () => {
  it('keeps the row and count when deletion fails', async () => {
    const { sales } = setupSales()
    server.use(http.delete('/api/datasets/:id/rows/:rowId', () => HttpResponse.json({ detail: 'Could not delete row' }, { status: 500 })))
    const { user } = renderApp(`/datasets/${sales.id}`)
    await user.click(await screen.findByRole('button', { name: 'Delete row 1' }))
    expect(await screen.findByText('Could not delete row')).toBeInTheDocument()
    expect(screen.getByLabelText('order_id of row 1')).toHaveTextContent('SO-1')
    expect(screen.getByRole('tab', { name: /Rows/ })).toHaveTextContent('2')
  })

  it('keeps page 1 after deleting the only row and can add again', async () => {
    const { sales } = setupSales([['SO-1', '10']])
    const app = renderApp(`/datasets/${sales.id}`)
    await app.user.click(await screen.findByRole('button', { name: 'Delete row 1' }))
    expect(await screen.findByText('No rows yet')).toBeInTheDocument()
    expect(app.location()).toBe(`/datasets/${sales.id}`)
    await app.user.click(screen.getAllByRole('button', { name: 'Add row' })[0])
    expect(await screen.findByRole('textbox', { name: /order_id of row/ })).toHaveFocus()
    expect(app.location()).toBe(`/datasets/${sales.id}`)
  })

  it('deletes straight away without asking', async () => {
    const { backend, sales } = setupSales()
    const { user } = renderApp(`/datasets/${sales.id}`)

    await user.click(await screen.findByRole('button', { name: 'Delete row 1' }))

    expect(backend.requests).toEqual([{ method: 'DELETE', path: `/datasets/${sales.id}/rows/1`, body: null }])
    await waitFor(() => expect(screen.queryByLabelText('order_id of row 1')).not.toBeInTheDocument())
    expect(backend.rows(sales.id).map((r) => r._id)).toEqual([2])
    expect(screen.getByRole('tab', { name: /Rows/ })).toHaveTextContent('1')
  })

  it('moves back a page after deleting the last row on the last page', async () => {
    const { sales } = setupSales(numberedRows(51))
    const app = renderApp(`/datasets/${sales.id}?page=2`)
    const { user } = app

    await user.click(await screen.findByRole('button', { name: 'Delete row 51' }))

    expect(await screen.findByLabelText('order_id of row 50')).toBeInTheDocument()
    expect(app.location()).toBe(`/datasets/${sales.id}`)
  })
})

describe('paging', () => {
  it('pages through rows and keeps the page in the URL', async () => {
    const { sales } = setupSales(numberedRows(120))
    const app = renderApp(`/datasets/${sales.id}`)
    const { user } = app

    expect(await screen.findByText('Page 1 of 3')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Next page' }))

    expect(await screen.findByLabelText('order_id of row 51')).toHaveTextContent('SO-51')
    expect(app.location()).toBe(`/datasets/${sales.id}?page=2`)

    await user.selectOptions(screen.getByLabelText('Rows per page'), '100')
    expect(await screen.findByText('Page 1 of 2')).toBeInTheDocument()
    expect(app.location()).toBe(`/datasets/${sales.id}?size=100`)
  })

  it('shows an empty dataset with a way to add the first row', async () => {
    const { sales } = setupSales([])
    renderApp(`/datasets/${sales.id}`)

    expect(await screen.findByText('No rows yet')).toBeInTheDocument()
    expect(screen.queryByRole('navigation', { name: 'Pagination' })).not.toBeInTheDocument()
  })
})
