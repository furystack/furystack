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

  test('should render controlled mode tabs', async ({ page }) => {
    await page.goto('/navigation/tabs')

    // Controlled demo should be visible
    await expect(page.getByText('Dashboard')).toBeVisible()
    await expect(page.getByText('Settings')).toBeVisible()
    await expect(page.getByText('Profile')).toBeVisible()

    // Dashboard content should be initially visible
    await expect(page.getByText('Dashboard content with charts and metrics')).toBeVisible()

    // Click Settings tab
    await page.getByText('Settings').click()

    // Settings content should become visible
    await expect(page.getByText('Application settings and preferences')).toBeVisible()
  })

  test('should render card type tabs', async ({ page }) => {
    await page.goto('/navigation/tabs')

    // Card type tabs should be visible
    await expect(page.getByText('Overview')).toBeVisible()
    await expect(page.getByText('Details')).toBeVisible()
    await expect(page.getByText('History')).toBeVisible()

    // The card tabs container should have data-type="card"
    const cardTabs = page.locator('shade-tabs[data-type="card"]')
    await expect(cardTabs.first()).toBeVisible()
  })

  test('should render vertical tabs', async ({ page }) => {
    await page.goto('/navigation/tabs')

    // Vertical tabs should be visible
    await expect(page.getByText('General')).toBeVisible()
    await expect(page.getByText('Security')).toBeVisible()
    await expect(page.getByText('Notifications')).toBeVisible()

    // The vertical tabs container should have data-orientation="vertical"
    const verticalTabs = page.locator('shade-tabs[data-orientation="vertical"]')
    await expect(verticalTabs.first()).toBeVisible()
  })

  test('should support closable tabs with add button', async ({ page }) => {
    await page.goto('/navigation/tabs')

    // Closable tabs should be visible
    await expect(page.getByText('index.ts')).toBeVisible()
    await expect(page.getByText('app.tsx')).toBeVisible()
    await expect(page.getByText('styles.css')).toBeVisible()

    // Close buttons should be present
    const closeButtons = page.locator('.shade-tab-close')
    const initialCount = await closeButtons.count()
    expect(initialCount).toBe(3)

    // Close a tab
    await closeButtons.first().click()

    // One fewer close button
    await expect(closeButtons).toHaveCount(2)

    // Add button should be visible
    const addButton = page.locator('.shade-tab-add')
    await expect(addButton).toBeVisible()

    // Click add button
    await addButton.click()

    // A new tab should appear
    await expect(closeButtons).toHaveCount(3)
  })
})
