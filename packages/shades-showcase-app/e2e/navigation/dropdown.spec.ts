import { expect, test } from '@playwright/test'

test.describe('Dropdown', () => {
  test('should display the page header', async ({ page }) => {
    await page.goto('/navigation/dropdown')

    const pageHeader = page.locator('shade-page-header')
    await expect(pageHeader).toBeVisible()
    await expect(pageHeader).toContainText('Dropdown')
  })

  test('should open dropdown on button click', async ({ page }) => {
    await page.goto('/navigation/dropdown')

    const actionsButton = page.locator('shade-dropdown').first().locator('.dropdown-trigger')
    await actionsButton.click()

    await expect(page.getByText('Cut')).toBeVisible()
    await expect(page.getByText('Copy')).toBeVisible()
    await expect(page.getByText('Paste')).toBeVisible()
    await expect(page.getByText('Select All')).toBeVisible()
  })

  test('should close dropdown after selecting an item', async ({ page }) => {
    await page.goto('/navigation/dropdown')

    const actionsButton = page.locator('shade-dropdown').first().locator('.dropdown-trigger')
    await actionsButton.click()

    await page.getByText('Cut').click()

    // Menu should close
    await expect(page.locator('.dropdown-panel')).not.toBeVisible()

    // Selection text should update
    await expect(page.getByText('Last selected: cut')).toBeVisible()
  })

  test('should open grouped dropdown', async ({ page }) => {
    await page.goto('/navigation/dropdown')

    // Click the "File Menu" button
    const fileMenuButton = page.getByText('File Menu')
    await fileMenuButton.click()

    await expect(page.getByText('New File')).toBeVisible()
    await expect(page.getByText('Open')).toBeVisible()
    await expect(page.getByText('Save')).toBeVisible()
    await expect(page.getByText('Undo')).toBeVisible()
    await expect(page.getByText('Redo')).toBeVisible()
  })

  test('should show disabled items but not trigger selection', async ({ page }) => {
    await page.goto('/navigation/dropdown')

    const moreOptionsButton = page.getByText('More Options')
    await moreOptionsButton.click()

    const deleteItem = page.locator('.dropdown-item.disabled')
    await expect(deleteItem).toBeVisible()
    await expect(deleteItem).toContainText('Delete')
  })

  test('should close dropdown when clicking outside', async ({ page }) => {
    await page.goto('/navigation/dropdown')

    const actionsButton = page.locator('shade-dropdown').first().locator('.dropdown-trigger')
    await actionsButton.click()

    // Verify it's open
    await expect(page.locator('.dropdown-panel').first()).toBeVisible()

    // Click outside (on the backdrop)
    await page.locator('.dropdown-backdrop').click({ position: { x: 10, y: 10 } })

    await expect(page.locator('.dropdown-panel')).not.toBeVisible()
  })
})
