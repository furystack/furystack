import { expect, test } from '@playwright/test'

test.describe('Radio', () => {
  test('select options in vertical and horizontal groups, and verify disabled state', async ({ page }) => {
    await page.goto('/inputs-and-forms/radio')

    const content = page.locator('radio-page')
    await content.waitFor({ state: 'visible' })

    // Vertical group: select options
    await expect(content.getByText('blue (default)')).toBeVisible()
    const redRadio = content.getByRole('radio', { name: 'Red' }).first()
    await redRadio.check()
    await expect(redRadio).toBeChecked()

    const greenRadio = content.getByRole('radio', { name: 'Green' }).first()
    await greenRadio.check()
    await expect(redRadio).not.toBeChecked()
    await expect(greenRadio).toBeChecked()

    // Horizontal group: select option
    const mediumRadio = content.getByRole('radio', { name: 'Medium' })
    await mediumRadio.check()
    await expect(mediumRadio).toBeChecked()

    // Disabled radio
    const disabledRadio = content.getByRole('radio', { name: 'Disabled unchecked' })
    await expect(disabledRadio).toBeDisabled()
  })
})
