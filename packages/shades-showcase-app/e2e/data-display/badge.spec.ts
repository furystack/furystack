import { expect, test } from '@playwright/test'

test.describe('Badge', () => {
  test('increment, decrement, max value, and dot variant', async ({ page }) => {
    await page.goto('/data-display/badge')

    const content = page.locator('shades-badge-page')
    await content.waitFor({ state: 'visible' })

    // Verify initial count and increment/decrement
    const countDisplay = content.locator('span:has-text("5")').first()
    await expect(countDisplay).toBeVisible()

    const plusButton = content.getByRole('button', { name: '+' })
    await plusButton.click()
    await expect(content.locator('span').filter({ hasText: '6' }).first()).toBeVisible()

    const minusButton = content.getByRole('button', { name: '-' })
    await minusButton.click()
    await minusButton.click()
    await expect(content.locator('span').filter({ hasText: '4' }).first()).toBeVisible()

    // Verify max value display
    const maxSection = content.locator('h3:has-text("Maximum value")')
    await expect(maxSection).toBeVisible()
    await expect(content.getByText('999+', { exact: true })).toBeVisible()
    await expect(content.getByText('99+', { exact: true })).toBeVisible()

    // Verify dot variant section exists
    await expect(content.getByRole('heading', { name: 'Dot variant' })).toBeVisible()
  })
})
