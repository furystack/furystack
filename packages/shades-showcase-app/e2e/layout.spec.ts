import type { Page } from '@playwright/test'
import { expect, test } from '@playwright/test'

/**
 * Helper to get the PageLayout host element
 */
const getPageLayoutHost = (page: Page) => page.locator('shade-page-layout')

/**
 * Helper to assert drawer is open (PageLayout uses CSS classes on the host)
 */
const expectDrawerOpen = async (page: Page, position: 'left' | 'right') => {
  await expect(getPageLayoutHost(page)).not.toHaveClass(new RegExp(`drawer-${position}-closed`))
}

/**
 * Helper to assert drawer is closed (PageLayout uses CSS classes on the host)
 */
const expectDrawerClosed = async (page: Page, position: 'left' | 'right') => {
  await expect(getPageLayoutHost(page)).toHaveClass(new RegExp(`drawer-${position}-closed`))
}

test.describe('PageLayout E2E Tests', () => {
  test.describe('AppBar Only', () => {
    test('renders AppBar and content correctly', async ({ page }) => {
      await page.goto('/layout-tests/appbar-only')

      // Verify elements are present
      await expect(page.getByTestId('test-appbar')).toBeVisible()
      await expect(page.getByTestId('test-content')).toBeVisible()

      // Visual regression test
      await expect(page).toHaveScreenshot('layout-appbar-only.png')
    })
  })

  test.describe('AppBar with Left Drawer', () => {
    test('renders AppBar, left drawer, and content correctly', async ({ page }) => {
      await page.goto('/layout-tests/appbar-left-drawer')

      // Verify elements are present
      await expect(page.getByTestId('test-appbar')).toBeVisible()
      await expect(page.getByTestId('test-drawer-left')).toBeVisible()
      await expect(page.getByTestId('test-content')).toBeVisible()

      // Visual regression test
      await expect(page).toHaveScreenshot('layout-appbar-left-drawer.png')
    })
  })

  test.describe('AppBar with Right Drawer', () => {
    test('renders AppBar, right drawer, and content correctly', async ({ page }) => {
      await page.goto('/layout-tests/appbar-right-drawer')

      // Verify elements are present
      await expect(page.getByTestId('test-appbar')).toBeVisible()
      await expect(page.getByTestId('test-drawer-right')).toBeVisible()
      await expect(page.getByTestId('test-content')).toBeVisible()

      // Visual regression test
      await expect(page).toHaveScreenshot('layout-appbar-right-drawer.png')
    })
  })

  test.describe('AppBar with Both Drawers', () => {
    test('renders AppBar, both drawers, and content correctly', async ({ page }) => {
      await page.goto('/layout-tests/appbar-both-drawers')

      // Verify all elements are present
      await expect(page.getByTestId('test-appbar')).toBeVisible()
      await expect(page.getByTestId('test-drawer-left')).toBeVisible()
      await expect(page.getByTestId('test-drawer-right')).toBeVisible()
      await expect(page.getByTestId('test-content')).toBeVisible()

      // Visual regression test
      await expect(page).toHaveScreenshot('layout-appbar-both-drawers.png')
    })
  })

  test.describe('Collapsible Drawer', () => {
    test('drawer is open by default', async ({ page }) => {
      await page.goto('/layout-tests/collapsible-drawer')

      // Drawer should be open by default
      await expect(page.getByTestId('test-appbar')).toBeVisible()
      await expect(page.getByTestId('test-drawer-left')).toBeVisible()
      await expect(page.getByTestId('test-content')).toBeVisible()

      // Visual regression test with drawer open
      await expect(page).toHaveScreenshot('layout-collapsible-open.png')
    })

    test('drawer toggles when clicking the toggle button in AppBar', async ({ page }) => {
      await page.goto('/layout-tests/collapsible-drawer')

      // Drawer should be open by default
      await expectDrawerOpen(page, 'left')
      await expect(page.getByTestId('test-drawer-left')).toBeVisible()

      // Click the toggle button in the AppBar
      const toggleButton = page.locator('shade-drawer-toggle-button button')
      await toggleButton.click()

      // Wait for drawer to close (auto-waits for attribute change)
      await expectDrawerClosed(page, 'left')

      // Visual regression test with drawer closed
      await expect(page).toHaveScreenshot('layout-collapsible-closed.png')
    })

    test('drawer toggles using programmatic button', async ({ page }) => {
      await page.goto('/layout-tests/collapsible-drawer')

      // Drawer should be open by default
      await expectDrawerOpen(page, 'left')
      await expect(page.getByTestId('test-drawer-left')).toBeVisible()

      // Click the programmatic toggle button
      const programmaticButton = page.getByRole('button', { name: 'Toggle Drawer Programmatically' })
      await programmaticButton.click()

      // Wait for drawer to close (auto-waits for attribute change)
      await expectDrawerClosed(page, 'left')

      // Toggle back open
      await programmaticButton.click()

      // Wait for drawer to open (auto-waits for attribute change)
      await expectDrawerOpen(page, 'left')
      await expect(page.getByTestId('test-drawer-left')).toBeVisible()
    })
  })

  test.describe('Auto-Hide AppBar', () => {
    test('AppBar is hidden by default', async ({ page }) => {
      await page.goto('/layout-tests/auto-hide-appbar')

      // Content should be visible
      await expect(page.getByTestId('test-content')).toBeVisible()

      // Visual regression test with AppBar hidden
      await expect(page).toHaveScreenshot('layout-auto-hide-hidden.png')
    })

    test('AppBar shows when hovering at top', async ({ page }) => {
      await page.goto('/layout-tests/auto-hide-appbar')

      // Hover at the show appbar button
      await page.getByTestId('show-appbar-button').hover()

      // AppBar should now be visible (auto-waits for visibility)
      await expect(page.getByTestId('test-appbar')).toBeVisible()

      // Visual regression test with AppBar visible on hover
      await expect(page).toHaveScreenshot('layout-auto-hide-visible.png')
    })

    test('AppBar shows when clicking Show button', async ({ page }) => {
      await page.goto('/layout-tests/auto-hide-appbar')

      // Click the Show AppBar button
      const showButton = page.getByRole('button', { name: 'Show AppBar' })
      await showButton.click()

      // AppBar should now be visible (host has appbar-visible class)
      await expect(getPageLayoutHost(page)).toHaveClass(/appbar-visible/)
      await expect(page.getByTestId('test-appbar')).toBeVisible()

      // Click the Hide AppBar button
      const hideButton = page.getByRole('button', { name: 'Hide AppBar' })
      await hideButton.click()

      // AppBar should now be hidden (host does not have appbar-visible class)
      await expect(getPageLayoutHost(page)).not.toHaveClass(/appbar-visible/)
    })
  })

  test.describe('Responsive Layout', () => {
    test('drawer is visible at desktop size', async ({ page }) => {
      await page.setViewportSize({ width: 1200, height: 800 })
      await page.goto('/layout-tests/responsive-layout')

      // At desktop size, drawer should be visible
      await expect(page.getByTestId('test-appbar')).toBeVisible()
      await expect(page.getByTestId('test-drawer-left')).toBeVisible()
      await expect(page.getByTestId('test-content')).toBeVisible()

      // Visual regression test at desktop size
      await expect(page).toHaveScreenshot('layout-responsive-desktop.png')
    })

    test('drawer collapses when resizing from desktop to tablet', async ({ page }) => {
      // Start at desktop size with drawer open
      await page.setViewportSize({ width: 1200, height: 800 })
      await page.goto('/layout-tests/responsive-layout')

      // Drawer should be open at desktop size
      await expectDrawerOpen(page, 'left')

      // Resize to tablet size (below md breakpoint of 900px)
      await page.setViewportSize({ width: 800, height: 600 })

      // Drawer should auto-collapse when screen becomes smaller than breakpoint
      await expectDrawerClosed(page, 'left')
      await expect(page.getByTestId('test-content')).toBeVisible()

      // Visual regression test at tablet size
      await expect(page).toHaveScreenshot('layout-responsive-tablet.png')
    })

    test('drawer can be toggled at tablet size', async ({ page }) => {
      // Start at desktop size, then resize to trigger collapse
      await page.setViewportSize({ width: 1200, height: 800 })
      await page.goto('/layout-tests/responsive-layout')
      await expectDrawerOpen(page, 'left')

      // Resize to tablet size - drawer should auto-collapse
      await page.setViewportSize({ width: 800, height: 600 })
      await expectDrawerClosed(page, 'left')

      // Click toggle button to open drawer at tablet size
      const toggleButton = page.locator('shade-drawer-toggle-button button')
      await toggleButton.click()

      // Drawer should open
      await expectDrawerOpen(page, 'left')
      await expect(page.getByTestId('test-drawer-left')).toBeVisible()
    })
  })

  test.describe('Temporary Drawer', () => {
    test('drawers are closed by default', async ({ page }) => {
      await page.goto('/layout-tests/temporary-drawer')

      // Content should be visible
      await expect(page.getByTestId('test-appbar')).toBeVisible()
      await expect(page.getByTestId('test-content')).toBeVisible()

      // Drawers should be closed by default
      await expectDrawerClosed(page, 'left')
      await expectDrawerClosed(page, 'right')

      // Visual regression test with drawers closed
      await expect(page).toHaveScreenshot('layout-temporary-drawer-closed.png')
    })

    test('left drawer opens with backdrop when clicking open button', async ({ page }) => {
      await page.goto('/layout-tests/temporary-drawer')

      // Click open left drawer button
      await page.getByRole('button', { name: 'Open Left Drawer' }).click()

      // Drawer should open and backdrop should be visible
      await expectDrawerOpen(page, 'left')
      await expect(page.getByTestId('test-drawer-left')).toBeVisible()
      await expect(getPageLayoutHost(page)).toHaveClass(/backdrop-visible/)

      // Visual regression test with left drawer open
      await expect(page).toHaveScreenshot('layout-temporary-drawer-left-open.png')
    })

    test('right drawer opens with backdrop when clicking open button', async ({ page }) => {
      await page.goto('/layout-tests/temporary-drawer')

      // Click open right drawer button
      await page.getByRole('button', { name: 'Open Right Drawer' }).click()

      // Drawer should open and backdrop should be visible
      await expectDrawerOpen(page, 'right')
      await expect(page.getByTestId('test-drawer-right')).toBeVisible()
      await expect(getPageLayoutHost(page)).toHaveClass(/backdrop-visible/)

      // Visual regression test with right drawer open
      await expect(page).toHaveScreenshot('layout-temporary-drawer-right-open.png')
    })

    test('drawer closes when clicking backdrop', async ({ page }) => {
      await page.goto('/layout-tests/temporary-drawer')

      // Open left drawer
      await page.getByRole('button', { name: 'Open Left Drawer' }).click()
      await expectDrawerOpen(page, 'left')
      await expect(getPageLayoutHost(page)).toHaveClass(/backdrop-visible/)

      // Click the backdrop to close drawer
      await page.getByTestId('page-layout-backdrop').click()

      // Drawer should close and backdrop should be hidden
      await expectDrawerClosed(page, 'left')
      await expect(getPageLayoutHost(page)).not.toHaveClass(/backdrop-visible/)
    })

    test('backdrop closes all temporary drawers', async ({ page }) => {
      await page.goto('/layout-tests/temporary-drawer')

      // Open left drawer first
      await page.getByRole('button', { name: 'Open Left Drawer' }).click()
      await expectDrawerOpen(page, 'left')

      // Click backdrop to close
      await page.getByTestId('page-layout-backdrop').click()
      await expectDrawerClosed(page, 'left')

      // Open right drawer
      await page.getByRole('button', { name: 'Open Right Drawer' }).click()
      await expectDrawerOpen(page, 'right')

      // Click backdrop to close
      await page.getByTestId('page-layout-backdrop').click()
      await expectDrawerClosed(page, 'right')
      await expect(getPageLayoutHost(page)).not.toHaveClass(/backdrop-visible/)
    })
  })

  test.describe('Layout Tests Index', () => {
    test('index page shows all test links', async ({ page }) => {
      await page.goto('/layout-tests')

      // Verify that all test page links are present (using exact match for titles)
      await expect(page.getByText('AppBar Only', { exact: true })).toBeVisible()
      await expect(page.getByText('AppBar + Left Drawer', { exact: true })).toBeVisible()
      await expect(page.getByText('AppBar + Right Drawer', { exact: true })).toBeVisible()
      await expect(page.getByText('AppBar + Both Drawers', { exact: true })).toBeVisible()
      await expect(page.getByText('Collapsible Drawer', { exact: true })).toBeVisible()
      await expect(page.getByText('Auto-Hide AppBar', { exact: true })).toBeVisible()
      await expect(page.getByText('Responsive Layout', { exact: true })).toBeVisible()
      await expect(page.getByText('Temporary Drawer', { exact: true })).toBeVisible()

      // Visual regression test for index page
      await expect(page).toHaveScreenshot('layout-tests-index.png')
    })

    test('can navigate to test pages from index', async ({ page }) => {
      await page.goto('/layout-tests')

      // Click on AppBar Only link
      await page.getByRole('link', { name: /AppBar Only/i }).click()

      // Should navigate to the test page
      await expect(page).toHaveURL('/layout-tests/appbar-only')
      await expect(page.getByTestId('test-appbar')).toBeVisible()
    })
  })
})
