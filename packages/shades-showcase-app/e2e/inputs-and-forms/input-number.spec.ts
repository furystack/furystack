import { expect, test } from '@playwright/test'

test.describe('InputNumber', () => {
  test('rendering: sections, interaction with buttons, keyboard, disabled, and formatter', async ({ page }) => {
    await page.goto('/inputs-and-forms/input-number')

    const content = page.locator('input-number-page')
    await content.waitFor({ state: 'visible' })

    // Verify all sections
    await expect(content.locator('shade-page-header')).toBeVisible()
    await expect(content.getByRole('heading', { name: 'Basic' })).toBeVisible()
    await expect(content.getByRole('heading', { name: 'Min / Max / Step' })).toBeVisible()
    await expect(content.getByRole('heading', { name: 'Precision' })).toBeVisible()
    await expect(content.getByRole('heading', { name: 'Formatter / Parser' })).toBeVisible()

    // Increment and decrement with buttons
    const firstInputNumber = content.locator('shade-input-number').first()
    const input = firstInputNumber.locator('input')
    const buttons = firstInputNumber.locator('.step-button')
    const initialValue = await input.inputValue()
    const initialNum = Number(initialValue)

    await buttons.nth(1).click()
    await expect(input).toHaveValue(String(initialNum + 1))
    await buttons.nth(0).click()
    await expect(input).toHaveValue(String(initialNum))

    // Keyboard navigation
    await input.focus()
    await page.keyboard.press('ArrowUp')
    await expect(input).toHaveValue(String(initialNum + 1))
    await page.keyboard.press('ArrowDown')
    await expect(input).toHaveValue(String(initialNum))

    // Disabled state
    const disabledSection = content.locator('shade-input-number[data-disabled]').first()
    await expect(disabledSection).toBeVisible()
    const disabledButtons = disabledSection.locator('.step-button')
    await expect(disabledButtons.nth(0)).toBeDisabled()
    await expect(disabledButtons.nth(1)).toBeDisabled()

    // Currency formatter
    const formatterSection = content.getByRole('heading', { name: 'Formatter / Parser' })
    await expect(formatterSection).toBeVisible()
    const currencyInput = content.locator('shade-input-number').filter({ hasText: 'Currency' }).locator('input')
    const value = await currencyInput.inputValue()
    expect(value).toContain('$')
  })
})
