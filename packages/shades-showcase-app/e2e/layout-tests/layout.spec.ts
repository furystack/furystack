import type { Page } from '@playwright/test'
import { expect, test } from '@playwright/test'

const getPageLayoutHost = (page: Page) => page.locator('shade-page-layout')

const expectDrawerOpen = async (page: Page, position: 'left' | 'right') => {
  await expect(getPageLayoutHost(page)).not.toHaveAttribute(`data-drawer-${position}-closed`)
}

const expectDrawerClosed = async (page: Page, position: 'left' | 'right') => {
  await expect(getPageLayoutHost(page)).toHaveAttribute(`data-drawer-${position}-closed`, '')
}

test.describe('PageLayout E2E Tests', () => {
  test.describe('AppBar Only', () => {
    test('renders AppBar and content correctly', async ({ page }) => {
      await page.goto('/layout-tests/appbar-only')

      await expect(page.getByTestId('test-appbar')).toBeVisible()
      await expect(page.getByTestId('test-content')).toBeVisible()

      await expect(page).toHaveScreenshot('layout-appbar-only.png')
    })
  })

  test.describe('AppBar with Left Drawer', () => {
    test('renders AppBar, left drawer, and content correctly', async ({ page }) => {
      await page.goto('/layout-tests/appbar-left-drawer')

      await expect(page.getByTestId('test-appbar')).toBeVisible()
      await expect(page.getByTestId('test-drawer-left')).toBeVisible()
      await expect(page.getByTestId('test-content')).toBeVisible()

      await expect(page).toHaveScreenshot('layout-appbar-left-drawer.png')
    })
  })

  test.describe('AppBar with Right Drawer', () => {
    test('renders AppBar, right drawer, and content correctly', async ({ page }) => {
      await page.goto('/layout-tests/appbar-right-drawer')

      await expect(page.getByTestId('test-appbar')).toBeVisible()
      await expect(page.getByTestId('test-drawer-right')).toBeVisible()
      await expect(page.getByTestId('test-content')).toBeVisible()

      await expect(page).toHaveScreenshot('layout-appbar-right-drawer.png')
    })
  })

  test.describe('AppBar with Both Drawers', () => {
    test('renders AppBar, both drawers, and content correctly', async ({ page }) => {
      await page.goto('/layout-tests/appbar-both-drawers')

      await expect(page.getByTestId('test-appbar')).toBeVisible()
      await expect(page.getByTestId('test-drawer-left')).toBeVisible()
      await expect(page.getByTestId('test-drawer-right')).toBeVisible()
      await expect(page.getByTestId('test-content')).toBeVisible()

      await expect(page).toHaveScreenshot('layout-appbar-both-drawers.png')
    })
  })

  test.describe('Collapsible Drawer', () => {
    test('open by default, toggle via AppBar button, and toggle via header button', async ({ page }) => {
      await page.goto('/layout-tests/collapsible-drawer')

      // Drawer open by default
      await expect(page.getByTestId('test-appbar')).toBeVisible()
      await expect(page.getByTestId('test-drawer-left')).toBeVisible()
      await expect(page.getByTestId('test-content')).toBeVisible()
      await expect(page).toHaveScreenshot('layout-collapsible-open.png')

      // Toggle via AppBar button
      await expectDrawerOpen(page, 'left')
      const appBarToggle = page.locator('shade-drawer-toggle-button button')
      await appBarToggle.click()
      await expectDrawerClosed(page, 'left')
      await expect(page).toHaveScreenshot('layout-collapsible-closed.png')

      // Re-open via AppBar
      await appBarToggle.click()
      await expectDrawerOpen(page, 'left')
      await expect(page.getByTestId('test-drawer-left')).toBeVisible()

      // Toggle via header action button (use exact text to avoid matching the AppBar toggle)
      const headerToggle = page.getByRole('button', { name: 'Toggle Drawer' })
      await headerToggle.click()
      await expectDrawerClosed(page, 'left')

      await headerToggle.click()
      await expectDrawerOpen(page, 'left')
      await expect(page.getByTestId('test-drawer-left')).toBeVisible()
    })
  })

  test.describe('Auto-Hide AppBar', () => {
    test('hidden by default, hover to show, and button show/hide', async ({ page }) => {
      await page.goto('/layout-tests/auto-hide-appbar')

      // AppBar hidden by default
      await expect(page.getByTestId('test-content')).toBeVisible()
      await expect(page).toHaveScreenshot('layout-auto-hide-hidden.png')

      // Hover to show AppBar
      await page.getByTestId('show-appbar-button').hover()
      await expect(page.getByTestId('test-appbar')).toBeVisible()
      await expect(page).toHaveScreenshot('layout-auto-hide-visible.png')

      // Move mouse away, then use Show/Hide buttons
      await page.getByTestId('test-content').hover()

      const showButton = page.getByRole('button', { name: /Show AppBar/i })
      await showButton.click()
      await expect(getPageLayoutHost(page)).toHaveAttribute('data-appbar-visible', '')
      await expect(page.getByTestId('test-appbar')).toBeVisible()

      const hideButton = page.getByRole('button', { name: /Hide AppBar/i })
      await hideButton.click()
      await expect(getPageLayoutHost(page)).not.toHaveAttribute('data-appbar-visible')
    })
  })

  test.describe('Responsive Layout', () => {
    test('desktop visible, resize collapse, and toggle at tablet size', async ({ page }) => {
      await page.setViewportSize({ width: 1200, height: 800 })
      await page.goto('/layout-tests/responsive-layout')

      // Desktop: drawer visible
      await expect(page.getByTestId('test-appbar')).toBeVisible()
      await expect(page.getByTestId('test-drawer-left')).toBeVisible()
      await expect(page.getByTestId('test-content')).toBeVisible()
      await expect(page).toHaveScreenshot('layout-responsive-desktop.png')

      // Resize to tablet: drawer collapses
      await page.setViewportSize({ width: 800, height: 600 })
      await expectDrawerClosed(page, 'left')
      await expect(page.getByTestId('test-content')).toBeVisible()
      await expect(page).toHaveScreenshot('layout-responsive-tablet.png')

      // Toggle drawer at tablet size
      const toggleButton = page.locator('shade-drawer-toggle-button button')
      await toggleButton.click()
      await expectDrawerOpen(page, 'left')
      await expect(page.getByTestId('test-drawer-left')).toBeVisible()
    })
  })

  test.describe('Temporary Drawer', () => {
    test('closed by default, open left/right with backdrop, and backdrop close', async ({ page }) => {
      await page.goto('/layout-tests/temporary-drawer')

      // Drawers closed by default
      await expect(page.getByTestId('test-appbar')).toBeVisible()
      await expect(page.getByTestId('test-content')).toBeVisible()
      await expectDrawerClosed(page, 'left')
      await expectDrawerClosed(page, 'right')
      await expect(page).toHaveScreenshot('layout-temporary-drawer-closed.png')

      // Open left drawer
      await page.getByRole('button', { name: /Open Left/i }).click()
      await expectDrawerOpen(page, 'left')
      await expect(page.getByTestId('test-drawer-left')).toBeVisible()
      await expect(getPageLayoutHost(page)).toHaveAttribute('data-backdrop-visible', '')
      await expect(page).toHaveScreenshot('layout-temporary-drawer-left-open.png')

      // Close left drawer via backdrop (click at right edge to avoid drawer overlay on mobile)
      const backdropBox = await page.getByTestId('page-layout-backdrop').boundingBox()
      if (backdropBox) {
        await page.mouse.click(backdropBox.x + backdropBox.width - 10, backdropBox.y + backdropBox.height / 2)
      }
      await expectDrawerClosed(page, 'left')
      await expect(getPageLayoutHost(page)).not.toHaveAttribute('data-backdrop-visible')

      // Open right drawer
      await page.getByRole('button', { name: /Open Right/i }).click()
      await expectDrawerOpen(page, 'right')
      await expect(page.getByTestId('test-drawer-right')).toBeVisible()
      await expect(getPageLayoutHost(page)).toHaveAttribute('data-backdrop-visible', '')
      await expect(page).toHaveScreenshot('layout-temporary-drawer-right-open.png')

      // Close right drawer via backdrop (click at left edge to avoid drawer overlay on mobile)
      const backdropBox2 = await page.getByTestId('page-layout-backdrop').boundingBox()
      if (backdropBox2) {
        await page.mouse.click(backdropBox2.x + 10, backdropBox2.y + backdropBox2.height / 2)
      }
      await expectDrawerClosed(page, 'right')
      await expect(getPageLayoutHost(page)).not.toHaveAttribute('data-backdrop-visible')
    })
  })

  test.describe('Layout Tests Index', () => {
    test('index page shows all links and navigates to test page', async ({ page }) => {
      await page.goto('/layout-tests')

      await expect(page.getByText('AppBar Only', { exact: true })).toBeVisible()
      await expect(page.getByText('AppBar + Left Drawer', { exact: true })).toBeVisible()
      await expect(page.getByText('AppBar + Right Drawer', { exact: true })).toBeVisible()
      await expect(page.getByText('AppBar + Both Drawers', { exact: true })).toBeVisible()
      await expect(page.getByText('Collapsible Drawer', { exact: true })).toBeVisible()
      await expect(page.getByText('Auto-Hide AppBar', { exact: true })).toBeVisible()
      await expect(page.getByText('Responsive Layout', { exact: true })).toBeVisible()
      await expect(page.getByText('Temporary Drawer', { exact: true })).toBeVisible()

      await expect(page).toHaveScreenshot('layout-tests-index.png')

      // Navigate to a test page
      await page.getByRole('link', { name: /AppBar Only/i }).click()
      await expect(page).toHaveURL('/layout-tests/appbar-only')
      await expect(page.getByTestId('test-appbar')).toBeVisible()
    })
  })
})
