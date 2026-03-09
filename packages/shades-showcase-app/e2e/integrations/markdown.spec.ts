import { expect, test } from '@playwright/test'

test.describe('Markdown', () => {
  test('should render the Markdown showcase page', async ({ page }) => {
    await page.goto('/integrations/markdown')

    const content = page.locator('shades-markdown-page')
    await content.waitFor({ state: 'visible' })

    const pageHeader = page.locator('shade-page-header')
    await expect(pageHeader).toBeVisible()
    await expect(pageHeader).toContainText('Markdown')
  })

  test('should render MarkdownDisplay with headings and lists', async ({ page }) => {
    await page.goto('/integrations/markdown')

    const content = page.locator('shades-markdown-page')
    await content.waitFor({ state: 'visible' })

    // Verify headings are rendered
    const heading = content.locator('shade-markdown-display [is^="shade-typography"][data-variant="h1"]').first()
    await expect(heading).toBeVisible()
    await expect(heading).toContainText('Markdown Components')

    // Verify code blocks
    const codeBlock = content.locator('shade-markdown-display .md-code-block').first()
    await expect(codeBlock).toBeVisible()

    // Verify links
    const link = content.locator('shade-markdown-display .md-link').first()
    await expect(link).toBeVisible()

    // Verify blockquote
    const blockquote = content.locator('shade-markdown-display .md-blockquote').first()
    await expect(blockquote).toBeVisible()
  })

  test('should allow toggling interactive checkboxes', async ({ page }) => {
    await page.goto('/integrations/markdown')

    const content = page.locator('shades-markdown-page')
    await content.waitFor({ state: 'visible' })

    // Find the interactive checkboxes section (second display with readOnly=false)
    const interactiveSection = content.locator('shade-markdown-display').nth(1)
    await expect(interactiveSection).toBeVisible()

    // Find an unchecked checkbox and click it
    const uncheckedCheckbox = interactiveSection.locator('shade-checkbox input[type="checkbox"]:not(:checked)').first()
    await expect(uncheckedCheckbox).toBeVisible()
    await uncheckedCheckbox.click()
  })

  test('should render MarkdownEditor with layout switching', async ({ page }) => {
    await page.goto('/integrations/markdown')

    const content = page.locator('shades-markdown-page')
    await content.waitFor({ state: 'visible' })

    const editorSection = content.locator('.markdown-editor-section')
    await expect(editorSection).toBeVisible()

    // Verify the editor renders (side-by-side by default)
    const editor = editorSection.locator('shade-markdown-editor')
    await expect(editor).toBeVisible()

    // Verify both input and display panes exist
    const input = editor.locator('shade-markdown-input')
    await expect(input).toBeVisible()

    const display = editor.locator('shade-markdown-display')
    await expect(display).toBeVisible()

    // Switch to tabs layout
    const tabsButton = editorSection.getByRole('button', { name: 'Tabs' })
    await tabsButton.click()

    // Verify tabs are rendered
    const tabs = editor.locator('shade-tabs')
    await expect(tabs).toBeVisible()

    // Switch to above-below layout
    const aboveBelowButton = editorSection.getByRole('button', { name: 'Above / Below' })
    await aboveBelowButton.click()

    // Verify split layout is shown again with above-below direction
    const split = editor.locator('.md-editor-split[data-layout="above-below"]')
    await expect(split).toBeVisible()
  })

  test('should render MarkdownInput with textarea', async ({ page }) => {
    await page.goto('/integrations/markdown')

    const content = page.locator('shades-markdown-page')
    await content.waitFor({ state: 'visible' })

    const textarea = content.locator('shade-markdown-input textarea').first()
    await expect(textarea).toBeVisible()
  })

  test.describe('keyboard navigation', () => {
    test.skip(({ isMobile }) => isMobile, 'Desktop-only tests (requires keyboard interaction)')

    test('should navigate to and focus links via Tab key', async ({ page }) => {
      await page.goto('/integrations/markdown')

      const content = page.locator('shades-markdown-page')
      await content.waitFor({ state: 'visible' })

      const firstLink = content.locator('shade-markdown-display .md-link').first()
      await firstLink.focus()
      await expect(firstLink).toBeFocused()
    })

    test('should focus code blocks via keyboard', async ({ page }) => {
      await page.goto('/integrations/markdown')

      const content = page.locator('shades-markdown-page')
      await content.waitFor({ state: 'visible' })

      const codeBlock = content.locator('shade-markdown-display .md-code-block').first()
      await expect(codeBlock).toHaveAttribute('tabindex', '0')
      await codeBlock.focus()
      await expect(codeBlock).toBeFocused()
    })

    test('should toggle checkbox via keyboard', async ({ page }) => {
      await page.goto('/integrations/markdown')

      const content = page.locator('shades-markdown-page')
      await content.waitFor({ state: 'visible' })

      const interactiveSection = content.locator('shade-markdown-display').nth(1)
      await expect(interactiveSection).toBeVisible()

      const allCheckboxes = interactiveSection.locator('shade-checkbox input[type="checkbox"]')
      const targetCheckbox = allCheckboxes.nth(3)
      await expect(targetCheckbox).not.toBeChecked()
      await targetCheckbox.focus()
      await expect(targetCheckbox).toBeFocused()

      await page.keyboard.press('Space')
      await expect(targetCheckbox).toBeChecked()
    })

    test('should navigate between checkboxes with arrow keys', async ({ page }) => {
      await page.goto('/integrations/markdown')

      const content = page.locator('shades-markdown-page')
      await content.waitFor({ state: 'visible' })

      const interactiveSection = content.locator('shade-markdown-display').nth(1)
      const checkboxes = interactiveSection.locator('shade-checkbox input[type="checkbox"]')
      const count = await checkboxes.count()
      expect(count).toBeGreaterThanOrEqual(2)

      await checkboxes.first().focus()
      await expect(checkboxes.first()).toBeFocused()

      await page.keyboard.press('ArrowDown')
      await expect(checkboxes.nth(1)).toBeFocused()

      await page.keyboard.press('ArrowUp')
      await expect(checkboxes.first()).toBeFocused()
    })

    test('should switch editor layout buttons via arrow keys', async ({ page }) => {
      await page.goto('/integrations/markdown')

      const content = page.locator('shades-markdown-page')
      await content.waitFor({ state: 'visible' })

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
    })

    test('should navigate editor tab buttons with arrow keys', async ({ page }) => {
      await page.goto('/integrations/markdown')

      const content = page.locator('shades-markdown-page')
      await content.waitFor({ state: 'visible' })

      const editorSection = content.locator('.markdown-editor-section')
      const tabsButton = editorSection.getByRole('button', { name: 'Tabs' })
      await tabsButton.click()

      const editor = editorSection.locator('shade-markdown-editor')
      const editTab = editor.locator('.shade-tab-btn').first()
      const previewTab = editor.locator('.shade-tab-btn').nth(1)

      await editTab.focus()
      await expect(editTab).toBeFocused()

      await page.keyboard.press('ArrowRight')
      await expect(previewTab).toBeFocused()

      await page.keyboard.press('Enter')

      const display = editor.locator('shade-markdown-display')
      await expect(display).toBeVisible()
    })

    test('should allow text editing in MarkdownInput textarea with arrow keys', async ({ page }) => {
      await page.goto('/integrations/markdown')

      const content = page.locator('shades-markdown-page')
      await content.waitFor({ state: 'visible' })

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
