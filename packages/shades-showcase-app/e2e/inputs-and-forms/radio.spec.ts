import { expect, test } from '@playwright/test'

test.describe('Radio', () => {
  test('should select radio options and update display', async ({ page }) => {
    await page.goto('/inputs-and-forms/radio')

    const content = page.locator('radio-page')
    await content.waitFor({ state: 'visible' })

    // In the "RadioGroup (Vertical)" section, the default value is "blue"
    await expect(content.getByText('blue (default)')).toBeVisible()

    // Select "Red" radio by clicking its label
    const redRadio = content.getByRole('radio', { name: 'Red' }).first()
    await redRadio.check()

    // Red should now be checked
    await expect(redRadio).toBeChecked()

    // Select "Green"
    const greenRadio = content.getByRole('radio', { name: 'Green' }).first()
    await greenRadio.check()

    // Red should now be deselected, green should be selected
    await expect(redRadio).not.toBeChecked()
    await expect(greenRadio).toBeChecked()
  })

  test('should select options in horizontal radio group', async ({ page }) => {
    await page.goto('/inputs-and-forms/radio')

    const content = page.locator('radio-page')
    await content.waitFor({ state: 'visible' })

    // In the "RadioGroup (Horizontal)" section, select "Medium"
    const mediumRadio = content.getByRole('radio', { name: 'Medium' })
    await mediumRadio.check()
    await expect(mediumRadio).toBeChecked()
  })

  test('should not allow selecting disabled radio buttons', async ({ page }) => {
    await page.goto('/inputs-and-forms/radio')

    const content = page.locator('radio-page')
    await content.waitFor({ state: 'visible' })

    // Find the disabled "Disabled unchecked" radio
    const disabledRadio = content.getByRole('radio', { name: 'Disabled unchecked' })
    await expect(disabledRadio).toBeDisabled()
  })
})
