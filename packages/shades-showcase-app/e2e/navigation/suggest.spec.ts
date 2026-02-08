import { expect, test } from '@playwright/test'

test.describe('Suggest', () => {
  test('render and show suggestions when typing', async ({ page, isMobile }) => {
    test.skip(isMobile, 'Keyboard interaction not supported on mobile')
    await page.goto('/navigation/suggest')

    const content = page.locator('shades-suggest-page')
    await content.waitFor({ state: 'visible' })

    await expect(content.locator('shade-page-header')).toBeVisible()
    await expect(content.locator('.term-icon')).toBeVisible()

    // Open suggest and type
    await content.locator('.term-icon').click()
    const input = content.locator('shade-suggest input')
    await expect(input).toBeFocused()

    await input.pressSequentially('Entry', { delay: 50 })
    await expect(content.getByText('First Entry')).toBeVisible({ timeout: 10000 })
  })
})
