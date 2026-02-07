import { expect, test } from '@playwright/test'

test.describe('Inputs', () => {
  test('should render all input variants', async ({ page }) => {
    await page.goto('/inputs-and-forms/inputs')

    const content = page.locator('inputs-page')
    await content.waitFor({ state: 'visible' })

    // Page header should be visible
    await expect(content.locator('shade-page-header')).toBeVisible()

    // Should have three variant columns
    await expect(content.locator('h3', { hasText: 'default' })).toBeVisible()
    await expect(content.locator('h3', { hasText: 'outlined' })).toBeVisible()
    await expect(content.locator('h3', { hasText: 'contained' })).toBeVisible()
  })

  test('should render autocomplete components with suggestions', async ({ page }) => {
    await page.goto('/inputs-and-forms/inputs')

    const content = page.locator('inputs-page')
    await content.waitFor({ state: 'visible' })

    // Should have 3 autocomplete components (one per variant column)
    const autocompletes = content.locator('shade-autocomplete')
    await expect(autocompletes).toHaveCount(3)

    // Each autocomplete should have an input and a datalist with fruit suggestions
    const firstInput = autocompletes.first().locator('input')
    await expect(firstInput).toBeVisible()
  })
})
