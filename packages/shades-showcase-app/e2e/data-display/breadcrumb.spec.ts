import { expect, test } from '@playwright/test'

test.describe('Breadcrumb', () => {
  test('should render breadcrumb examples', async ({ page }) => {
    await page.goto('/data-display/breadcrumb')

    const content = page.locator('shades-breadcrumb-page')
    await content.waitFor({ state: 'visible' })

    // Check section headings
    await expect(content.locator('h3', { hasText: 'Basic Breadcrumb' })).toBeVisible()
    await expect(content.locator('h3', { hasText: 'Multiple Items' })).toBeVisible()
    await expect(content.locator('h3', { hasText: 'Custom Separator' })).toBeVisible()
    await expect(content.locator('h3', { hasText: 'Custom Rendering' })).toBeVisible()

    // Custom separator section should use → character
    await expect(content.getByText('→').first()).toBeVisible()
  })
})
