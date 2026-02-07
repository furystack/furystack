import { expect, test } from '@playwright/test'

test.describe('Tree', () => {
  test('should render tree with root items', async ({ page }) => {
    await page.goto('/data-display/tree')

    const content = page.locator('shades-tree-page')
    await content.waitFor({ state: 'visible' })

    // Page header should be visible
    await expect(content.locator('shade-page-header')).toBeVisible()

    // Root items should be visible (scoped to content area)
    await expect(content.getByText('src')).toBeVisible()
    await expect(content.getByText('package.json')).toBeVisible()
    await expect(content.getByText('tsconfig.json')).toBeVisible()
    await expect(content.getByText('README.md')).toBeVisible()
  })

  test('should expand and collapse tree nodes with keyboard', async ({ page }) => {
    await page.goto('/data-display/tree')

    const content = page.locator('shades-tree-page')
    await content.waitFor({ state: 'visible' })

    // Click on the src folder to focus it
    await content.getByText('src').first().click()

    // Expand with ArrowRight
    await page.keyboard.press('ArrowRight')

    // Children should be visible after expand (scoped to content)
    await expect(content.getByText('components')).toBeVisible()
    await expect(content.getByText('services')).toBeVisible()
    await expect(content.getByText('index.ts')).toBeVisible()

    // Collapse with ArrowLeft
    await page.keyboard.press('ArrowLeft')

    // Children should be hidden after collapse
    await expect(content.getByText('components')).not.toBeVisible()
  })
})
