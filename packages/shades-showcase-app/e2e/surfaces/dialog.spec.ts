import { expect, test } from '@playwright/test'

test.describe('Dialog', () => {
  test('should open and close a basic dialog', async ({ page }) => {
    await page.goto('/surfaces/dialog')

    const content = page.locator('shades-dialog-page')
    await content.waitFor({ state: 'visible' })

    // Click "Open Basic Dialog"
    await content.getByRole('button', { name: 'Open Basic Dialog' }).click()

    // Dialog title (h2) should appear inside the modal
    const dialogTitle = page.locator('.dialog-title')
    await expect(dialogTitle).toBeVisible()
    await expect(dialogTitle).toHaveText('Basic Dialog')

    // Click the close button
    await page.locator('.dialog-close').click()

    // Dialog should disappear
    await expect(dialogTitle).not.toBeVisible()
  })

  test('should open dialog with actions and close via action button', async ({ page }) => {
    await page.goto('/surfaces/dialog')

    const content = page.locator('shades-dialog-page')
    await content.waitFor({ state: 'visible' })

    // Click "Open Actions Dialog"
    await content.getByRole('button', { name: 'Open Actions Dialog' }).click()

    // Dialog should show with title
    const dialogTitle = page.locator('.dialog-title')
    await expect(dialogTitle).toBeVisible()
    await expect(dialogTitle).toHaveText('Save Changes?')

    // Action buttons should be visible
    const dialogActions = page.locator('.dialog-actions')
    await expect(dialogActions.getByRole('button', { name: 'Save' })).toBeVisible()
    await expect(dialogActions.getByRole('button', { name: 'Discard' })).toBeVisible()

    // Click "Discard" to close
    await dialogActions.getByRole('button', { name: 'Discard' }).click()

    // Dialog should close
    await expect(dialogTitle).not.toBeVisible()
  })

  test('should open and close confirm dialog', async ({ page }) => {
    await page.goto('/surfaces/dialog')

    const content = page.locator('shades-dialog-page')
    await content.waitFor({ state: 'visible' })

    // Click "Delete Item" to open confirm dialog
    await content.getByRole('button', { name: 'Delete Item' }).click()

    // Confirm dialog should appear
    const dialogTitle = page.locator('.dialog-title')
    await expect(dialogTitle).toBeVisible()
    await expect(dialogTitle).toHaveText('Delete Item')

    // Click "Cancel" to close
    await page.locator('.dialog-cancel-btn').click()
    await expect(dialogTitle).not.toBeVisible()
  })

  test('should open full-width dialog', async ({ page }) => {
    await page.goto('/surfaces/dialog')

    const content = page.locator('shades-dialog-page')
    await content.waitFor({ state: 'visible' })

    // Click "Open Full Width Dialog"
    await content.getByRole('button', { name: 'Open Full Width Dialog' }).click()

    // Dialog should appear
    const dialogTitle = page.locator('.dialog-title')
    await expect(dialogTitle).toBeVisible()
    await expect(dialogTitle).toHaveText('Full Width Dialog')

    // Close it via the action button
    const dialogActions = page.locator('.dialog-actions')
    await dialogActions.getByRole('button', { name: 'Close' }).click()
    await expect(dialogTitle).not.toBeVisible()
  })

  test('should open scrollable dialog with accept/decline', async ({ page }) => {
    await page.goto('/surfaces/dialog')

    const content = page.locator('shades-dialog-page')
    await content.waitFor({ state: 'visible' })

    // Click "Open Scrollable Dialog"
    await content.getByRole('button', { name: 'Open Scrollable Dialog' }).click()

    // Dialog should appear with terms
    const dialogTitle = page.locator('.dialog-title')
    await expect(dialogTitle).toBeVisible()
    await expect(dialogTitle).toHaveText('Terms and Conditions')

    // Click "Accept" to close
    const dialogActions = page.locator('.dialog-actions')
    await dialogActions.getByRole('button', { name: 'Accept' }).click()
    await expect(dialogTitle).not.toBeVisible()
  })
})
