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

      // Check if I remove all content, the errors should be gone
      const monacoTextArea = page.locator('.monaco-editor').nth(0)
      await monacoTextArea.click()
      await page.keyboard.press('ControlOrMeta+KeyA')
      await page.keyboard.press('Backspace')
      await expect(jsMarkersButton).toHaveText('No errors')

      // Reset Monaco State - This tests the controlled value update
      const resetButton = page.locator('button', { hasText: 'Reset' })
      await resetButton.click()

      await expect(jsMarkersButton).toHaveText('2 errors, 0 warnings')
    })

    await test.step('JSON Schema example', async () => {
      const jsonSchemaButton = page.locator('shade-tabs [is=shade-tab-header]', { hasText: 'JSON Schema' })
      await jsonSchemaButton.click()
      await expect(jsonSchemaButton).toHaveAttribute('data-active')

      const schemaSelector = page.locator('[data-testid="schema-selector"]')
      await expect(schemaSelector.locator('input')).toHaveValue(
        'internal://shades-showcase-schema-registry/userSchema.json',
      )

      const jsMarkersButton = page.locator('[data-testid=js-markers-button] button')
      await expect(jsMarkersButton).toHaveText('1 errors, 0 warnings')
      await jsMarkersButton.click()

      const modalBody = page.getByTestId('js-markers-dialog-list')
      await expect(modalBody).toHaveText('[ERROR] Value is below the minimum of 18. @L3')

      const modalClose = page.locator('monaco-markers shade-dialog shade-modal .dialog-close')
      await modalClose.click()

      // Switch to "Address" schema
      await schemaSelector.click()
      await schemaSelector
        .locator('.dropdown-item', { hasText: 'internal://shades-showcase-schema-registry/addressSchema.json' })
        .click()
      await expect(schemaSelector.locator('input')).toHaveValue(
        'internal://shades-showcase-schema-registry/addressSchema.json',
      )

      await expect(jsMarkersButton).toHaveText('6 errors, 0 warnings')

      await jsMarkersButton.click()

      await expect(modalBody).toHaveText(
        '[ERROR] Missing property "country". @L1[ERROR] Missing property "city". @L1[ERROR] Missing property "zip". @L1[ERROR] Property username is not allowed. @L2[ERROR] Property age is not allowed. @L3[ERROR] Property isAdmin is not allowed. @L4',
      )

      await modalClose.click()

      // Switch back to User schema and re-check
      await schemaSelector.click()
      await schemaSelector
        .locator('.dropdown-item', { hasText: 'internal://shades-showcase-schema-registry/userSchema.json' })
        .click()
      await expect(schemaSelector.locator('input')).toHaveValue(
        'internal://shades-showcase-schema-registry/userSchema.json',
      )

      await expect(jsMarkersButton).toHaveText('1 errors, 0 warnings')
      await jsMarkersButton.click()
      await expect(modalBody).toHaveText('[ERROR] Value is below the minimum of 18. @L3')
      await modalClose.click()

      // Switch tab to JS, then re-check if schemas can be re-initialized
      const jsButton = page.locator('shade-tabs [is=shade-tab-header]', { hasText: 'Javascript' })
      await jsButton.click()
      await expect(jsButton).toHaveAttribute('data-active')

      await jsonSchemaButton.click()
      await expect(jsonSchemaButton).toHaveAttribute('data-active')

      await expect(jsMarkersButton).toHaveText('1 errors, 0 warnings')
      await jsMarkersButton.click()
      await expect(modalBody).toHaveText('[ERROR] Value is below the minimum of 18. @L3')
      await modalClose.click()
    })
  })
})
