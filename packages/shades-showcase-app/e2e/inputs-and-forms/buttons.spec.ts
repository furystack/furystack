import { expect, test } from '@playwright/test'

test.describe('Buttons', () => {
  test('rendering: variants, sizes, danger, loading, and icons', async ({ page }) => {
    await page.goto('/inputs-and-forms/buttons')

    const content = page.locator('buttons-page')
    await content.waitFor({ state: 'visible' })

    // Verify all button variants
    await expect(content.locator('shade-page-header')).toBeVisible()
    const buttons = content.getByRole('button', { name: 'Button Text' })
    await expect(buttons.first()).toBeVisible()
    const buttonCount = await buttons.count()
    expect(buttonCount).toBe(16)

    // Verify size variants
    await expect(content.getByRole('button', { name: 'Small' }).first()).toBeVisible()
    await expect(content.getByRole('button', { name: 'Medium' }).first()).toBeVisible()
    await expect(content.getByRole('button', { name: 'Large' }).first()).toBeVisible()

    // Verify danger buttons
    await expect(content.getByRole('button', { name: 'Danger Text' })).toBeVisible()
    await expect(content.getByRole('button', { name: 'Danger Outlined' })).toBeVisible()
    await expect(content.getByRole('button', { name: 'Danger Contained' })).toBeVisible()

    // Verify loading buttons are disabled with spinner
    const loadingButtons = content.getByRole('button', { name: 'Loading' })
    await expect(loadingButtons.first()).toBeVisible()
    const loadingCount = await loadingButtons.count()
    expect(loadingCount).toBe(4)
    for (let i = 0; i < loadingCount; i++) {
      await expect(loadingButtons.nth(i)).toBeDisabled()
    }
    const spinner = loadingButtons.first().locator('.shade-btn-spinner')
    await expect(spinner).toBeVisible()

    // Verify buttons with icons
    await expect(content.getByRole('button', { name: 'Start Icon' })).toBeVisible()
    await expect(content.getByRole('button', { name: 'End Icon' })).toBeVisible()
    await expect(content.getByRole('button', { name: 'Both Icons' })).toBeVisible()

    const startIconBtn = content.getByRole('button', { name: 'Start Icon' })
    await expect(startIconBtn.locator('.shade-btn-start-icon')).toBeVisible()
    const endIconBtn = content.getByRole('button', { name: 'End Icon' })
    await expect(endIconBtn.locator('.shade-btn-end-icon')).toBeVisible()
    const bothIconsBtn = content.getByRole('button', { name: 'Both Icons' })
    await expect(bothIconsBtn.locator('.shade-btn-start-icon')).toBeVisible()
    await expect(bothIconsBtn.locator('.shade-btn-end-icon')).toBeVisible()
  })

  test('interaction: toggle disabled state', async ({ page }) => {
    await page.goto('/inputs-and-forms/buttons')

    const content = page.locator('buttons-page')
    await content.waitFor({ state: 'visible' })

    const firstButton = content.getByRole('button', { name: 'Button Text' }).first()
    await expect(firstButton).toBeDisabled()

    const toggleButton = content.getByRole('button', { name: 'Disable All' })
    await toggleButton.click()
    await expect(firstButton).toBeEnabled()

    await expect(content.getByRole('button', { name: 'Custom Style' })).toBeVisible()
  })
})
