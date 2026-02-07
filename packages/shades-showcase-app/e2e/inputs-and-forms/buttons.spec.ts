import { expect, test } from '@playwright/test'

test.describe('Buttons', () => {
  test('should render all button variants', async ({ page }) => {
    await page.goto('/inputs-and-forms/buttons')

    const content = page.locator('buttons-page')
    await content.waitFor({ state: 'visible' })

    // Page header should be visible
    await expect(content.locator('shade-page-header')).toBeVisible()

    // Should have 12 "Button Text" buttons (4 colors x 3 variants) + "Disable All" + "Custom Style"
    const buttons = content.getByRole('button', { name: 'Button Text' })
    await expect(buttons.first()).toBeVisible()
    const buttonCount = await buttons.count()
    expect(buttonCount).toBe(12)
  })

  test('should toggle disabled state', async ({ page }) => {
    await page.goto('/inputs-and-forms/buttons')

    const content = page.locator('buttons-page')
    await content.waitFor({ state: 'visible' })

    // Initially buttons are disabled (isEnabled starts as false)
    const firstButton = content.getByRole('button', { name: 'Button Text' }).first()
    await expect(firstButton).toBeDisabled()

    // Click "Disable All" to toggle (enables them)
    const toggleButton = content.getByRole('button', { name: 'Disable All' })
    await toggleButton.click()

    // Buttons should now be enabled
    await expect(firstButton).toBeEnabled()

    // Custom Style button should always be visible
    await expect(content.getByRole('button', { name: 'Custom Style' })).toBeVisible()
  })
})
