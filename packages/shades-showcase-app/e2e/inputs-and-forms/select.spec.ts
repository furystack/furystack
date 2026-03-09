import { expect, test } from '@playwright/test'

test.describe('Select', () => {
  test('single select, multi select, and searchable select', async ({ page, isMobile }) => {
    await page.goto('/inputs-and-forms/select')

    const content = page.locator('select-page')
    await content.waitFor({ state: 'visible' })

    // --- Single select ---

    // Select an option from a dropdown
    const fruitTrigger = content.locator('shade-select').first().locator('[role="combobox"]')
    await expect(fruitTrigger).toBeVisible()
    await fruitTrigger.click()

    const fruitListbox = content.locator('shade-select').first().locator('[role="listbox"]')
    await expect(fruitListbox).toBeVisible()
    await fruitListbox.getByRole('option', { name: 'Cherry' }).click()
    await expect(fruitTrigger.locator('.select-value')).toHaveText('Cherry')

    // Validation error for banned option
    const validationSelect = content.locator('shade-select').filter({ hasText: 'With Validation' }).first()
    const validationTrigger = validationSelect.locator('[role="combobox"]')
    await validationTrigger.click()
    const validationListbox = validationSelect.locator('[role="listbox"]')
    await validationListbox.getByRole('option', { name: 'Banana' }).click()
    await expect(content.getByText('Banana is not allowed!')).toBeVisible()

    // Disabled select
    const disabledSelect = content.locator('shade-select').filter({ hasText: 'Disabled Select' }).first()
    await expect(disabledSelect).toHaveAttribute('data-disabled', '')
    const disabledTrigger = disabledSelect.locator('[role="combobox"]')
    await expect(disabledTrigger).toHaveAttribute('tabindex', '-1')

    // Option groups with headers
    const groupSelect = content.locator('shade-select').filter({ hasText: 'Food Category' }).first()
    const groupTrigger = groupSelect.locator('[role="combobox"]')
    await groupTrigger.click()
    const groupListbox = groupSelect.locator('[role="listbox"]')
    await expect(groupListbox).toBeVisible()

    const groupLabels = groupListbox.locator('.dropdown-group-label')
    await expect(groupLabels).toHaveCount(3)
    await expect(groupLabels.nth(0)).toHaveText('Fruits')
    await expect(groupLabels.nth(1)).toHaveText('Vegetables')
    await expect(groupLabels.nth(2)).toHaveText('Grains')

    const groupOptions = groupListbox.locator('.dropdown-item')
    await expect(groupOptions).toHaveCount(9)

    // Select from group
    await groupListbox.getByRole('option', { name: 'Broccoli' }).click()
    await expect(groupTrigger.locator('.select-value')).toHaveText('Broccoli')

    // --- Multi select ---

    // Select multiple options
    const multiSelect = content.locator('shade-select').filter({ hasText: 'Favorite Fruits' }).first()
    const multiTrigger = multiSelect.locator('[role="combobox"]')
    await multiTrigger.click()
    const multiListbox = multiSelect.locator('[role="listbox"]')
    await expect(multiListbox).toBeVisible()
    await multiListbox.getByRole('option', { name: 'Apple' }).click()
    await expect(multiListbox).toBeVisible()
    await multiListbox.getByRole('option', { name: 'Cherry' }).click()

    await expect(multiSelect.locator('.select-chip')).toHaveCount(2)
    await expect(multiSelect.locator('.select-chip').first()).toHaveText(/Apple/)
    await expect(multiSelect.locator('.select-chip').last()).toHaveText(/Cherry/)

    await expect(multiSelect).toHaveScreenshot('select-multi-chips.png')

    await content.locator('.dropdown-backdrop').click()
    await expect(multiSelect.locator('.helperText')).toHaveText('2 selected')

    // Remove a chip from pre-selected multi-select
    const colorsSelect = content.locator('shade-select').filter({ hasText: 'Colors (with disabled)' }).first()
    await expect(colorsSelect.locator('.select-chip')).toHaveCount(2)
    await colorsSelect.locator('.select-chip-remove').first().click()
    await expect(colorsSelect.locator('.select-chip')).toHaveCount(1)

    // Check icons in multi-select dropdown (skip on mobile - dropdown overlay covers trigger)
    if (!isMobile) {
      const colorsTrigger = colorsSelect.locator('[role="combobox"]')
      await colorsSelect.scrollIntoViewIfNeeded()
      await colorsTrigger.click()
      const colorsListbox = colorsSelect.locator('[role="listbox"]')
      await expect(colorsListbox).toBeVisible({ timeout: 10000 })
      const selectedOptions = colorsListbox.locator('.dropdown-item[data-selected]')
      await expect(selectedOptions).toHaveCount(1)
      await expect(selectedOptions.first().locator('.check-icon shade-icon')).toBeVisible()
    }

    // --- Searchable select ---

    const searchSelect = content.locator('shade-select').filter({ hasText: 'Search Countries' }).first()
    const searchTrigger = searchSelect.locator('[role="combobox"]')

    // Filter options
    await searchTrigger.click()
    const searchListbox = searchSelect.locator('[role="listbox"]')
    await expect(searchListbox).toBeVisible()
    const searchInput = searchListbox.locator('.dropdown-search')
    await expect(searchInput).toBeVisible()
    await searchInput.fill('uni')

    const options = searchListbox.locator('.dropdown-item')
    await expect(options).toHaveCount(2)
    await expect(options.first()).toHaveText('United States')
    await expect(options.last()).toHaveText('United Kingdom')

    // No results
    await searchInput.fill('zzzzz')
    await expect(searchListbox.locator('.dropdown-no-results')).toHaveText('No results found')
  })
})
