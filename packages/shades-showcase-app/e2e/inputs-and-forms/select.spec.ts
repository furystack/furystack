import { expect, test } from '@playwright/test'

test.describe('Select', () => {
  test('should select an option from a dropdown', async ({ page }) => {
    await page.goto('/inputs-and-forms/select')

    const content = page.locator('select-page')
    await content.waitFor({ state: 'visible' })

    // Find the first select's combobox trigger
    const fruitTrigger = content.locator('shade-select').first().locator('[role="combobox"]')
    await expect(fruitTrigger).toBeVisible()

    // Click to open the dropdown
    await fruitTrigger.click()

    // The listbox should appear
    const listbox = content.locator('shade-select').first().locator('[role="listbox"]')
    await expect(listbox).toBeVisible()

    // Click "Cherry" option
    await listbox.getByRole('option', { name: 'Cherry' }).click()

    // The trigger should now display "Cherry"
    await expect(fruitTrigger.locator('.select-value')).toHaveText('Cherry')
  })

  test('should show validation error for banned option', async ({ page }) => {
    await page.goto('/inputs-and-forms/select')

    const content = page.locator('select-page')
    await content.waitFor({ state: 'visible' })

    // Find the "With Validation" select (first one)
    const validationSelect = content.locator('shade-select').filter({ hasText: 'With Validation' }).first()
    const trigger = validationSelect.locator('[role="combobox"]')

    // Open dropdown and select "Banana"
    await trigger.click()
    const listbox = validationSelect.locator('[role="listbox"]')
    await listbox.getByRole('option', { name: 'Banana' }).click()

    // Verify the validation error message appears
    await expect(content.getByText('Banana is not allowed!')).toBeVisible()
  })

  test('should not interact with disabled selects', async ({ page }) => {
    await page.goto('/inputs-and-forms/select')

    const content = page.locator('select-page')
    await content.waitFor({ state: 'visible' })

    // Find the "Disabled Select" element
    const disabledSelect = content.locator('shade-select').filter({ hasText: 'Disabled Select' }).first()

    // Verify it has the data-disabled attribute
    await expect(disabledSelect).toHaveAttribute('data-disabled', '')

    // The trigger should have tabIndex -1
    const trigger = disabledSelect.locator('[role="combobox"]')
    await expect(trigger).toHaveAttribute('tabindex', '-1')
  })

  test('should select multiple options in multi-select mode', async ({ page }) => {
    await page.goto('/inputs-and-forms/select')

    const content = page.locator('select-page')
    await content.waitFor({ state: 'visible' })

    // Find the first multi-select (Favorite Fruits)
    const multiSelect = content.locator('shade-select').filter({ hasText: 'Favorite Fruits' }).first()
    const trigger = multiSelect.locator('[role="combobox"]')

    // Open and select Apple
    await trigger.click()
    const listbox = multiSelect.locator('[role="listbox"]')
    await expect(listbox).toBeVisible()
    await listbox.getByRole('option', { name: 'Apple' }).click()

    // The dropdown should remain open in multi-select mode
    await expect(listbox).toBeVisible()

    // Select Cherry as well
    await listbox.getByRole('option', { name: 'Cherry' }).click()

    // Both should show as chips
    await expect(multiSelect.locator('.select-chip')).toHaveCount(2)
    await expect(multiSelect.locator('.select-chip').first()).toHaveText(/Apple/)
    await expect(multiSelect.locator('.select-chip').last()).toHaveText(/Cherry/)

    // Close dropdown
    await page.locator('.dropdown-backdrop').click()

    // The helper text should show "2 selected"
    await expect(multiSelect.locator('.helperText')).toHaveText('2 selected')
  })

  test('should remove a chip in multi-select mode', async ({ page }) => {
    await page.goto('/inputs-and-forms/select')

    const content = page.locator('select-page')
    await content.waitFor({ state: 'visible' })

    // Find the multi-select with pre-selected values (Colors with disabled)
    const multiSelect = content.locator('shade-select').filter({ hasText: 'Colors (with disabled)' }).first()

    // Should have 2 pre-selected chips (red, blue)
    await expect(multiSelect.locator('.select-chip')).toHaveCount(2)

    // Click the remove button on the first chip
    await multiSelect.locator('.select-chip-remove').first().click()

    // Should now have 1 chip
    await expect(multiSelect.locator('.select-chip')).toHaveCount(1)
  })

  test('should filter options in searchable select', async ({ page }) => {
    await page.goto('/inputs-and-forms/select')

    const content = page.locator('select-page')
    await content.waitFor({ state: 'visible' })

    // Find the Search Countries select
    const searchSelect = content.locator('shade-select').filter({ hasText: 'Search Countries' }).first()
    const trigger = searchSelect.locator('[role="combobox"]')

    // Open the dropdown
    await trigger.click()
    const listbox = searchSelect.locator('[role="listbox"]')
    await expect(listbox).toBeVisible()

    // Type in the search input
    const searchInput = listbox.locator('.dropdown-search')
    await expect(searchInput).toBeVisible()
    await searchInput.fill('uni')

    // Should filter to only "United States" and "United Kingdom"
    const options = listbox.locator('.dropdown-item')
    await expect(options).toHaveCount(2)
    await expect(options.first()).toHaveText('United States')
    await expect(options.last()).toHaveText('United Kingdom')
  })

  test('should show no results when search matches nothing', async ({ page }) => {
    await page.goto('/inputs-and-forms/select')

    const content = page.locator('select-page')
    await content.waitFor({ state: 'visible' })

    // Find the Search Countries select
    const searchSelect = content.locator('shade-select').filter({ hasText: 'Search Countries' }).first()
    const trigger = searchSelect.locator('[role="combobox"]')

    // Open and search for something that doesn't match
    await trigger.click()
    const listbox = searchSelect.locator('[role="listbox"]')
    const searchInput = listbox.locator('.dropdown-search')
    await searchInput.fill('zzzzz')

    // Should show "No results found"
    await expect(listbox.locator('.dropdown-no-results')).toHaveText('No results found')
  })

  test('should display option groups with headers', async ({ page }) => {
    await page.goto('/inputs-and-forms/select')

    const content = page.locator('select-page')
    await content.waitFor({ state: 'visible' })

    // Find the Food Category select (single with groups)
    const groupSelect = content.locator('shade-select').filter({ hasText: 'Food Category' }).first()
    const trigger = groupSelect.locator('[role="combobox"]')

    // Open dropdown
    await trigger.click()
    const listbox = groupSelect.locator('[role="listbox"]')
    await expect(listbox).toBeVisible()

    // Should have group labels
    const groupLabels = listbox.locator('.dropdown-group-label')
    await expect(groupLabels).toHaveCount(3)
    await expect(groupLabels.nth(0)).toHaveText('Fruits')
    await expect(groupLabels.nth(1)).toHaveText('Vegetables')
    await expect(groupLabels.nth(2)).toHaveText('Grains')

    // Should have all options
    const options = listbox.locator('.dropdown-item')
    await expect(options).toHaveCount(9)
  })

  test('should select from option groups', async ({ page }) => {
    await page.goto('/inputs-and-forms/select')

    const content = page.locator('select-page')
    await content.waitFor({ state: 'visible' })

    // Find the Food Category select
    const groupSelect = content.locator('shade-select').filter({ hasText: 'Food Category' }).first()
    const trigger = groupSelect.locator('[role="combobox"]')

    // Open and select Broccoli from the Vegetables group
    await trigger.click()
    const listbox = groupSelect.locator('[role="listbox"]')
    await listbox.getByRole('option', { name: 'Broccoli' }).click()

    // The trigger should display "Broccoli"
    await expect(trigger.locator('.select-value')).toHaveText('Broccoli')
  })

  test('should show check icons in multi-select mode', async ({ page }) => {
    await page.goto('/inputs-and-forms/select')

    const content = page.locator('select-page')
    await content.waitFor({ state: 'visible' })

    // Find the multi-select with pre-selected values
    const multiSelect = content.locator('shade-select').filter({ hasText: 'Colors (with disabled)' }).first()
    const trigger = multiSelect.locator('[role="combobox"]')

    // Open the dropdown
    await trigger.click()
    const listbox = multiSelect.locator('[role="listbox"]')
    await expect(listbox).toBeVisible()

    // Selected items should have check marks
    const selectedOptions = listbox.locator('.dropdown-item[data-selected]')
    await expect(selectedOptions).toHaveCount(2)
    await expect(selectedOptions.first().locator('.check-icon')).toHaveText('✓')
  })
})
