import { expect, test } from '@playwright/test'

test.describe('Context Menu', () => {
  test('should open context menu on right-click', async ({ page }) => {
    await page.goto('/navigation/context-menu')

    const pageHeader = page.locator('shade-page-header')
    await expect(pageHeader).toBeVisible()
    await expect(pageHeader).toContainText('Context Menu')

    // Right-click on the trigger area
    const rightClickArea = page.getByText('Right-click here to open context menu')
    await expect(rightClickArea).toBeVisible()
    await rightClickArea.click({ button: 'right' })

    // Context menu items should appear
    await expect(page.getByText('Cut')).toBeVisible()
    await expect(page.getByText('Copy')).toBeVisible()
    await expect(page.getByText('Paste')).toBeVisible()
    await expect(page.getByText('Delete')).toBeVisible()
  })

  test('should open context menu via button', async ({ page }) => {
    await page.goto('/navigation/context-menu')

    // Click the button trigger
    const openMenuButton = page.getByText('Open menu')
    await openMenuButton.click()

    // Context menu items should appear
    await expect(page.getByText('New File')).toBeVisible()
    await expect(page.getByText('New Folder')).toBeVisible()
    await expect(page.getByText('Import...')).toBeVisible()
    await expect(page.getByText('Disabled action')).toBeVisible()
  })
})
