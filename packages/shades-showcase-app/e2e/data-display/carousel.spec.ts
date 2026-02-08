import { expect, test } from '@playwright/test'

test.describe('Carousel', () => {
  test('should render the carousel with slides and dots', async ({ page }) => {
    await page.goto('/data-display/carousel')

    const content = page.locator('shades-carousel-page')
    await content.waitFor({ state: 'visible' })

    // Should have multiple carousels on the page
    const carousels = content.locator('shade-carousel')
    await expect(carousels.first()).toBeVisible()

    // First carousel should have dots
    const firstCarousel = carousels.first()
    const dots = firstCarousel.locator('.carousel-dot')
    await expect(dots).toHaveCount(4)
  })

  test('should navigate to next slide via next arrow', async ({ page }) => {
    await page.goto('/data-display/carousel')

    const content = page.locator('shades-carousel-page')
    await content.waitFor({ state: 'visible' })

    const firstCarousel = content.locator('shade-carousel').first()

    // First dot should be active initially
    const dots = firstCarousel.locator('.carousel-dot')
    await expect(dots.nth(0)).toHaveAttribute('data-active', '')

    // Click next arrow
    const nextButton = firstCarousel.locator('.carousel-arrow-next')
    await nextButton.click()

    // Second dot should now be active
    await expect(dots.nth(1)).toHaveAttribute('data-active', '')
    await expect(dots.nth(0)).not.toHaveAttribute('data-active')
  })

  test('should navigate to a specific slide via dot click', async ({ page }) => {
    await page.goto('/data-display/carousel')

    const content = page.locator('shades-carousel-page')
    await content.waitFor({ state: 'visible' })

    const firstCarousel = content.locator('shade-carousel').first()
    const dots = firstCarousel.locator('.carousel-dot')

    // Click on the third dot
    await dots.nth(2).click()

    // Third dot should be active
    await expect(dots.nth(2)).toHaveAttribute('data-active', '')
    await expect(dots.nth(0)).not.toHaveAttribute('data-active')
  })

  test('should navigate via previous arrow and wrap around', async ({ page }) => {
    await page.goto('/data-display/carousel')

    const content = page.locator('shades-carousel-page')
    await content.waitFor({ state: 'visible' })

    const firstCarousel = content.locator('shade-carousel').first()
    const dots = firstCarousel.locator('.carousel-dot')

    // Click prev arrow while on first slide — should wrap to last
    const prevButton = firstCarousel.locator('.carousel-arrow-prev')
    await prevButton.click()

    // Last dot (index 3) should be active
    await expect(dots.nth(3)).toHaveAttribute('data-active', '')
  })

  test('should render carousel without dots when configured', async ({ page }) => {
    await page.goto('/data-display/carousel')

    const content = page.locator('shades-carousel-page')
    await content.waitFor({ state: 'visible' })

    // The "Without dots" section
    const noDotHeader = content.locator('h3:has-text("Without dots")')
    await expect(noDotHeader).toBeVisible()

    // The carousel after the "Without dots" header should have no dots
    const carousels = content.locator('shade-carousel')
    // Fourth carousel (index 3) is the "without dots" one
    const noDotCarousel = carousels.nth(3)
    const dots = noDotCarousel.locator('.carousel-dot')
    await expect(dots).toHaveCount(0)
  })

  test('should render vertical carousel', async ({ page }) => {
    await page.goto('/data-display/carousel')

    const content = page.locator('shades-carousel-page')
    await content.waitFor({ state: 'visible' })

    const verticalHeader = content.locator('h3:has-text("Vertical")')
    await expect(verticalHeader).toBeVisible()

    // The vertical carousel should have the data-vertical attribute
    const verticalCarousel = content.locator('shade-carousel[data-vertical]')
    await expect(verticalCarousel).toBeVisible()
  })

  test('should have proper ARIA attributes', async ({ page }) => {
    await page.goto('/data-display/carousel')

    const content = page.locator('shades-carousel-page')
    await content.waitFor({ state: 'visible' })

    const firstCarousel = content.locator('shade-carousel').first()

    await expect(firstCarousel).toHaveAttribute('role', 'region')
    await expect(firstCarousel).toHaveAttribute('aria-roledescription', 'carousel')

    // Slides should have role="group" and aria-roledescription="slide"
    const slides = firstCarousel.locator('[role="group"]')
    await expect(slides.first()).toHaveAttribute('aria-roledescription', 'slide')
  })
})
