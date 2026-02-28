import { expect, test } from '@playwright/test'

test.describe('AppBar Theme Dropdown', () => {
  test('open dropdown, close via backdrop, and select a theme', async ({ page }) => {
    await page.goto('/')
    await page.locator('showcase-app-bar').waitFor({ state: 'visible' })

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

    // Reopen and select a theme
    await trigger.click()
    await expect(panel).toHaveClass(/visible/)
    await panel.getByText('Light').click()
    await expect(panel).not.toHaveClass(/visible/)
  })
})
