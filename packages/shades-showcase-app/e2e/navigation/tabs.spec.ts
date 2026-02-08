import { expect, test } from '@playwright/test'

test.describe('Tabs', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/navigation/tabs')
    await page.locator('tabs-page').waitFor({ state: 'visible' })
  })

  test('should render hash-based tabs and switch between them', async ({ page }) => {
    const content = page.locator('tabs-page')

    await expect(content.locator('shade-page-header')).toContainText('Tabs')

    // First tab content should be visible by default
    await expect(content.getByText('An example tab value for tab 1')).toBeVisible()

    // Click on Tab2
    await content.getByText('Tab2', { exact: true }).click()

    // Second tab content should become visible
    await expect(content.getByText('An example tab value for tab 2')).toBeVisible()
  })

  test('should support hash-based tab navigation', async ({ page }) => {
    await page.goto('/navigation/tabs#tab-2')
    await expect(page.locator('tabs-page').getByText('An example tab value for tab 2')).toBeVisible()
  })

  test('should render controlled mode tabs and switch on click', async ({ page }) => {
    const demo = page.locator('controlled-tabs-demo')
    await demo.scrollIntoViewIfNeeded()
    await expect(demo).toBeVisible()

    // Dashboard content should be initially visible
    await expect(demo.getByText('Dashboard content with charts and metrics')).toBeVisible()

    // Click Settings tab
    await demo.getByText('Settings', { exact: true }).click()

    // Settings content should become visible
    await expect(demo.getByText('Application settings and preferences')).toBeVisible()
  })

  test('should render card type tabs', async ({ page }) => {
    const content = page.locator('tabs-page')

    const cardTabs = content.locator('shade-tabs[data-type="card"]').first()
    await cardTabs.scrollIntoViewIfNeeded()
    await expect(cardTabs).toBeVisible()

    // Tab content of first tab should be visible
    await expect(content.getByText('Overview content')).toBeVisible()
  })

  test('should render vertical tabs', async ({ page }) => {
    const content = page.locator('tabs-page')

    const verticalTabs = content.locator('shade-tabs[data-orientation="vertical"]').first()
    await verticalTabs.scrollIntoViewIfNeeded()
    await expect(verticalTabs).toBeVisible()

    // First tab content should be visible
    await expect(content.getByText('General settings panel')).toBeVisible()
  })

  test('should support closable tabs with add button', async ({ page }) => {
    const demo = page.locator('closable-tabs-demo')
    await demo.scrollIntoViewIfNeeded()
    await expect(demo).toBeVisible()

    // File tabs should be visible (use exact match to avoid matching content areas)
    await expect(demo.getByText('index.ts', { exact: true })).toBeVisible()
    await expect(demo.getByText('app.tsx', { exact: true })).toBeVisible()
    await expect(demo.getByText('styles.css', { exact: true })).toBeVisible()

    // Close buttons should be present
    const closeButtons = demo.locator('.shade-tab-close')
    await expect(closeButtons).toHaveCount(3)

    // Close a tab
    await closeButtons.first().click()

    // One fewer close button
    await expect(closeButtons).toHaveCount(2)

    // Add button should be visible and functional
    const addButton = demo.locator('.shade-tab-add')
    await expect(addButton).toBeVisible()
    await addButton.click()

    // A new tab should appear
    await expect(closeButtons).toHaveCount(3)
  })
})
