import { expect, test } from '@playwright/test'

test.describe('Inputs', () => {
  test('render all input variants and suggest components', async ({ page }) => {
    await page.goto('/inputs-and-forms/inputs')

    const content = page.locator('inputs-page')
    await content.waitFor({ state: 'visible' })

    await expect(content.locator('shade-page-header')).toBeVisible()

    // Verify variant columns
    await expect(content.locator('h6', { hasText: 'default' })).toBeVisible()
    await expect(content.locator('h6', { hasText: 'outlined' })).toBeVisible()
    await expect(content.locator('h6', { hasText: 'contained' })).toBeVisible()

    // Verify suggest components (one per variant column)
    const suggests = content.locator('shade-suggest')
    await expect(suggests).toHaveCount(3)
    const firstInput = suggests.first().locator('input')
    await expect(firstInput).toBeVisible()
  })
})
