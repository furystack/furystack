import { expect, test } from '@playwright/test'

test.describe('Pagination', () => {
  test('navigate between pages and verify disabled state', async ({ page }) => {
    await page.goto('/navigation/pagination')

    const content = page.locator('shades-pagination-page')
    await content.waitFor({ state: 'visible' })

    await expect(content.getByRole('heading', { name: 'Basic' })).toBeVisible()

    const basicSection = content.getByRole('heading', { name: 'Basic' }).locator('+ div')
    const pagination = basicSection.locator('shade-pagination')

    // Navigate to page 2
    await pagination.getByText('2', { exact: true }).click()
    await expect(pagination.locator('.pagination-item[data-selected]')).toHaveText('2')

    // Next arrow to page 3
    await pagination.getByText('›').click()
    await expect(pagination.locator('.pagination-item[data-selected]')).toHaveText('3')

    // Previous arrow back to page 2
    await pagination.getByText('‹').click()
    await expect(pagination.locator('.pagination-item[data-selected]')).toHaveText('2')

    // Verify disabled pagination exists
    const disabledPagination = content.locator('shade-pagination[data-disabled]')
    await expect(disabledPagination).toBeVisible()
  })
})
