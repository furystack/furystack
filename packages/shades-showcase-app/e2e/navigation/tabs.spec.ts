import { expect, test } from '@playwright/test'

test.describe('Tabs', () => {
  test('hash-based, controlled, card, and vertical tabs', async ({ page }) => {
    await page.goto('/navigation/tabs')
    await page.locator('tabs-page').waitFor({ state: 'visible' })

    const content = page.locator('tabs-page')
    await expect(content.locator('shade-page-header')).toContainText('Tabs')

    // Hash-based tabs: switch between them
    await expect(content.getByText('An example tab value for tab 1')).toBeVisible()
    await content.getByText('Tab2', { exact: true }).click()
    await expect(content.getByText('An example tab value for tab 2')).toBeVisible()

    // Controlled mode tabs
    const controlledDemo = page.locator('controlled-tabs-demo')
    await controlledDemo.scrollIntoViewIfNeeded()
    await expect(controlledDemo).toBeVisible()
    await expect(controlledDemo.getByText('Dashboard content with charts and metrics')).toBeVisible()
    await controlledDemo.getByText('Settings', { exact: true }).click()
    await expect(controlledDemo.getByText('Application settings and preferences')).toBeVisible()

    // Card type tabs
    const cardTabs = content.locator('shade-tabs[data-type="card"]').first()
    await cardTabs.scrollIntoViewIfNeeded()
    await expect(cardTabs).toBeVisible()
    await expect(content.getByText('Overview content')).toBeVisible()

    // Vertical tabs
    const verticalTabs = content.locator('shade-tabs[data-orientation="vertical"]').first()
    await verticalTabs.scrollIntoViewIfNeeded()
    await expect(verticalTabs).toBeVisible()
    await expect(content.getByText('General settings panel')).toBeVisible()

    await expect(content).toHaveScreenshot('tabs-page.png')
  })

  test('hash navigation and closable tabs with add button', async ({ page }) => {
    // Direct hash navigation
    await page.goto('/navigation/tabs#tab-2')
    await expect(page.locator('tabs-page').getByText('An example tab value for tab 2')).toBeVisible()

    // Closable tabs
    const demo = page.locator('closable-tabs-demo')
    await demo.scrollIntoViewIfNeeded()
    await expect(demo).toBeVisible()

    await expect(demo.getByText('index.ts', { exact: true })).toBeVisible()
    await expect(demo.getByText('app.tsx', { exact: true })).toBeVisible()
    await expect(demo.getByText('styles.css', { exact: true })).toBeVisible()

    const closeButtons = demo.locator('.shade-tab-close')
    await expect(closeButtons).toHaveCount(3)

    // Close a tab
    await closeButtons.first().click()
    await expect(closeButtons).toHaveCount(2)

    // Add a tab
    const addButton = demo.locator('.shade-tab-add')
    await expect(addButton).toBeVisible()
    await addButton.click()
    await expect(closeButtons).toHaveCount(3)
  })
})
