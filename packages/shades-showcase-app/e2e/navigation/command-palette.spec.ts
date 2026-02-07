import { expect, test } from '@playwright/test'

test.describe('Command Palette', () => {
  test('should render the command palette', async ({ page }) => {
    await page.goto('/navigation/command-palette')

    const content = page.locator('shades-command-palette-page')
    await content.waitFor({ state: 'visible' })

    await expect(content.locator('shade-page-header')).toBeVisible()

    // The ">" prefix icon should be visible
    await expect(content.locator('.term-icon')).toBeVisible()
  })

  test('should filter entries based on input', async ({ page, isMobile }) => {
    test.skip(isMobile, 'Keyboard interaction not supported on mobile')
    await page.goto('/navigation/command-palette')

    const content = page.locator('shades-command-palette-page')
    await content.waitFor({ state: 'visible' })

    // Click the ">" icon to open the command palette
    await content.locator('.term-icon').click()

    // The input should be visible and focused
    const input = content.getByPlaceholder('Type to search commands...')
    await expect(input).toBeFocused()

    // Type to trigger keyup events (fill() doesn't trigger keyup)
    await input.pressSequentially('First', { delay: 50 })

    // Should show matching entry in the suggestion list
    await expect(content.getByText('First Entry')).toBeVisible({ timeout: 5000 })
  })
})
