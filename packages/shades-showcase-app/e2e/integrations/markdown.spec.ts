import { expect, test } from '@playwright/test'

test.describe('Markdown', () => {
  test('rendering and interaction: page, headings, checkboxes, editor layouts, and textarea', async ({ page }) => {
    await page.goto('/integrations/markdown')

    const content = page.locator('shades-markdown-page')
    await content.waitFor({ state: 'visible' })

    // Page header
    const pageHeader = page.locator('shade-page-header')
    await expect(pageHeader).toBeVisible()
    await expect(pageHeader).toContainText('Markdown')

    // Headings rendered
    const heading = content.locator('shade-markdown-display [is^="shade-typography"][data-variant="h1"]').first()
    await expect(heading).toBeVisible()
    await expect(heading).toContainText('Markdown Components')

    // Code blocks
    const codeBlock = content.locator('shade-markdown-display .md-code-block').first()
    await expect(codeBlock).toBeVisible()

    // Links
    const link = content.locator('shade-markdown-display .md-link').first()
    await expect(link).toBeVisible()

    // Blockquote
    const blockquote = content.locator('shade-markdown-display .md-blockquote').first()
    await expect(blockquote).toBeVisible()

    // Interactive checkboxes
    const interactiveSection = content.locator('shade-markdown-display').nth(1)
    await expect(interactiveSection).toBeVisible()
    const uncheckedCheckbox = interactiveSection.locator('shade-checkbox input[type="checkbox"]:not(:checked)').first()
    await expect(uncheckedCheckbox).toBeVisible()
    await uncheckedCheckbox.click()

    // Textarea
    const textarea = content.locator('shade-markdown-input textarea').first()
    await expect(textarea).toBeVisible()

    // Editor section: side-by-side by default
    const editorSection = content.locator('.markdown-editor-section')
    await expect(editorSection).toBeVisible()

    const editor = editorSection.locator('shade-markdown-editor')
    await expect(editor).toBeVisible()

    const editorInput = editor.locator('shade-markdown-input')
    await expect(editorInput).toBeVisible()

    const editorDisplay = editor.locator('shade-markdown-display')
    await expect(editorDisplay).toBeVisible()

    // Switch to tabs layout
    const tabsButton = editorSection.getByRole('button', { name: 'Tabs' })
    await tabsButton.click()
    const tabs = editor.locator('shade-tabs')
    await expect(tabs).toBeVisible()

    // Switch to above-below layout
    const aboveBelowButton = editorSection.getByRole('button', { name: 'Above / Below' })
    await aboveBelowButton.click()
    const split = editor.locator('.md-editor-split[data-layout="above-below"]')
    await expect(split).toBeVisible()
  })

  test.describe('keyboard navigation', () => {
    test.skip(({ isMobile }) => isMobile, 'Desktop-only tests (requires keyboard interaction)')

    test('focus, arrow-key navigation, and keyboard interaction across all elements', async ({ page }) => {
      await page.goto('/integrations/markdown')

      const content = page.locator('shades-markdown-page')
      await content.waitFor({ state: 'visible' })

      // Focus links
      const firstLink = content.locator('shade-markdown-display .md-link').first()
      await firstLink.focus()
      await expect(firstLink).toBeFocused()

      // Focus code blocks
      const codeBlock = content.locator('shade-markdown-display .md-code-block').first()
      await expect(codeBlock).toHaveAttribute('tabindex', '0')
      await codeBlock.focus()
      await expect(codeBlock).toBeFocused()

      // Toggle checkbox via keyboard
      const interactiveSection = content.locator('shade-markdown-display').nth(1)
      await expect(interactiveSection).toBeVisible()

      const allCheckboxes = interactiveSection.locator('shade-checkbox input[type="checkbox"]')
      const targetCheckbox = allCheckboxes.nth(3)
      await expect(targetCheckbox).not.toBeChecked()
      await targetCheckbox.focus()
      await expect(targetCheckbox).toBeFocused()

      await page.keyboard.press('Space')
      await expect(targetCheckbox).toBeChecked()

      // Navigate between checkboxes with arrow keys
      const checkboxes = interactiveSection.locator('shade-checkbox input[type="checkbox"]')
      const count = await checkboxes.count()
      expect(count).toBeGreaterThanOrEqual(2)

      await checkboxes.first().focus()
      await expect(checkboxes.first()).toBeFocused()

      await page.keyboard.press('ArrowDown')
      await expect(checkboxes.nth(1)).toBeFocused()

      await page.keyboard.press('ArrowUp')
      await expect(checkboxes.first()).toBeFocused()

      // Switch editor layout buttons via arrow keys
      const editorSection = content.locator('.markdown-editor-section')
      const sideBySideButton = editorSection.getByRole('button', { name: 'Side by Side' })
      const tabsButton = editorSection.getByRole('button', { name: 'Tabs' })

      await sideBySideButton.focus()
      await expect(sideBySideButton).toBeFocused()

      await page.keyboard.press('ArrowRight')
      await expect(tabsButton).toBeFocused()

      await page.keyboard.press('Enter')

      const editor = editorSection.locator('shade-markdown-editor')
      const tabs = editor.locator('shade-tabs')
      await expect(tabs).toBeVisible()

      // Navigate editor tab buttons with arrow keys
      const editTab = editor.locator('.shade-tab-btn').first()
      const previewTab = editor.locator('.shade-tab-btn').nth(1)

      await editTab.focus()
      await expect(editTab).toBeFocused()

      await page.keyboard.press('ArrowRight')
      await expect(previewTab).toBeFocused()

      await page.keyboard.press('Enter')

      const display = editor.locator('shade-markdown-display')
      await expect(display).toBeVisible()

      // Text editing in textarea with arrow keys
      const textarea = content.locator('shade-markdown-input textarea').first()
      await textarea.focus()
      await expect(textarea).toBeFocused()

      await page.keyboard.press('ArrowRight')
      await expect(textarea).toBeFocused()

      await page.keyboard.press('ArrowDown')
      await expect(textarea).toBeFocused()
    })
  })
})
