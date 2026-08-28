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

    await test.step('JavaScript Example', async () => {
      // JavaScript Tab should be enabled by default
      const header = page.locator('shade-tabs a', { hasText: 'Javascript' })
      await expect(header).toHaveAttribute('data-active')

      const jsMarkersButton = page.getByTestId('js-markers-button')
      await expect(jsMarkersButton).toContainText('2 errors, 0 warnings')

      await jsMarkersButton.click()

      const jsMarkersDialogList = page.getByTestId('js-markers-dialog-list')

      await expect(jsMarkersDialogList).toBeVisible()

      await expect(jsMarkersDialogList).toContainText(`[ERROR] Property 'foo' does not exist on type 'number[]'. @L8`)
      await expect(jsMarkersDialogList).toContainText(`[ERROR] Cannot assign to 'array' because it is a constant. @L10`)

      const closeButton = page.locator('.dialog-close')
      await closeButton.click()

      await jsMarkersDialogList.waitFor({ state: 'detached' })

      const monacoTextArea = page.locator('.monaco-editor').nth(0)

      await monacoTextArea.click()

      // 2. Select all text (works for both Windows/Linux 'Control' and macOS 'Meta')
      await page.keyboard.press('ControlOrMeta+KeyA')

      // 3. Delete the selection
      await page.keyboard.press('Backspace')

      await expect(jsMarkersButton).toHaveText('No errors')
    })
  })
})
