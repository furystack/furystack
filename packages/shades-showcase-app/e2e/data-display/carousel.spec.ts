import { expect, test } from '@playwright/test'

test.describe('Carousel', () => {
  test('rendering: slides, dots, no-dots, vertical, and ARIA attributes', async ({ page }) => {
    await page.goto('/data-display/carousel')

    const content = page.locator('shades-carousel-page')
    await content.waitFor({ state: 'visible' })

    // Verify carousels render with dots
    const carousels = content.locator('shade-carousel')
    await expect(carousels.first()).toBeVisible()
    const firstCarousel = carousels.first()
    const dots = firstCarousel.locator('.carousel-dot')
    await expect(dots).toHaveCount(4)

    // Verify ARIA attributes
    await expect(firstCarousel).toHaveAttribute('role', 'region')
    await expect(firstCarousel).toHaveAttribute('aria-roledescription', 'carousel')
    const slides = firstCarousel.locator('[role="group"]')
    await expect(slides.first()).toHaveAttribute('aria-roledescription', 'slide')

    // Verify carousel without dots
    const noDotHeader = content.locator('h3:has-text("Without dots")')
    await expect(noDotHeader).toBeVisible()
    const noDotCarousel = carousels.nth(3)
    const noDots = noDotCarousel.locator('.carousel-dot')
    await expect(noDots).toHaveCount(0)

    // Verify vertical carousel
    const verticalHeader = content.locator('h3:has-text("Vertical")')
    await expect(verticalHeader).toBeVisible()
    const verticalCarousel = content.locator('shade-carousel[data-vertical]')
    await expect(verticalCarousel).toBeVisible()

    await expect(content).toHaveScreenshot('carousel-rendering.png')
  })

  test('navigation: next arrow, dot click, and previous arrow wrap-around', async ({ page }) => {
    await page.goto('/data-display/carousel')

    const content = page.locator('shades-carousel-page')
    await content.waitFor({ state: 'visible' })

    const firstCarousel = content.locator('shade-carousel').first()
    const dots = firstCarousel.locator('.carousel-dot')

    // First dot should be active initially
    await expect(dots.nth(0)).toHaveAttribute('data-active', '')

    // Navigate to next slide via arrow
    const nextButton = firstCarousel.locator('.carousel-arrow-next')
    await nextButton.click()
    await expect(dots.nth(1)).toHaveAttribute('data-active', '')
    await expect(dots.nth(0)).not.toHaveAttribute('data-active')

    // Navigate to specific slide via dot click
    await dots.nth(2).click()
    await expect(dots.nth(2)).toHaveAttribute('data-active', '')
    await expect(dots.nth(1)).not.toHaveAttribute('data-active')

    // Navigate back to first dot
    await dots.nth(0).click()
    await expect(dots.nth(0)).toHaveAttribute('data-active', '')

    // Previous arrow wrap-around from first slide
    const prevButton = firstCarousel.locator('.carousel-arrow-prev')
    await prevButton.click()
    await expect(dots.nth(3)).toHaveAttribute('data-active', '')

    await expect(firstCarousel).toHaveScreenshot('carousel-after-navigation.png')
  })
})
