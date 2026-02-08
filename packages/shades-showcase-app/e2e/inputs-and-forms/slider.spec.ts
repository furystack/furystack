import { expect, test } from '@playwright/test'

test.describe('Slider', () => {
  test('should render slider components on the page', async ({ page }) => {
    await page.goto('/inputs-and-forms/slider')

    const content = page.locator('slider-page')
    await content.waitFor({ state: 'visible' })

    // Should have multiple slider sections
    await expect(content.getByRole('heading', { name: 'Basic Slider' })).toBeVisible()
    await expect(content.getByRole('heading', { name: 'Colors' })).toBeVisible()
    await expect(content.getByRole('heading', { name: 'Range Slider' })).toBeVisible()
    await expect(content.getByRole('heading', { name: 'Vertical' })).toBeVisible()
    await expect(content.getByRole('heading', { name: 'Disabled' })).toBeVisible()
  })

  test('should have accessible slider elements', async ({ page }) => {
    await page.goto('/inputs-and-forms/slider')

    const content = page.locator('slider-page')
    await content.waitFor({ state: 'visible' })

    // All sliders should have role="slider" on their thumbs
    const sliders = content.locator('[role="slider"]')
    const count = await sliders.count()
    expect(count).toBeGreaterThan(0)

    // First slider thumb should have proper ARIA attributes
    const firstSlider = sliders.first()
    await expect(firstSlider).toHaveAttribute('aria-valuemin', '0')
    await expect(firstSlider).toHaveAttribute('aria-valuemax', '100')
    await expect(firstSlider).toHaveAttribute('aria-orientation', 'horizontal')
  })

  test('should update basic slider via keyboard', async ({ page }) => {
    await page.goto('/inputs-and-forms/slider')

    const content = page.locator('slider-page')
    await content.waitFor({ state: 'visible' })

    // Find the first slider thumb (basic slider)
    const basicThumb = content.locator('shade-slider').first().locator('.slider-thumb')
    await basicThumb.focus()

    // Get initial value
    const initialValue = await basicThumb.getAttribute('aria-valuenow')
    expect(initialValue).toBe('40')

    // Press ArrowRight to increment
    await basicThumb.press('ArrowRight')
    const newValue = await basicThumb.getAttribute('aria-valuenow')
    expect(newValue).toBe('41')
  })

  test('should render range slider with two thumbs', async ({ page }) => {
    await page.goto('/inputs-and-forms/slider')

    const content = page.locator('slider-page')
    await content.waitFor({ state: 'visible' })

    // The range slider section
    const rangeHeading = content.getByRole('heading', { name: 'Range Slider' })
    await expect(rangeHeading).toBeVisible()

    // Find the range slider (it should have two thumbs)
    const rangeSlider = rangeHeading.locator('xpath=ancestor::shade-paper').locator('shade-slider').first()
    const thumbs = rangeSlider.locator('.slider-thumb')
    await expect(thumbs).toHaveCount(2)
  })

  test('should render vertical sliders', async ({ page }) => {
    await page.goto('/inputs-and-forms/slider')

    const content = page.locator('slider-page')
    await content.waitFor({ state: 'visible' })

    // Find vertical sliders
    const verticalSliders = content.locator('shade-slider[data-vertical]')
    const count = await verticalSliders.count()
    expect(count).toBeGreaterThan(0)

    // Vertical slider thumbs should have vertical orientation
    const firstVerticalThumb = verticalSliders.first().locator('.slider-thumb').first()
    await expect(firstVerticalThumb).toHaveAttribute('aria-orientation', 'vertical')
  })

  test('should show disabled sliders', async ({ page }) => {
    await page.goto('/inputs-and-forms/slider')

    const content = page.locator('slider-page')
    await content.waitFor({ state: 'visible' })

    const disabledSliders = content.locator('shade-slider[data-disabled]')
    const count = await disabledSliders.count()
    expect(count).toBeGreaterThan(0)
  })

  test('should render marks and labels', async ({ page }) => {
    await page.goto('/inputs-and-forms/slider')

    const content = page.locator('slider-page')
    await content.waitFor({ state: 'visible' })

    // The custom marks section should have label elements
    const marksHeading = content.getByRole('heading', { name: 'Custom Marks with Labels' })
    await expect(marksHeading).toBeVisible()

    const marksSection = marksHeading.locator('xpath=ancestor::shade-paper')
    const labels = marksSection.locator('.slider-mark-label')
    const count = await labels.count()
    expect(count).toBeGreaterThan(0)
  })
})
