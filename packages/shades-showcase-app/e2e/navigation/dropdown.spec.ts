import { expect, test } from '@playwright/test'

test.describe('Dropdown', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/navigation/dropdown')
    await page.locator('shades-dropdown-page').waitFor({ state: 'visible' })
  })

  test('should display the page and open a basic dropdown', async ({ page }) => {
    await expect(page.locator('shade-page-header')).toContainText('Dropdown')

    // Click the first "Actions" button to open the dropdown
    const firstDropdown = page.locator('basic-dropdown-demo shade-dropdown').first()
    await firstDropdown.locator('.dropdown-trigger').click()

    // Dropdown panel should appear with menu items
    const panel = firstDropdown.locator('.dropdown-panel')
    await expect(panel).toHaveClass(/visible/)
    await expect(panel.getByText('Cut')).toBeVisible()
    await expect(panel.getByText('Copy')).toBeVisible()
    await expect(panel.getByText('Paste')).toBeVisible()
    await expect(panel.getByText('Select All')).toBeVisible()
  })

  test('should select an item, close the dropdown, and show the selection', async ({ page }) => {
    const demo = page.locator('basic-dropdown-demo')
    const firstDropdown = demo.locator('shade-dropdown').first()
    await firstDropdown.locator('.dropdown-trigger').click()

    const panel = firstDropdown.locator('.dropdown-panel')
    await expect(panel).toHaveClass(/visible/)

    // Select "Cut"
    await panel.getByText('Cut').click()

    // Menu should close
    await expect(panel).not.toHaveClass(/visible/)

    // Selection text should update
    await expect(demo.getByText('Last selected: cut')).toBeVisible()
  })

  test('should open a grouped dropdown with organized sections', async ({ page }) => {
    // Click the "File Menu" button
    await page.getByText('File Menu').click()

    // The visible panel should show grouped items
    const panel = page.locator('.dropdown-panel.visible')
    await expect(panel).toBeVisible()
    await expect(panel.getByText('New File')).toBeVisible()
    await expect(panel.getByText('Open')).toBeVisible()
    await expect(panel.getByText('Save')).toBeVisible()
    await expect(panel.getByText('Undo')).toBeVisible()
    await expect(panel.getByText('Redo')).toBeVisible()
  })

  test('should render disabled items that are not clickable', async ({ page }) => {
    await page.getByText('More Options').click()

    const panel = page.locator('.dropdown-panel.visible')
    await expect(panel).toBeVisible()

    const deleteItem = panel.locator('.dropdown-item.disabled')
    await expect(deleteItem).toBeVisible()
    await expect(deleteItem).toContainText('Delete')
  })

  test('should close dropdown when clicking the backdrop', async ({ page }) => {
    const firstDropdown = page.locator('basic-dropdown-demo shade-dropdown').first()
    await firstDropdown.locator('.dropdown-trigger').click()

    const panel = firstDropdown.locator('.dropdown-panel')
    await expect(panel).toHaveClass(/visible/)

    // Click backdrop to close
    await firstDropdown.locator('.dropdown-backdrop').click({ position: { x: 10, y: 10 } })

    await expect(panel).not.toHaveClass(/visible/)
  })
})
