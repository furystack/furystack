import { expect, test } from '@playwright/test'

test.describe('InputNumber', () => {
  test('should render the page with all sections', async ({ page }) => {
    await page.goto('/inputs-and-forms/input-number')

    const content = page.locator('input-number-page')
    await content.waitFor({ state: 'visible' })

    await expect(content.locator('shade-page-header')).toBeVisible()
    await expect(content.getByRole('heading', { name: 'Basic' })).toBeVisible()
    await expect(content.getByRole('heading', { name: 'Min / Max / Step' })).toBeVisible()
    await expect(content.getByRole('heading', { name: 'Precision' })).toBeVisible()
    await expect(content.getByRole('heading', { name: 'Formatter / Parser' })).toBeVisible()
  })

  test('should increment and decrement values with buttons', async ({ page }) => {
    await page.goto('/inputs-and-forms/input-number')

    const content = page.locator('input-number-page')
    await content.waitFor({ state: 'visible' })

    const firstInputNumber = content.locator('shade-input-number').first()
    const input = firstInputNumber.locator('input')
    const buttons = firstInputNumber.locator('.step-button')

    const initialValue = await input.inputValue()
    const initialNum = Number(initialValue)

    // Click increment
    await buttons.nth(1).click()
    await expect(input).toHaveValue(String(initialNum + 1))

    // Click decrement
    await buttons.nth(0).click()
    await expect(input).toHaveValue(String(initialNum))
  })

  test('should support keyboard navigation with ArrowUp and ArrowDown', async ({ page }) => {
    await page.goto('/inputs-and-forms/input-number')

    const content = page.locator('input-number-page')
    await content.waitFor({ state: 'visible' })

    const firstInputNumber = content.locator('shade-input-number').first()
    const input = firstInputNumber.locator('input')

    const initialValue = await input.inputValue()
    const initialNum = Number(initialValue)

    await input.focus()
    await page.keyboard.press('ArrowUp')
    await expect(input).toHaveValue(String(initialNum + 1))

    await page.keyboard.press('ArrowDown')
    await expect(input).toHaveValue(String(initialNum))
  })

  test('should not allow interaction on disabled input', async ({ page }) => {
    await page.goto('/inputs-and-forms/input-number')

    const content = page.locator('input-number-page')
    await content.waitFor({ state: 'visible' })

    // Find the disabled input number in the "Disabled & Read-only" section
    const disabledSection = content.locator('shade-input-number[data-disabled]').first()
    await expect(disabledSection).toBeVisible()

    const buttons = disabledSection.locator('.step-button')
    await expect(buttons.nth(0)).toBeDisabled()
    await expect(buttons.nth(1)).toBeDisabled()
  })

  test('should display formatted values with currency formatter', async ({ page }) => {
    await page.goto('/inputs-and-forms/input-number')

    const content = page.locator('input-number-page')
    await content.waitFor({ state: 'visible' })

    // Find the Currency InputNumber in the Formatter / Parser section
    const formatterSection = content.getByRole('heading', { name: 'Formatter / Parser' })
    await expect(formatterSection).toBeVisible()

    // The currency input should contain a $ sign
    const currencyInput = content.locator('shade-input-number').filter({ hasText: 'Currency' }).locator('input')
    const value = await currencyInput.inputValue()
    expect(value).toContain('$')
  })
})
