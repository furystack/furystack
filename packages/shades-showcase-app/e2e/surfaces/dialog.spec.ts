import { expect, test } from '@playwright/test'

test.describe('Dialog', () => {
  test('basic, actions, confirm, full-width, and scrollable dialogs', async ({ page }) => {
    await page.goto('/surfaces/dialog')

    const content = page.locator('shades-dialog-page')
    await content.waitFor({ state: 'visible' })

    const dialogTitle = page.locator('.dialog-title')
    const dialogActions = page.locator('.dialog-actions')

    // Open and close basic dialog
    await content.getByRole('button', { name: 'Open Basic Dialog' }).click()
    await expect(dialogTitle).toBeVisible()
    await expect(dialogTitle).toHaveText('Basic Dialog')
    await page.locator('.dialog-close').click()
    await expect(dialogTitle).not.toBeVisible()

    // Open actions dialog and close via action button
    await content.getByRole('button', { name: 'Open Actions Dialog' }).click()
    await expect(dialogTitle).toBeVisible()
    await expect(dialogTitle).toHaveText('Save Changes?')
    await expect(dialogActions.getByRole('button', { name: 'Save' })).toBeVisible()
    await expect(dialogActions.getByRole('button', { name: 'Discard' })).toBeVisible()
    await expect(page).toHaveScreenshot('dialog-actions-open.png')
    await dialogActions.getByRole('button', { name: 'Discard' }).click()
    await expect(dialogTitle).not.toBeVisible()

    // Open and close confirm dialog
    await content.getByRole('button', { name: 'Delete Item' }).click()
    await expect(dialogTitle).toBeVisible()
    await expect(dialogTitle).toHaveText('Delete Item')
    await page.locator('.dialog-cancel-btn').click()
    await expect(dialogTitle).not.toBeVisible()

    // Full-width dialog
    await content.getByRole('button', { name: 'Open Full Width Dialog' }).click()
    await expect(dialogTitle).toBeVisible()
    await expect(dialogTitle).toHaveText('Full Width Dialog')
    await dialogActions.getByRole('button', { name: 'Close' }).click()
    await expect(dialogTitle).not.toBeVisible()

    // Scrollable dialog with accept/decline
    await content.getByRole('button', { name: 'Open Scrollable Dialog' }).click()
    await expect(dialogTitle).toBeVisible()
    await expect(dialogTitle).toHaveText('Terms and Conditions')
    await dialogActions.getByRole('button', { name: 'Accept' }).click()
    await expect(dialogTitle).not.toBeVisible()
  })
})
