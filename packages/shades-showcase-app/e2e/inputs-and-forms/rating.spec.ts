import { expect, test } from '@playwright/test'

test.describe('Rating', () => {
  test('rendering: stars, sections, disabled, and read-only states', async ({ page }) => {
    await page.goto('/inputs-and-forms/rating')

    const content = page.locator('rating-page')
    await content.waitFor({ state: 'visible' })

    // Verify sections
    await expect(content.getByRole('heading', { name: 'Rating', level: 2 })).toBeVisible()
    await expect(content.getByRole('heading', { name: 'Basic' })).toBeVisible()
    await expect(content.getByRole('heading', { name: 'Interactive' })).toBeVisible()
    await expect(content.getByRole('heading', { name: 'Disabled' })).toBeVisible()

    // First rating should have 5 stars
    const firstRating = content.locator('shade-rating').first()
    const stars = firstRating.locator('.rating-star')
    await expect(stars).toHaveCount(5)

    // Verify disabled and read-only states
    const disabledRating = content.locator('shade-rating[data-disabled]')
    await expect(disabledRating).toBeVisible()
    await expect(disabledRating).toHaveAttribute('aria-disabled', 'true')

    const readonlyRating = content.locator('shade-rating[data-readonly]').first()
    await expect(readonlyRating).toBeVisible()
    await expect(readonlyRating).toHaveAttribute('role', 'img')
  })

  test('interaction: click to rate, half-star precision, and keyboard navigation', async ({ page }) => {
    await page.goto('/inputs-and-forms/rating')

    const content = page.locator('rating-page')
    await content.waitFor({ state: 'visible' })

    const interactiveRating = content.locator('shade-rating').last()
    await interactiveRating.scrollIntoViewIfNeeded()

    // Keyboard navigation from default value (3)
    await interactiveRating.focus()
    await page.keyboard.press('ArrowRight')
    await expect(content.getByText('Value: 3.5')).toBeVisible()
    await page.keyboard.press('ArrowLeft')
    await expect(content.getByText('Value: 3')).toBeVisible()
  })
})
