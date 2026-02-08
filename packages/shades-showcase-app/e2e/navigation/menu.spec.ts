import { expect, test } from '@playwright/test'

test.describe('Menu', () => {
  test('horizontal, vertical, and inline menus with expand/collapse', async ({ page }) => {
    await page.goto('/navigation/menu')
    await page.locator('shades-menu-page').waitFor({ state: 'visible' })

    // Page header
    const pageHeader = page.locator('shade-page-header')
    await expect(pageHeader).toBeVisible()
    await expect(pageHeader).toContainText('Menu')

    // Horizontal menu: render and select item
    const hDemo = page.locator('horizontal-menu-demo')
    const hMenu = hDemo.locator('shade-menu[data-mode="horizontal"]')
    await expect(hMenu).toBeVisible()
    await expect(hMenu.getByText('Home')).toBeVisible()
    await expect(hMenu.getByText('Products')).toBeVisible()
    await expect(hMenu.getByText('About')).toBeVisible()
    await expect(hMenu.getByText('Contact')).toBeVisible()
    await hMenu.locator('[data-key="products"]').click()
    await expect(hDemo.getByText('Selected: products')).toBeVisible()

    // Vertical menu with groups
    const vDemo = page.locator('vertical-menu-demo')
    const vMenu = vDemo.locator('shade-menu[data-mode="vertical"]')
    await expect(vMenu).toBeVisible()
    await expect(vMenu.getByText('Dashboard')).toBeVisible()
    await expect(vMenu.getByText('Users')).toBeVisible()
    await expect(vMenu.getByText('Administration')).toBeVisible()
    await expect(vMenu.getByText('Settings')).toBeVisible()
    await expect(vMenu.getByText('Logs')).toBeVisible()

    // Inline menu: expand/collapse groups
    const iDemo = page.locator('inline-menu-demo')
    const iMenu = iDemo.locator('shade-menu[data-mode="inline"]')
    await expect(iMenu).toBeVisible()
    await expect(iMenu.getByText('Inbox')).toBeVisible()
    await expect(iMenu.getByText('Sent')).toBeVisible()

    const foldersLabel = iMenu.locator('.menu-group-label-inline').filter({ hasText: 'Folders' })
    await expect(foldersLabel).toBeVisible()
    await foldersLabel.click()
    await expect(iMenu.locator('[data-key="work"]')).toBeVisible()
    await expect(iMenu.locator('[data-key="personal"]')).toBeVisible()
    await foldersLabel.click()
    await expect(iMenu.locator('[data-key="work"]')).not.toBeVisible()
  })
})
