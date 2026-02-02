import { expect, test } from '@playwright/test'

// This test assumes the app is running at http://localhost:8080 and theme buttons are visible on the main page

test.describe('Theme Button Toggle', () => {
  test('should toggle between dark and light themes', async ({ page }) => {
    await page.goto('http://localhost:8080')

    // Find the moon and sun buttons
    const moonButton = page.locator('button:has-text("🌜")')
    const sunButton = page.locator('button:has-text("☀️")')

    // Click moon button and check for dark theme
    await moonButton.click()
    // Check the background color of the main app container
    const appContainer = page.locator('shade-page-layout')
    const darkBg = await appContainer.evaluate((el) => getComputedStyle(el).backgroundColor)
    expect(darkBg).toBe('rgb(48, 48, 48)')

    // Click sun button and check for light theme
    await sunButton.click()
    const lightBg = await appContainer.evaluate((el) => getComputedStyle(el).backgroundColor)
    expect(lightBg).toBe('rgb(250, 250, 250)')
  })
})
