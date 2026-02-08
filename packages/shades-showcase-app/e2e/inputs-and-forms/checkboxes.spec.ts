import { expect, test } from '@playwright/test'

test.describe('Checkboxes', () => {
  test('toggle checkbox and master disable/enable toggle', async ({ page }) => {
    await page.goto('/inputs-and-forms/checkboxes')

    const content = page.locator('checkboxes-page')
    await content.waitFor({ state: 'visible' })

    // Toggle checkbox on and off
    const uncheckedCheckbox = content.getByRole('checkbox', { name: 'Unchecked', exact: true })
    await expect(uncheckedCheckbox).not.toBeChecked()
    await uncheckedCheckbox.click()
    await expect(uncheckedCheckbox).toBeChecked()
    await uncheckedCheckbox.click()
    await expect(uncheckedCheckbox).not.toBeChecked()

    // Master disable toggle
    const basicCheckbox = content.getByRole('checkbox', { name: 'Unchecked', exact: true })
    await expect(basicCheckbox).toBeEnabled()
    const masterToggle = content.getByRole('checkbox', { name: /Disable all checkboxes above/ })
    await masterToggle.click()
    await expect(basicCheckbox).toBeDisabled()

    // Re-enable
    const reEnableToggle = content.getByRole('checkbox', { name: /Enable all checkboxes above/ })
    await reEnableToggle.click()
    await expect(basicCheckbox).toBeEnabled()
  })
})
