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
})
