import { expect, test } from '@playwright/test'

test.describe('Menu', () => {
  test('should display the page header', async ({ page }) => {
    await page.goto('/navigation/menu')

    const pageHeader = page.locator('shade-page-header')
    await expect(pageHeader).toBeVisible()
    await expect(pageHeader).toContainText('Menu')
  })

  test('should render horizontal menu', async ({ page }) => {
    await page.goto('/navigation/menu')

    const horizontalMenu = page.locator('shade-menu[data-mode="horizontal"]')
    await expect(horizontalMenu).toBeVisible()

    await expect(page.getByText('Home')).toBeVisible()
    await expect(page.getByText('Products')).toBeVisible()
    await expect(page.getByText('About')).toBeVisible()
    await expect(page.getByText('Contact')).toBeVisible()
  })

  test('should render vertical menu with groups', async ({ page }) => {
    await page.goto('/navigation/menu')

    const verticalMenu = page.locator('shade-menu[data-mode="vertical"]')
    await expect(verticalMenu).toBeVisible()

    await expect(page.getByText('Dashboard')).toBeVisible()
    await expect(page.getByText('Users')).toBeVisible()
    await expect(page.getByText('Administration')).toBeVisible()
    await expect(page.getByText('Settings')).toBeVisible()
    await expect(page.getByText('Logs')).toBeVisible()
  })

  test('should select item on click and update selection text', async ({ page }) => {
    await page.goto('/navigation/menu')

    const productsItem = page.locator('shade-menu[data-mode="horizontal"] [data-key="products"]')
    await productsItem.click()

    await expect(page.getByText('Selected: products')).toBeVisible()
  })

  test('should render inline menu with collapsible groups', async ({ page }) => {
    await page.goto('/navigation/menu')

    const inlineMenu = page.locator('shade-menu[data-mode="inline"]')
    await expect(inlineMenu).toBeVisible()

    await expect(page.getByText('Inbox')).toBeVisible()
    await expect(page.getByText('Sent')).toBeVisible()
    await expect(page.getByText('Folders')).toBeVisible()
    await expect(page.getByText('Labels')).toBeVisible()
  })

  test('should expand and collapse inline groups', async ({ page }) => {
    await page.goto('/navigation/menu')

    // Groups should be collapsed initially - child items should not be visible
    const foldersLabel = page
      .locator('shade-menu[data-mode="inline"] .menu-group-label-inline')
      .filter({ hasText: 'Folders' })
    await expect(foldersLabel).toBeVisible()

    // Click to expand
    await foldersLabel.click()
    await expect(page.locator('shade-menu[data-mode="inline"] [data-key="work"]')).toBeVisible()
    await expect(page.locator('shade-menu[data-mode="inline"] [data-key="personal"]')).toBeVisible()

    // Click again to collapse
    await foldersLabel.click()
    await expect(page.locator('shade-menu[data-mode="inline"] [data-key="work"]')).not.toBeVisible()
  })
})
