import { expect, test } from '@playwright/test'

test.describe('Rating', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/inputs-and-forms/rating')
    const content = page.locator('rating-page')
    await content.waitFor({ state: 'visible' })
  })

  test('should render the page with star ratings', async ({ page }) => {
    const content = page.locator('rating-page')

    // Page header
    await expect(content.getByRole('heading', { name: 'Rating', level: 2 })).toBeVisible()

    // Section headings
    await expect(content.getByRole('heading', { name: 'Basic' })).toBeVisible()
    await expect(content.getByRole('heading', { name: 'Interactive' })).toBeVisible()
    await expect(content.getByRole('heading', { name: 'Disabled' })).toBeVisible()

    // First rating should have 5 stars
    const firstRating = content.locator('shade-rating').first()
    const stars = firstRating.locator('.rating-star')
    await expect(stars).toHaveCount(5)
  })

  test('should allow clicking to change rating value', async ({ page }) => {
    const content = page.locator('rating-page')

    // The interactive rating is the last one and has precision=0.5
    const interactiveRating = content.locator('shade-rating').last()
    const stars = interactiveRating.locator('.rating-star')

    // Click the right side of the 5th star to set value to 5
    const fifthStar = stars.nth(4)
    await fifthStar.click({ position: { x: 20, y: 10 } })

    await expect(content.getByText('Value: 5')).toBeVisible()
  })

  test('should support half-star precision when clicking left half', async ({ page }) => {
    const content = page.locator('rating-page')

    const interactiveRating = content.locator('shade-rating').last()
    const stars = interactiveRating.locator('.rating-star')

    // Click the left side of the 2nd star (should give 1.5)
    const secondStar = stars.nth(1)
    await secondStar.click({ position: { x: 2, y: 10 } })

    await expect(content.getByText('Value: 1.5')).toBeVisible()
  })

  test('should support keyboard navigation', async ({ page }) => {
    const content = page.locator('rating-page')

    const interactiveRating = content.locator('shade-rating').last()
    await interactiveRating.focus()

    // Initial value is 3, press ArrowRight to increase by 0.5
    await page.keyboard.press('ArrowRight')
    await expect(content.getByText('Value: 3.5')).toBeVisible()

    // Press ArrowLeft to decrease by 0.5
    await page.keyboard.press('ArrowLeft')
    await expect(content.getByText('Value: 3')).toBeVisible()
  })

  test('should render disabled and read-only states', async ({ page }) => {
    const content = page.locator('rating-page')

    const disabledRating = content.locator('shade-rating[data-disabled]')
    await expect(disabledRating).toBeVisible()
    await expect(disabledRating).toHaveAttribute('aria-disabled', 'true')

    const readonlyRating = content.locator('shade-rating[data-readonly]').first()
    await expect(readonlyRating).toBeVisible()
    await expect(readonlyRating).toHaveAttribute('role', 'img')
  })
})
