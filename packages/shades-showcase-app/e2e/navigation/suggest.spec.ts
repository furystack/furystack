import { expect, test } from '@playwright/test'

test.describe('Suggest', () => {
  test('should render the suggest component', async ({ page }) => {
    await page.goto('/navigation/suggest')

    const content = page.locator('shades-suggest-page')
    await content.waitFor({ state: 'visible' })

    await expect(content.locator('shade-page-header')).toBeVisible()

    // The ">" prefix icon should be visible
    await expect(content.locator('.term-icon')).toBeVisible()
  })

  test('should show suggestions when typing', async ({ page, isMobile }) => {
    test.skip(isMobile, 'Keyboard interaction not supported on mobile')
    await page.goto('/navigation/suggest')

    const content = page.locator('shades-suggest-page')
    await content.waitFor({ state: 'visible' })

    // Click the ">" icon to open the suggest
    await content.locator('.term-icon').click()

    // The input should be visible and focused
    const input = content.locator('shade-suggest input')
    await expect(input).toBeFocused()

    // Type to trigger keyup events and async suggestion loading
    await input.pressSequentially('Entry', { delay: 50 })

    // Suggestions should appear (1s async delay from the page + network)
    await expect(content.getByText('First Entry')).toBeVisible({ timeout: 10000 })
  })
})
