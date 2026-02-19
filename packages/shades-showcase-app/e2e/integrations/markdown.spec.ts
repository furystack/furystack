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
    const heading = content.locator('shade-markdown-display shade-typography[data-variant="h1"]').first()
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

    // Verify the editor renders (side-by-side by default)
    const editor = content.locator('shade-markdown-editor')
    await expect(editor).toBeVisible()

    // Verify both input and display panes exist
    const input = editor.locator('shade-markdown-input')
    await expect(input).toBeVisible()

    const display = editor.locator('shade-markdown-display')
    await expect(display).toBeVisible()

    // Switch to tabs layout
    const tabsButton = content.getByRole('button', { name: 'Tabs' })
    await tabsButton.click()

    // Verify tabs are rendered
    const tabs = editor.locator('shade-tabs')
    await expect(tabs).toBeVisible()

    // Switch to above-below layout
    const aboveBelowButton = content.getByRole('button', { name: 'Above / Below' })
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
})
