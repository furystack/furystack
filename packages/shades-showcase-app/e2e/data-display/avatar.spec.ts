import { expect, test } from '@playwright/test'

test.describe('Avatar', () => {
  test('should render avatars with different states', async ({ page }) => {
    await page.goto('/data-display/avatar')

    const pageHeader = page.locator('shade-page-header')
    await expect(pageHeader).toBeVisible()
    await expect(pageHeader).toContainText('Avatar')

    // All three avatars should be present on the page content (excludes the AppBar theme avatar)
    const avatars = page.locator('shades-avatar-page shade-avatar')
    await expect(avatars).toHaveCount(3)

    // The fallback avatar should show the fallback content
    await expect(page.getByText('👽')).toBeVisible()
  })
})
