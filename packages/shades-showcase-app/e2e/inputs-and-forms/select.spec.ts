import { expect, test } from '@playwright/test'

test.describe('Select', () => {
  test('single select: open, select, validate, disabled, and option groups', async ({ page }) => {
    await page.goto('/inputs-and-forms/select')

    const content = page.locator('select-page')
    await content.waitFor({ state: 'visible' })

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
  })

  test('multi select: select options, chips, remove chip, and check icons', async ({ page }) => {
    await page.goto('/inputs-and-forms/select')

    const content = page.locator('select-page')
    await content.waitFor({ state: 'visible' })

    // Select multiple options
    const multiSelect = content.locator('shade-select').filter({ hasText: 'Favorite Fruits' }).first()
    const trigger = multiSelect.locator('[role="combobox"]')
    await trigger.click()
    const listbox = multiSelect.locator('[role="listbox"]')
    await expect(listbox).toBeVisible()
    await listbox.getByRole('option', { name: 'Apple' }).click()
    await expect(listbox).toBeVisible()
    await listbox.getByRole('option', { name: 'Cherry' }).click()

    await expect(multiSelect.locator('.select-chip')).toHaveCount(2)
    await expect(multiSelect.locator('.select-chip').first()).toHaveText(/Apple/)
    await expect(multiSelect.locator('.select-chip').last()).toHaveText(/Cherry/)

    await expect(multiSelect).toHaveScreenshot('select-multi-chips.png')

    await page.locator('.dropdown-backdrop').click()
    await expect(multiSelect.locator('.helperText')).toHaveText('2 selected')

    // Remove a chip from pre-selected multi-select
    const colorsSelect = content.locator('shade-select').filter({ hasText: 'Colors (with disabled)' }).first()
    await expect(colorsSelect.locator('.select-chip')).toHaveCount(2)
    await colorsSelect.locator('.select-chip-remove').first().click()
    await expect(colorsSelect.locator('.select-chip')).toHaveCount(1)

    // Check icons in multi-select dropdown
    const colorsTrigger = colorsSelect.locator('[role="combobox"]')
    await colorsTrigger.click()
    const colorsListbox = colorsSelect.locator('[role="listbox"]')
    await expect(colorsListbox).toBeVisible()
    const selectedOptions = colorsListbox.locator('.dropdown-item[data-selected]')
    await expect(selectedOptions).toHaveCount(1)
    await expect(selectedOptions.first().locator('.check-icon shade-icon')).toBeVisible()
  })

  test('searchable select: filter options and no results', async ({ page }) => {
    await page.goto('/inputs-and-forms/select')

    const content = page.locator('select-page')
    await content.waitFor({ state: 'visible' })

    const searchSelect = content.locator('shade-select').filter({ hasText: 'Search Countries' }).first()
    const trigger = searchSelect.locator('[role="combobox"]')

    // Filter options
    await trigger.click()
    const listbox = searchSelect.locator('[role="listbox"]')
    await expect(listbox).toBeVisible()
    const searchInput = listbox.locator('.dropdown-search')
    await expect(searchInput).toBeVisible()
    await searchInput.fill('uni')

    const options = listbox.locator('.dropdown-item')
    await expect(options).toHaveCount(2)
    await expect(options.first()).toHaveText('United States')
    await expect(options.last()).toHaveText('United Kingdom')

    // No results
    await searchInput.fill('zzzzz')
    await expect(listbox.locator('.dropdown-no-results')).toHaveText('No results found')
  })
})
