import { expect, test } from '@playwright/test'

test.describe('Pagination', () => {
  test('should navigate between pages', async ({ page }) => {
    await page.goto('/navigation/pagination')

    const content = page.locator('shades-pagination-page')
    await content.waitFor({ state: 'visible' })

    // Find the basic heading
    await expect(content.getByRole('heading', { name: 'Basic' })).toBeVisible()

    // Find page buttons in the first pagination (basic section)
    // Use text matching since the buttons contain page numbers
    const basicSection = content.getByRole('heading', { name: 'Basic' }).locator('+ div')
    const pagination = basicSection.locator('shade-pagination')

    // Click page 2 button (contains text "2")
    await pagination.getByText('2', { exact: true }).click()

    // The page 2 button should have data-selected
    await expect(pagination.locator('.pagination-item[data-selected]')).toHaveText('2')

    // Click the next arrow (›)
    await pagination.getByText('›').click()

    // Page 3 should be selected
    await expect(pagination.locator('.pagination-item[data-selected]')).toHaveText('3')

    // Click the previous arrow (‹)
    await pagination.getByText('‹').click()

    // Back to page 2
    await expect(pagination.locator('.pagination-item[data-selected]')).toHaveText('2')
  })

  test('should show disabled pagination', async ({ page }) => {
    await page.goto('/navigation/pagination')

    const content = page.locator('shades-pagination-page')
    await content.waitFor({ state: 'visible' })

    // Find the disabled pagination (has data-disabled on the host element)
    const disabledPagination = content.locator('shade-pagination[data-disabled]')
    await expect(disabledPagination).toBeVisible()
  })
})
