import { expect, test } from '@playwright/test'

test.describe('Command Palette', () => {
  test('render and filter entries based on input', async ({ page, isMobile }) => {
    test.skip(isMobile, 'Keyboard interaction not supported on mobile')
    await page.goto('/navigation/command-palette')

    const content = page.locator('shades-command-palette-page')
    await content.waitFor({ state: 'visible' })

    await expect(content.locator('shade-page-header')).toBeVisible()
    await expect(content.locator('.term-icon')).toBeVisible()

    // Open command palette and filter
    await content.locator('.term-icon').click()
    const input = content.getByPlaceholder('Type to search commands...')
    await expect(input).toBeFocused()

    await input.pressSequentially('First', { delay: 50 })
    await expect(content.getByText('First Entry')).toBeVisible({ timeout: 5000 })
  })
})
