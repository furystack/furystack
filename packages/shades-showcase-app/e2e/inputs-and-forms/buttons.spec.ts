import { expect, test } from '@playwright/test'

test.describe('Buttons', () => {
  test('should render all button variants', async ({ page }) => {
    await page.goto('/inputs-and-forms/buttons')

    const content = page.locator('buttons-page')
    await content.waitFor({ state: 'visible' })

    // Page header should be visible
    await expect(content.locator('shade-page-header')).toBeVisible()

    // Should have 16 "Button Text" buttons (4 colors x 4 variants: default, outlined, contained, text)
    const buttons = content.getByRole('button', { name: 'Button Text' })
    await expect(buttons.first()).toBeVisible()
    const buttonCount = await buttons.count()
    expect(buttonCount).toBe(16)
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

  test('should render size variants', async ({ page }) => {
    await page.goto('/inputs-and-forms/buttons')

    const content = page.locator('buttons-page')
    await content.waitFor({ state: 'visible' })

    await expect(content.getByRole('button', { name: 'Small' }).first()).toBeVisible()
    await expect(content.getByRole('button', { name: 'Medium' }).first()).toBeVisible()
    await expect(content.getByRole('button', { name: 'Large' }).first()).toBeVisible()
  })

  test('should render danger buttons', async ({ page }) => {
    await page.goto('/inputs-and-forms/buttons')

    const content = page.locator('buttons-page')
    await content.waitFor({ state: 'visible' })

    await expect(content.getByRole('button', { name: 'Danger Text' })).toBeVisible()
    await expect(content.getByRole('button', { name: 'Danger Outlined' })).toBeVisible()
    await expect(content.getByRole('button', { name: 'Danger Contained' })).toBeVisible()
  })

  test('should render loading buttons as disabled', async ({ page }) => {
    await page.goto('/inputs-and-forms/buttons')

    const content = page.locator('buttons-page')
    await content.waitFor({ state: 'visible' })

    const loadingButtons = content.getByRole('button', { name: 'Loading' })
    await expect(loadingButtons.first()).toBeVisible()

    const count = await loadingButtons.count()
    expect(count).toBe(4)

    // All loading buttons should be disabled
    for (let i = 0; i < count; i++) {
      await expect(loadingButtons.nth(i)).toBeDisabled()
    }

    // Loading buttons should contain a spinner element
    const spinner = loadingButtons.first().locator('.shade-btn-spinner')
    await expect(spinner).toBeVisible()
  })

  test('should render buttons with icons', async ({ page }) => {
    await page.goto('/inputs-and-forms/buttons')

    const content = page.locator('buttons-page')
    await content.waitFor({ state: 'visible' })

    await expect(content.getByRole('button', { name: 'Start Icon' })).toBeVisible()
    await expect(content.getByRole('button', { name: 'End Icon' })).toBeVisible()
    await expect(content.getByRole('button', { name: 'Both Icons' })).toBeVisible()

    // Start Icon button should have the icon wrapper
    const startIconBtn = content.getByRole('button', { name: 'Start Icon' })
    await expect(startIconBtn.locator('.shade-btn-start-icon')).toBeVisible()

    // End Icon button should have the icon wrapper
    const endIconBtn = content.getByRole('button', { name: 'End Icon' })
    await expect(endIconBtn.locator('.shade-btn-end-icon')).toBeVisible()

    // Both Icons button should have both wrappers
    const bothIconsBtn = content.getByRole('button', { name: 'Both Icons' })
    await expect(bothIconsBtn.locator('.shade-btn-start-icon')).toBeVisible()
    await expect(bothIconsBtn.locator('.shade-btn-end-icon')).toBeVisible()
  })
})
