import { expect, test } from '@playwright/test'

test.describe('Inputs', () => {
  test('render all input variants and autocomplete components', async ({ page }) => {
    await page.goto('/inputs-and-forms/inputs')

    const content = page.locator('inputs-page')
    await content.waitFor({ state: 'visible' })

    await expect(content.locator('shade-page-header')).toBeVisible()

    // Verify variant columns
    await expect(content.locator('h3', { hasText: 'default' })).toBeVisible()
    await expect(content.locator('h3', { hasText: 'outlined' })).toBeVisible()
    await expect(content.locator('h3', { hasText: 'contained' })).toBeVisible()

    // Verify autocomplete components
    const autocompletes = content.locator('shade-autocomplete')
    await expect(autocompletes).toHaveCount(3)
    const firstInput = autocompletes.first().locator('input')
    await expect(firstInput).toBeVisible()
  })
})
