import { expect, test } from '@playwright/test'

test.describe('Result', () => {
  test('should display all semantic status results', async ({ page }) => {
    await page.goto('/feedback/result')

    const content = page.locator('shades-result-page')
    await content.waitFor({ state: 'visible' })

    await expect(content.getByText('Semantic statuses', { exact: true })).toBeVisible()

    // Verify all four semantic statuses are visible
    for (const status of ['Success', 'Error', 'Warning', 'Info']) {
      await expect(
        content.locator(`shade-result[data-status="${status.toLowerCase()}"] .result-title`).getByText(status),
      ).toBeVisible()
    }
  })

  test('should display HTTP error code results', async ({ page }) => {
    await page.goto('/feedback/result')

    const content = page.locator('shades-result-page')
    await content.waitFor({ state: 'visible' })

    await expect(content.getByText('HTTP error codes', { exact: true })).toBeVisible()

    await expect(content.locator('shade-result[data-status="403"]')).toBeVisible()
    await expect(content.locator('shade-result[data-status="404"]')).toBeVisible()
    await expect(content.locator('shade-result[data-status="500"]')).toBeVisible()
  })

  test('should display subtitles on result components', async ({ page }) => {
    await page.goto('/feedback/result')

    const content = page.locator('shades-result-page')
    await content.waitFor({ state: 'visible' })

    await expect(content.getByText('Sorry, you do not have permission to access this page.')).toBeVisible()
    await expect(content.getByText('The page you are looking for does not exist or has been moved.')).toBeVisible()
  })

  test('should display action buttons in result components', async ({ page }) => {
    await page.goto('/feedback/result')

    const content = page.locator('shades-result-page')
    await content.waitFor({ state: 'visible' })

    // The 404 result has both "Go Home" and "Go Back" buttons
    const result404 = content.locator('shade-result[data-status="404"]')
    await expect(result404.getByText('Go Home')).toBeVisible()
    await expect(result404.getByText('Go Back')).toBeVisible()
  })

  test('should render all section headings', async ({ page }) => {
    await page.goto('/feedback/result')

    const content = page.locator('shades-result-page')
    await content.waitFor({ state: 'visible' })

    await expect(content.getByText('Semantic statuses', { exact: true })).toBeVisible()
    await expect(content.getByText('HTTP error codes', { exact: true })).toBeVisible()
    await expect(content.getByText('Custom icon', { exact: true })).toBeVisible()
    await expect(content.getByText('Without actions', { exact: true })).toBeVisible()
  })

  test('should display custom icon result', async ({ page }) => {
    await page.goto('/feedback/result')

    const content = page.locator('shades-result-page')
    await content.waitFor({ state: 'visible' })

    await expect(content.getByText('Payment Received')).toBeVisible()
    await expect(content.getByText('Your payment of $42.00 has been processed.')).toBeVisible()
  })

  test('should display result without actions', async ({ page }) => {
    await page.goto('/feedback/result')

    const content = page.locator('shades-result-page')
    await content.waitFor({ state: 'visible' })

    await expect(content.getByText('Verification Email Sent')).toBeVisible()

    // The "Without actions" result should not have a .result-extra area
    const infoResults = content.locator('shade-result[data-status="info"]')
    const lastInfoResult = infoResults.last()
    await expect(lastInfoResult.locator('.result-extra')).not.toBeVisible()
  })
})
