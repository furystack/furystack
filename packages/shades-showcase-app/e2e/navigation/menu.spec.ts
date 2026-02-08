import { expect, test } from '@playwright/test'

test.describe('Menu', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/navigation/menu')
    await page.locator('shades-menu-page').waitFor({ state: 'visible' })
  })

  test('should display the page header', async ({ page }) => {
    const pageHeader = page.locator('shade-page-header')
    await expect(pageHeader).toBeVisible()
    await expect(pageHeader).toContainText('Menu')
  })

  test('should render horizontal menu and select an item', async ({ page }) => {
    const demo = page.locator('horizontal-menu-demo')
    const menu = demo.locator('shade-menu[data-mode="horizontal"]')
    await expect(menu).toBeVisible()

    // Menu items should be visible
    await expect(menu.getByText('Home')).toBeVisible()
    await expect(menu.getByText('Products')).toBeVisible()
    await expect(menu.getByText('About')).toBeVisible()
    await expect(menu.getByText('Contact')).toBeVisible()

    // Click Products to change selection
    await menu.locator('[data-key="products"]').click()
    await expect(demo.getByText('Selected: products')).toBeVisible()
  })

  test('should render vertical menu with groups', async ({ page }) => {
    const demo = page.locator('vertical-menu-demo')
    const menu = demo.locator('shade-menu[data-mode="vertical"]')
    await expect(menu).toBeVisible()

    await expect(menu.getByText('Dashboard')).toBeVisible()
    await expect(menu.getByText('Users')).toBeVisible()
    await expect(menu.getByText('Administration')).toBeVisible()
    await expect(menu.getByText('Settings')).toBeVisible()
    await expect(menu.getByText('Logs')).toBeVisible()
  })

  test('should render inline menu and expand/collapse groups', async ({ page }) => {
    const demo = page.locator('inline-menu-demo')
    const menu = demo.locator('shade-menu[data-mode="inline"]')
    await expect(menu).toBeVisible()

    // Top-level items should be visible
    await expect(menu.getByText('Inbox')).toBeVisible()
    await expect(menu.getByText('Sent')).toBeVisible()

    // Group labels should be visible
    const foldersLabel = menu.locator('.menu-group-label-inline').filter({ hasText: 'Folders' })
    await expect(foldersLabel).toBeVisible()

    // Click to expand
    await foldersLabel.click()
    await expect(menu.locator('[data-key="work"]')).toBeVisible()
    await expect(menu.locator('[data-key="personal"]')).toBeVisible()

    // Click again to collapse
    await foldersLabel.click()
    await expect(menu.locator('[data-key="work"]')).not.toBeVisible()
  })
})
