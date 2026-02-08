import { expect, test } from '@playwright/test'

test.describe('Result', () => {
  test('should display all result variants and sections', async ({ page }) => {
    await page.goto('/feedback/result')

    const content = page.locator('shades-result-page')
    await content.waitFor({ state: 'visible' })

    // Verify all section headings
    await expect(content.getByText('Semantic statuses', { exact: true })).toBeVisible()
    await expect(content.getByText('HTTP error codes', { exact: true })).toBeVisible()
    await expect(content.getByText('Custom icon', { exact: true })).toBeVisible()
    await expect(content.getByText('Without actions', { exact: true })).toBeVisible()

    // Verify all four semantic statuses
    for (const status of ['Success', 'Error', 'Warning', 'Info']) {
      await expect(
        content.locator(`shade-result[data-status="${status.toLowerCase()}"] .result-title`).getByText(status),
      ).toBeVisible()
    }

    // Verify HTTP error code results
    await expect(content.locator('shade-result[data-status="403"]')).toBeVisible()
    await expect(content.locator('shade-result[data-status="404"]')).toBeVisible()
    await expect(content.locator('shade-result[data-status="500"]')).toBeVisible()

    // Verify subtitles
    await expect(content.getByText('Sorry, you do not have permission to access this page.')).toBeVisible()
    await expect(content.getByText('The page you are looking for does not exist or has been moved.')).toBeVisible()

    // Verify action buttons on 404 result
    const result404 = content.locator('shade-result[data-status="404"]')
    await expect(result404.getByText('Go Home')).toBeVisible()
    await expect(result404.getByText('Go Back')).toBeVisible()

    // Verify custom icon result
    await expect(content.getByText('Payment Received')).toBeVisible()
    await expect(content.getByText('Your payment of $42.00 has been processed.')).toBeVisible()

    // Verify result without actions
    await expect(content.getByText('Verification Email Sent')).toBeVisible()
    const infoResults = content.locator('shade-result[data-status="info"]')
    const lastInfoResult = infoResults.last()
    await expect(lastInfoResult.locator('.result-extra')).not.toBeVisible()

    await expect(content).toHaveScreenshot('result-page.png')
  })
})
