import { expect, test } from '@playwright/test'

test.describe('Context Menu', () => {
  test('right-click trigger and button trigger context menus', async ({ page }) => {
    await page.goto('/navigation/context-menu')

    const pageHeader = page.locator('shade-page-header')
    await expect(pageHeader).toBeVisible()
    await expect(pageHeader).toContainText('Context Menu')

    // Right-click trigger
    const rightClickArea = page.getByText('Right-click here to open context menu')
    await expect(rightClickArea).toBeVisible()
    await rightClickArea.click({ button: 'right' })
    await expect(page.getByText('Cut')).toBeVisible()
    await expect(page.getByText('Copy')).toBeVisible()
    await expect(page.getByText('Paste')).toBeVisible()
    await expect(page.getByText('Delete')).toBeVisible()

    // Close by pressing Escape
    await page.keyboard.press('Escape')

    // Button trigger
    const openMenuButton = page.getByText('Open menu')
    await openMenuButton.click()
    await expect(page.getByText('New File')).toBeVisible()
    await expect(page.getByText('New Folder')).toBeVisible()
    await expect(page.getByText('Import...')).toBeVisible()
    await expect(page.getByText('Disabled action')).toBeVisible()
  })
})
