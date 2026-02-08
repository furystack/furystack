import { expect, test } from '@playwright/test'

test.describe('Alert', () => {
  test('should display all alert variants and support dismiss/reset', async ({ page }) => {
    await page.goto('/feedback/alert')

    const content = page.locator('shades-alert-page')
    await content.waitFor({ state: 'visible' })

    // Verify all severity alerts
    await expect(content.getByText('This is a error alert — check it out!')).toBeVisible()
    await expect(content.getByText('This is a warning alert — check it out!')).toBeVisible()
    await expect(content.getByText('This is a info alert — check it out!')).toBeVisible()
    await expect(content.getByText('This is a success alert — check it out!')).toBeVisible()

    // Verify all variant section headings
    await expect(content.getByText('Standard (default)', { exact: true })).toBeVisible()
    await expect(content.getByText('Filled', { exact: true })).toBeVisible()
    await expect(content.getByText('Outlined', { exact: true })).toBeVisible()
    await expect(content.getByText('With title', { exact: true })).toBeVisible()
    await expect(content.getByText('Custom icon', { exact: true })).toBeVisible()

    await expect(content).toHaveScreenshot('alert-variants.png')

    // Verify closeable alert dismiss and reset flow
    const closeableHeading = content.getByText('Closeable', { exact: true })
    await expect(closeableHeading).toBeVisible()

    const closeableErrorAlert = content.locator('shade-alert[data-severity="error"]').filter({ hasText: 'closeable' })
    await expect(closeableErrorAlert.first()).toBeVisible()

    await closeableErrorAlert.first().locator('.alert-close').click()

    await expect(
      content.locator('shade-alert[data-severity="error"]').filter({ hasText: 'closeable error' }),
    ).not.toBeVisible()

    await expect(content.getByText('1 alert(s) dismissed')).toBeVisible()

    // Reset dismissed alerts
    const resetAlert = content.locator('shade-alert').filter({ hasText: 'alert(s) dismissed' })
    await resetAlert.locator('.alert-close').click()

    await expect(
      content.locator('shade-alert[data-severity="error"]').filter({ hasText: 'closeable' }).first(),
    ).toBeVisible()
  })
})
