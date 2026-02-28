import { expect, test, type Page } from '@playwright/test'

const getThemeBackground = (page: Page) =>
  page.evaluate(() => document.documentElement.style.getPropertyValue('--shades-theme-background-default'))

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
  })

  test('should apply the light theme when selected', async ({ page }) => {
    await page.goto('/')
    await page.locator('showcase-app-bar').waitFor({ state: 'visible' })

    const dropdown = page.locator('theme-switch shade-dropdown')
    const trigger = dropdown.locator('.dropdown-trigger')
    const panel = dropdown.locator('.dropdown-panel')

    await expect(() => expect(getThemeBackground(page)).resolves.toBe('#121212')).toPass({ timeout: 5000 })

    await trigger.click()
    await expect(panel).toHaveClass(/visible/)
    await panel.getByText('Light').click()
    await expect(panel).not.toHaveClass(/visible/)

    await expect(() => expect(getThemeBackground(page)).resolves.toBe('#fafafa')).toPass({ timeout: 5000 })
  })

  test('should switch back to dark theme', async ({ page }) => {
    await page.goto('/')
    await page.locator('showcase-app-bar').waitFor({ state: 'visible' })

    const dropdown = page.locator('theme-switch shade-dropdown')
    const trigger = dropdown.locator('.dropdown-trigger')
    const panel = dropdown.locator('.dropdown-panel')

    // Switch to light first
    await trigger.click()
    await panel.getByText('Light').click()
    await expect(() => expect(getThemeBackground(page)).resolves.toBe('#fafafa')).toPass({ timeout: 5000 })

    // Switch back to dark
    await trigger.click()
    await panel.getByText('Dark').click()
    await expect(() => expect(getThemeBackground(page)).resolves.toBe('#121212')).toPass({ timeout: 5000 })
  })

  test('should show a notification when a special theme is selected', async ({ page }) => {
    await page.goto('/')
    await page.locator('showcase-app-bar').waitFor({ state: 'visible' })

    const dropdown = page.locator('theme-switch shade-dropdown')
    const trigger = dropdown.locator('.dropdown-trigger')
    const panel = dropdown.locator('.dropdown-panel')

    await trigger.click()
    await panel.getByText('Paladin').click()
    await expect(panel).not.toHaveClass(/visible/)

    await expect(page.getByText('Cheat Enabled, You Wascally Wabbit!')).toBeVisible({ timeout: 5000 })
  })
})
