import { expect, test } from '@playwright/test'

test.describe('Dropdown', () => {
  test('basic dropdown: open, select item, grouped items, disabled, and backdrop close', async ({ page }) => {
    await page.goto('/navigation/dropdown')
    await page.locator('shades-dropdown-page').waitFor({ state: 'visible' })

    await expect(page.locator('shade-page-header')).toContainText('Dropdown')

    // Open basic dropdown
    const firstDropdown = page.locator('basic-dropdown-demo shade-dropdown').first()
    await firstDropdown.locator('.dropdown-trigger').click()
    const panel = firstDropdown.locator('.dropdown-panel')
    await expect(panel).toHaveClass(/visible/)
    await expect(panel.getByText('Cut')).toBeVisible()
    await expect(panel.getByText('Copy')).toBeVisible()
    await expect(panel.getByText('Paste')).toBeVisible()
    await expect(panel.getByText('Select All')).toBeVisible()

    // Select an item
    const demo = page.locator('basic-dropdown-demo')
    await panel.getByText('Cut').click()
    await expect(panel).not.toHaveClass(/visible/)
    await expect(demo.getByText('Last selected: cut')).toBeVisible()

    // Close dropdown via backdrop
    await firstDropdown.locator('.dropdown-trigger').click()
    await expect(panel).toHaveClass(/visible/)
    await firstDropdown.locator('.dropdown-backdrop').click({ position: { x: 10, y: 10 } })
    await expect(panel).not.toHaveClass(/visible/)

    // Grouped dropdown
    await page.getByText('File Menu').click()
    const groupedPanel = page.locator('.dropdown-panel.visible')
    await expect(groupedPanel).toBeVisible()
    await expect(groupedPanel.getByText('New File')).toBeVisible()
    await expect(groupedPanel.getByText('Open')).toBeVisible()
    await expect(groupedPanel.getByText('Save')).toBeVisible()
    await expect(groupedPanel.getByText('Undo')).toBeVisible()
    await expect(groupedPanel.getByText('Redo')).toBeVisible()

    // Close grouped dropdown before opening next
    await page.keyboard.press('Escape')

    // Disabled items
    await page.getByText('More Options').click()
    const morePanel = page.locator('.dropdown-panel.visible')
    await expect(morePanel).toBeVisible()
    const deleteItem = morePanel.locator('.dropdown-item.disabled')
    await expect(deleteItem).toBeVisible()
    await expect(deleteItem).toContainText('Delete')
  })
})
