import { expect, test } from '@playwright/test'

test.describe('Alert', () => {
  test('should display all severity alerts', async ({ page }) => {
    await page.goto('/feedback/alert')

    const content = page.locator('shades-alert-page')
    await content.waitFor({ state: 'visible' })

    // Verify all four severity alerts are visible in the "Standard" section
    await expect(content.getByText('This is a error alert — check it out!')).toBeVisible()
    await expect(content.getByText('This is a warning alert — check it out!')).toBeVisible()
    await expect(content.getByText('This is a info alert — check it out!')).toBeVisible()
    await expect(content.getByText('This is a success alert — check it out!')).toBeVisible()
  })

  test('should dismiss a closeable alert and reset', async ({ page }) => {
    await page.goto('/feedback/alert')

    const content = page.locator('shades-alert-page')
    await content.waitFor({ state: 'visible' })

    // Find the "Closeable" section
    const closeableHeading = content.getByText('Closeable', { exact: true })
    await expect(closeableHeading).toBeVisible()

    // The closeable error alert should be visible
    const closeableErrorAlert = content.locator('shade-alert[data-severity="error"]').filter({ hasText: 'closeable' })
    await expect(closeableErrorAlert.first()).toBeVisible()

    // Click the close button on the first closeable alert
    await closeableErrorAlert.first().locator('.alert-close').click()

    // The error closeable alert should be gone
    await expect(
      content.locator('shade-alert[data-severity="error"]').filter({ hasText: 'closeable error' }),
    ).not.toBeVisible()

    // A reset notification should appear indicating dismissed count
    await expect(content.getByText('1 alert(s) dismissed')).toBeVisible()

    // Click close on the reset info alert to reset
    const resetAlert = content.locator('shade-alert').filter({ hasText: 'alert(s) dismissed' })
    await resetAlert.locator('.alert-close').click()

    // All closeable alerts should be restored
    await expect(
      content.locator('shade-alert[data-severity="error"]').filter({ hasText: 'closeable' }).first(),
    ).toBeVisible()
  })

  test('should render all variant sections', async ({ page }) => {
    await page.goto('/feedback/alert')

    const content = page.locator('shades-alert-page')
    await content.waitFor({ state: 'visible' })

    // Verify all variant section headings exist
    await expect(content.getByText('Standard (default)', { exact: true })).toBeVisible()
    await expect(content.getByText('Filled', { exact: true })).toBeVisible()
    await expect(content.getByText('Outlined', { exact: true })).toBeVisible()
    await expect(content.getByText('With title', { exact: true })).toBeVisible()
    await expect(content.getByText('Custom icon', { exact: true })).toBeVisible()
  })
})
