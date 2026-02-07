import { expect, test } from '@playwright/test'

test.describe('Checkboxes', () => {
  test('should toggle a checkbox on and off', async ({ page }) => {
    await page.goto('/inputs-and-forms/checkboxes')

    const content = page.locator('checkboxes-page')
    await content.waitFor({ state: 'visible' })

    // Find the "Unchecked" checkbox by its exact label
    const uncheckedCheckbox = content.getByRole('checkbox', { name: 'Unchecked', exact: true })
    await expect(uncheckedCheckbox).not.toBeChecked()

    // Click to check
    await uncheckedCheckbox.click()
    await expect(uncheckedCheckbox).toBeChecked()

    // Click again to uncheck
    await uncheckedCheckbox.click()
    await expect(uncheckedCheckbox).not.toBeChecked()
  })

  test('should disable all checkboxes with the master toggle', async ({ page }) => {
    await page.goto('/inputs-and-forms/checkboxes')

    const content = page.locator('checkboxes-page')
    await content.waitFor({ state: 'visible' })

    // The "Unchecked" checkbox in the Basic section should be enabled initially
    const basicCheckbox = content.getByRole('checkbox', { name: 'Unchecked', exact: true })
    await expect(basicCheckbox).toBeEnabled()

    // Find and click the master toggle (at the bottom, "Disable all checkboxes above")
    const masterToggle = content.getByRole('checkbox', { name: /Disable all checkboxes above/ })
    await masterToggle.click()

    // The basic checkbox should now be disabled
    await expect(basicCheckbox).toBeDisabled()

    // Click master toggle again to re-enable
    const reEnableToggle = content.getByRole('checkbox', { name: /Enable all checkboxes above/ })
    await reEnableToggle.click()

    // The basic checkbox should be enabled again
    await expect(basicCheckbox).toBeEnabled()
  })
})
