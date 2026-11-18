import { expect, test, type Page } from '@playwright/test'

// Runs against the real FastAPI backend, so the multipart upload and CSV parsing are real.
// Tests share one database, so each uses a unique dataset name.

const uniqueName = (base: string) => `${base}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`

async function uploadCsv(page: Page, filename: string, text: string) {
  await page.goto('/')
  await page.getByRole('button', { name: 'Upload CSV' }).first().click()
  const dialog = page.getByRole('dialog', { name: 'Upload CSV files' })
  await dialog.getByTestId('file-input').setInputFiles({ name: filename, mimeType: 'text/csv', buffer: Buffer.from(text) })
  await dialog.getByRole('button', { name: 'Upload' }).click()
  return dialog
}

test('uploads a CSV and browses its rows', async ({ page }) => {
  const name = uniqueName('scores')
  const rows = Array.from({ length: 60 }, (_, i) => `Person ${i + 1},${i === 2 ? '' : (i + 1) * 10}`)
  const dialog = await uploadCsv(page, `${name}.csv`, ['name,score', ...rows].join('\n'))

  await expect(dialog.getByText('60 rows imported')).toBeVisible()
  await dialog.getByRole('button', { name: 'Done' }).click()

  await expect(page.getByRole('heading', { name })).toBeVisible()
  await expect(page.getByRole('navigation', { name: 'Datasets' }).getByText(name)).toBeVisible()
  await expect(page.getByLabel('name of row 1', { exact: true })).toHaveText('Person 1')
  await expect(page.getByLabel('score of row 3', { exact: true })).toHaveText('NULL')

  await page.getByRole('button', { name: 'Next page' }).click()
  await expect(page.getByText('Page 2 of 2')).toBeVisible()
  await expect(page.getByLabel('name of row 51', { exact: true })).toHaveText('Person 51')

  // Editing keeps the cell's size: long text scrolls inside it instead of widening the column.
  const cell = page.getByLabel('name of row 51', { exact: true })
  const widthBefore = (await cell.boundingBox())?.width
  await cell.dblclick()
  const editor = page.getByRole('textbox', { name: 'name of row 51' })
  await editor.fill('A much longer value than this column was sized for')
  expect((await editor.locator('xpath=..').boundingBox())?.width).toBe(widthBefore)
  await editor.press('Escape')

  await page.getByRole('tab', { name: /Schema/ }).click()
  // Real type inference only reaches the UI here; the fake backend in unit tests doesn't infer.
  const scoreRow = page.getByRole('row').filter({ has: page.getByRole('cell', { name: 'score', exact: true }) })
  await expect(scoreRow.getByRole('cell', { name: 'number', exact: true })).toBeVisible()
})

test("shows the backend's error for an invalid CSV and creates nothing", async ({ page }) => {
  const name = uniqueName('broken')
  const dialog = await uploadCsv(page, `${name}.csv`, 'name,score\nAda,90,extra\n')

  await expect(dialog.getByText('1 failed')).toBeVisible()
  await expect(dialog.getByText(/Line 2 has 3 values, but the header has 2 columns/)).toBeVisible()
  await expect(dialog.getByRole('button', { name: 'Retry failed' })).toBeVisible()

  await dialog.getByRole('button', { name: 'Done' }).click()
  await expect(page.getByRole('navigation', { name: 'Datasets' }).getByText(name)).toHaveCount(0)
})

test('adds across a page boundary, saves, reloads and deletes back to the previous page', async ({ page }) => {
  const name = uniqueName('editable')
  const dialog = await uploadCsv(page, `${name}.csv`, ['name,score', ...Array.from({ length: 50 }, (_, i) => `Person ${i + 1},10`)].join('\n'))
  await expect(dialog.getByText('50 rows imported')).toBeVisible()
  await dialog.getByRole('button', { name: 'Done' }).click()
  await page.getByRole('button', { name: 'Add row' }).click()
  const editor = page.getByRole('textbox', { name: 'name of row 51' })
  await expect(editor).toBeFocused()
  await expect(page).toHaveURL(/\?page=2$/)
  await editor.fill('New person')
  await editor.press('Enter')
  await expect(page.getByLabel('name of row 51', { exact: true })).toHaveText('New person')
  await page.reload()
  await expect(page.getByLabel('name of row 51', { exact: true })).toHaveText('New person')
  await expect(page.getByLabel('score of row 51', { exact: true })).toHaveText('NULL')
  await page.getByRole('button', { name: 'Delete row 51' }).click()
  await expect(page.getByText('Page 1 of 1')).toBeVisible()
  await page.reload()
  await expect(page.getByRole('tab', { name: /Rows/ })).toContainText('50')
})
