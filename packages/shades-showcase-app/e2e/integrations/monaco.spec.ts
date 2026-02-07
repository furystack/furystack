import { expect, test } from '@playwright/test'

test.describe('Monaco Editor', () => {
  test('should render the Monaco editor', async ({ page }) => {
    await page.goto('/integrations/monaco')

    const pageHeader = page.locator('shade-page-header')
    await expect(pageHeader).toBeVisible()
    await expect(pageHeader).toContainText('Monaco Editor')

    // The Monaco editor container should be present
    const editor = page.locator('.monaco-editor')
    await expect(editor).toBeVisible({ timeout: 10000 })
  })
})
