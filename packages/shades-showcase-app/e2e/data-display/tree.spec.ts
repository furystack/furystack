import { expect, test } from '@playwright/test'

test.describe('Tree', () => {
  test('render root items and expand/collapse with keyboard', async ({ page }) => {
    await page.goto('/data-display/tree')

    const content = page.locator('shades-tree-page')
    await content.waitFor({ state: 'visible' })

    await expect(content.locator('shade-page-header')).toBeVisible()

    // Root items
    await expect(content.getByText('src')).toBeVisible()
    await expect(content.getByText('package.json')).toBeVisible()
    await expect(content.getByText('tsconfig.json')).toBeVisible()
    await expect(content.getByText('README.md')).toBeVisible()

    // Expand with ArrowRight
    await content.getByText('src').first().click()
    await page.keyboard.press('ArrowRight')
    await expect(content.getByText('components')).toBeVisible()
    await expect(content.getByText('services')).toBeVisible()
    await expect(content.getByText('index.ts')).toBeVisible()

    // Collapse with ArrowLeft
    await page.keyboard.press('ArrowLeft')
    await expect(content.getByText('components')).not.toBeVisible()
  })
})
