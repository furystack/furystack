import { expect, test } from '@playwright/test'

test.describe('FAB', () => {
  test('should render the floating action button', async ({ page }) => {
    await page.goto('/surfaces/fab')

    const content = page.locator('shades-fab-page')
    await content.waitFor({ state: 'visible' })

    // Page header should be visible
    await expect(content.locator('shade-page-header')).toBeVisible()

    // FAB button should be visible with thumbs up emoji
    const fab = page.getByRole('button', { name: '👍' })
    await expect(fab).toBeVisible()
  })
})
