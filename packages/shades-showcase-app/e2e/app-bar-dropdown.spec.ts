import { expect, test, type Page } from '@playwright/test'

const getThemeBackground = (page: Page) =>
  page.evaluate(() => document.documentElement.style.getPropertyValue('--shades-theme-background-default'))

test.describe('AppBar Theme Dropdown', () => {
  test('open, close via backdrop, switch themes, and trigger special notification', async ({ page }) => {
    await page.goto('/')
    await page.locator('shade-app-bar[data-visible]').waitFor({ state: 'visible' })

    const dropdown = page.locator('theme-switch shade-dropdown')
    const trigger = dropdown.locator('.dropdown-trigger')
    const panel = dropdown.locator('.dropdown-panel')
    const backdrop = dropdown.locator('.dropdown-backdrop')

    // Open the theme dropdown by clicking the avatar
    await trigger.click()
    await expect(panel).toHaveClass(/visible/)
    await expect(panel.getByText('Dark')).toBeVisible()
    await expect(panel.getByText('Light')).toBeVisible()
    await expect(panel.getByText('Paladin')).toBeVisible()

    // Close via backdrop click (verifies backdrop-filter fix on AppBar)
    await backdrop.click({ position: { x: 10, y: 10 } })
    await expect(panel).not.toHaveClass(/visible/)

    // Apply light theme
    await expect(() => expect(getThemeBackground(page)).resolves.toBe('#121212')).toPass({ timeout: 5000 })

    await trigger.click()
    await expect(panel).toHaveClass(/visible/)
    await panel.getByText('Light').click()
    await expect(panel).not.toHaveClass(/visible/)

    await expect(() => expect(getThemeBackground(page)).resolves.toBe('#fafafa')).toPass({ timeout: 5000 })

    // Switch back to dark theme
    await trigger.click()
    await panel.getByText('Dark').click()
    await expect(() => expect(getThemeBackground(page)).resolves.toBe('#121212')).toPass({ timeout: 5000 })

    // Select Paladin theme and verify notification
    await trigger.click()
    await panel.getByText('Paladin').click()
    await expect(panel).not.toHaveClass(/visible/)

    await expect(page.getByText('Cheat Enabled, You Wascally Wabbit!')).toBeVisible({ timeout: 5000 })
  })
})
