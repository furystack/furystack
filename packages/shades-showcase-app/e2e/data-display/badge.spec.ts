import { expect, test } from '@playwright/test'

test.describe('Badge', () => {
  test('should increment and decrement badge count', async ({ page }) => {
    await page.goto('/data-display/badge')

    const content = page.locator('shades-badge-page')
    await content.waitFor({ state: 'visible' })

    // Initial count is 5
    const countDisplay = content.locator('span:has-text("5")').first()
    await expect(countDisplay).toBeVisible()

    // Click "+" to increment
    const plusButton = content.getByRole('button', { name: '+' })
    await plusButton.click()

    // Count should now be 6
    await expect(content.locator('span').filter({ hasText: '6' }).first()).toBeVisible()

    // Click "-" to decrement twice
    const minusButton = content.getByRole('button', { name: '-' })
    await minusButton.click()
    await minusButton.click()

    // Count should now be 4
    await expect(content.locator('span').filter({ hasText: '4' }).first()).toBeVisible()
  })

  test('should display max value when count exceeds it', async ({ page }) => {
    await page.goto('/data-display/badge')

    const content = page.locator('shades-badge-page')
    await content.waitFor({ state: 'visible' })

    // The "Maximum value" section has a badge with count=100 which should show "99+"
    const maxSection = content.locator('h3:has-text("Maximum value")')
    await expect(maxSection).toBeVisible()

    // Badge with count=1000 and max=999 should show "999+"
    await expect(content.getByText('999+', { exact: true })).toBeVisible()
    // Badge with count=100 (default max=99) should show "99+"
    await expect(content.getByText('99+', { exact: true })).toBeVisible()
  })

  test('should render dot variant badges', async ({ page }) => {
    await page.goto('/data-display/badge')

    const content = page.locator('shades-badge-page')
    await content.waitFor({ state: 'visible' })

    const dotSection = content.locator('h3:has-text("Dot variant")')
    await expect(dotSection).toBeVisible()

    // Dot variant badges should exist in that section
    const dotBadges = dotSection.locator('~ div shade-badge').first()
    await expect(dotBadges).toBeVisible()
  })
})
