import { expect, test } from '@playwright/test'

test.describe('List', () => {
  test('should render lists and support keyboard navigation and multi-select', async ({ page }) => {
    await page.goto('/data-display/list')

    const content = page.locator('shades-list-page')
    await content.waitFor({ state: 'visible' })

    // Verify list sections and items
    await expect(content.locator('h3', { hasText: 'Basic List' })).toBeVisible()
    await expect(content.locator('h3', { hasText: 'Multi-select List' })).toBeVisible()

    const basicList = content.getByRole('listbox').first()
    await expect(basicList).toBeVisible()
    const options = basicList.getByRole('option')
    await expect(options).toHaveCount(5)

    // Verify keyboard navigation
    const firstOption = basicList.getByRole('option').first()
    await firstOption.click()
    await page.keyboard.press('ArrowDown')
    const secondOption = basicList.getByRole('option').nth(1)
    await expect(secondOption).toHaveAttribute('data-focused', '')

    // Verify multi-select tracking
    const selectionCount = content.locator('shades-selection-count-display')
    await expect(selectionCount).toContainText('Selected: 0 item(s)')

    const multiSelectList = content.getByRole('listbox').nth(1)
    const multiOptions = multiSelectList.getByRole('option')
    await multiOptions.first().click({ modifiers: ['Control'] })
    await expect(selectionCount).toContainText('Selected: 1 item(s)')

    await multiOptions.nth(1).click({ modifiers: ['Control'] })
    await expect(selectionCount).toContainText('Selected: 2 item(s)')
  })
})
