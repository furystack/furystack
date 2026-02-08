import { expect, test } from '@playwright/test'

test.describe('Slider', () => {
  test('rendering: sections, accessibility, range, vertical, disabled, and marks', async ({ page }) => {
    await page.goto('/inputs-and-forms/slider')

    const content = page.locator('slider-page')
    await content.waitFor({ state: 'visible' })

    // Verify all sections
    await expect(content.getByRole('heading', { name: 'Basic Slider' })).toBeVisible()
    await expect(content.getByRole('heading', { name: 'Colors' })).toBeVisible()
    await expect(content.getByRole('heading', { name: 'Range Slider' })).toBeVisible()
    await expect(content.getByRole('heading', { name: 'Vertical' })).toBeVisible()
    await expect(content.getByRole('heading', { name: 'Disabled' })).toBeVisible()

    // Verify accessible slider elements
    const sliders = content.locator('[role="slider"]')
    const sliderCount = await sliders.count()
    expect(sliderCount).toBeGreaterThan(0)
    const firstSlider = sliders.first()
    await expect(firstSlider).toHaveAttribute('aria-valuemin', '0')
    await expect(firstSlider).toHaveAttribute('aria-valuemax', '100')
    await expect(firstSlider).toHaveAttribute('aria-orientation', 'horizontal')

    // Verify range slider has two thumbs
    await expect(content.getByRole('heading', { name: 'Range Slider' })).toBeVisible()
    const rangeSlider = content.locator('slider-demo-range shade-slider')
    const thumbs = rangeSlider.locator('.slider-thumb')
    await expect(thumbs).toHaveCount(2)

    // Verify vertical sliders
    const verticalSliders = content.locator('shade-slider[data-vertical]')
    const verticalCount = await verticalSliders.count()
    expect(verticalCount).toBeGreaterThan(0)
    const firstVerticalThumb = verticalSliders.first().locator('.slider-thumb').first()
    await expect(firstVerticalThumb).toHaveAttribute('aria-orientation', 'vertical')

    // Verify disabled sliders
    const disabledSliders = content.locator('shade-slider[data-disabled]')
    const disabledCount = await disabledSliders.count()
    expect(disabledCount).toBeGreaterThan(0)

    // Verify marks and labels
    await expect(content.getByRole('heading', { name: 'Custom Marks with Labels' })).toBeVisible()
    const labels = content.locator('.slider-mark-label')
    const labelCount = await labels.count()
    expect(labelCount).toBeGreaterThan(0)

    await expect(content).toHaveScreenshot('slider-page.png')
  })

  test('interaction: keyboard update on basic slider', async ({ page }) => {
    await page.goto('/inputs-and-forms/slider')

    const content = page.locator('slider-page')
    await content.waitFor({ state: 'visible' })

    const basicThumb = content.locator('shade-slider').first().locator('.slider-thumb')
    await basicThumb.focus()

    await expect(basicThumb).toHaveAttribute('aria-valuenow', '40')

    await basicThumb.press('ArrowRight')
    await expect(basicThumb).toHaveAttribute('aria-valuenow', '41')
  })
})
