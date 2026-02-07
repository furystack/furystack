import { expect, test } from '@playwright/test'

test.describe('List', () => {
  test('should render basic and multi-select lists', async ({ page }) => {
    await page.goto('/data-display/list')

    const content = page.locator('shades-list-page')
    await content.waitFor({ state: 'visible' })

    // Check section headings
    await expect(content.locator('h3', { hasText: 'Basic List' })).toBeVisible()
    await expect(content.locator('h3', { hasText: 'Multi-select List' })).toBeVisible()

    // Check that list items are rendered (using role-based selectors)
    const basicList = content.getByRole('listbox').first()
    await expect(basicList).toBeVisible()
    const options = basicList.getByRole('option')
    await expect(options).toHaveCount(5)
  })

  test('should support keyboard navigation in list', async ({ page }) => {
    await page.goto('/data-display/list')

    const content = page.locator('shades-list-page')
    await content.waitFor({ state: 'visible' })

    // Click the first option in the basic list to focus
    const basicList = content.getByRole('listbox').first()
    const firstOption = basicList.getByRole('option').first()
    await firstOption.click()

    // Navigate down with keyboard
    await page.keyboard.press('ArrowDown')

    // The second option should now be focused
    const secondOption = basicList.getByRole('option').nth(1)
    await expect(secondOption).toHaveClass(/focused/)
  })

  test('should track selection count in multi-select list', async ({ page }) => {
    await page.goto('/data-display/list')

    const content = page.locator('shades-list-page')
    await content.waitFor({ state: 'visible' })

    const selectionCount = content.locator('shades-selection-count-display')
    await expect(selectionCount).toContainText('Selected: 0 item(s)')

    // Click items in the multi-select list (second listbox)
    const multiSelectList = content.getByRole('listbox').nth(1)
    const options = multiSelectList.getByRole('option')
    await options.first().click({ modifiers: ['Control'] })
    await expect(selectionCount).toContainText('Selected: 1 item(s)')

    await options.nth(1).click({ modifiers: ['Control'] })
    await expect(selectionCount).toContainText('Selected: 2 item(s)')
  })
})
