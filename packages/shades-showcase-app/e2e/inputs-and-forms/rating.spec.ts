import { expect, test } from '@playwright/test'

test.describe('Rating', () => {
  test('should display the correct number of stars', async ({ page }) => {
    await page.goto('/inputs-and-forms/rating')

    const content = page.locator('rating-page')
    await content.waitFor({ state: 'visible' })

    const firstRating = content.locator('shade-rating').first()
    const stars = firstRating.locator('.rating-star')
    await expect(stars).toHaveCount(5)
  })

  test('should show filled stars for the given value', async ({ page }) => {
    await page.goto('/inputs-and-forms/rating')

    const content = page.locator('rating-page')
    await content.waitFor({ state: 'visible' })

    // The Basic section has value=3, so first 3 stars should be filled
    const firstRating = content.locator('shade-rating').first()
    const filledSpans = firstRating.locator('.star-filled')

    for (let i = 0; i < 3; i++) {
      await expect(filledSpans.nth(i)).toHaveCSS('width', /.+/)
    }
  })

  test('should allow clicking to change rating in interactive mode', async ({ page }) => {
    await page.goto('/inputs-and-forms/rating')

    const content = page.locator('rating-page')
    await content.waitFor({ state: 'visible' })

    // The interactive rating is the last one on the page
    const interactiveRating = content.locator('shade-rating').last()
    const stars = interactiveRating.locator('.rating-star')

    // Click the 5th star (right side for full value)
    const fifthStar = stars.nth(4)
    const box = await fifthStar.boundingBox()
    if (box) {
      await page.mouse.click(box.x + box.width * 0.75, box.y + box.height / 2)
    }

    await expect(content.getByText('Value: 5')).toBeVisible()
  })

  test('should support half-star precision when clicking left half', async ({ page }) => {
    await page.goto('/inputs-and-forms/rating')

    const content = page.locator('rating-page')
    await content.waitFor({ state: 'visible' })

    // The interactive rating has precision=0.5
    const interactiveRating = content.locator('shade-rating').last()
    const stars = interactiveRating.locator('.rating-star')

    // Click the left half of the 2nd star
    const secondStar = stars.nth(1)
    const box = await secondStar.boundingBox()
    if (box) {
      await page.mouse.click(box.x + box.width * 0.25, box.y + box.height / 2)
    }

    await expect(content.getByText('Value: 1.5')).toBeVisible()
  })

  test('should support keyboard navigation', async ({ page }) => {
    await page.goto('/inputs-and-forms/rating')

    const content = page.locator('rating-page')
    await content.waitFor({ state: 'visible' })

    // Focus the interactive rating
    const interactiveRating = content.locator('shade-rating').last()
    await interactiveRating.focus()

    // Initial value is 3, press ArrowRight to increase by 0.5 (precision=0.5)
    await page.keyboard.press('ArrowRight')
    await expect(content.getByText('Value: 3.5')).toBeVisible()

    // Press ArrowLeft to decrease by 0.5
    await page.keyboard.press('ArrowLeft')
    await expect(content.getByText('Value: 3')).toBeVisible()
  })

  test('should have disabled state', async ({ page }) => {
    await page.goto('/inputs-and-forms/rating')

    const content = page.locator('rating-page')
    await content.waitFor({ state: 'visible' })

    const disabledRating = content.locator('shade-rating[data-disabled]')
    await expect(disabledRating).toBeVisible()
    await expect(disabledRating).toHaveAttribute('aria-disabled', 'true')
  })

  test('should have read-only state', async ({ page }) => {
    await page.goto('/inputs-and-forms/rating')

    const content = page.locator('rating-page')
    await content.waitFor({ state: 'visible' })

    const readonlyRating = content.locator('shade-rating[data-readonly]').first()
    await expect(readonlyRating).toBeVisible()
    await expect(readonlyRating).toHaveAttribute('role', 'img')
  })
})
