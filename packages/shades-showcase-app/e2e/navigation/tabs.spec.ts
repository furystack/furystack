import { expect, test } from '@playwright/test'

test.describe('Tabs', () => {
  test('should render tabs and switch between them', async ({ page }) => {
    await page.goto('/navigation/tabs')

    const pageHeader = page.locator('shade-page-header')
    await expect(pageHeader).toBeVisible()
    await expect(pageHeader).toContainText('Tabs')

    // Tab headers should be visible
    await expect(page.getByText('Tab1')).toBeVisible()
    await expect(page.getByText('Tab2')).toBeVisible()

    // First tab content should be visible by default
    await expect(page.getByText('An example tab value for tab 1')).toBeVisible()

    // Click on Tab2
    await page.getByText('Tab2').click()

    // Second tab content should become visible
    await expect(page.getByText('An example tab value for tab 2')).toBeVisible()
  })

  test('should support hash-based tab navigation', async ({ page }) => {
    // Navigate directly to tab 2 via hash
    await page.goto('/navigation/tabs#tab-2')

    // Second tab content should be visible
    await expect(page.getByText('An example tab value for tab 2')).toBeVisible()
  })
})
