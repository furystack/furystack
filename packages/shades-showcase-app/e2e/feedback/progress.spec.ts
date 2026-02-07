import { expect, test } from '@playwright/test'

test.describe('Progress', () => {
  test('should display indeterminate progress indicators', async ({ page }) => {
    await page.goto('/feedback/progress')

    const content = page.locator('progress-page')
    await content.waitFor({ state: 'visible' })

    // Verify indeterminate linear progress bars are visible
    await expect(content.getByText('Linear Progress – Indeterminate')).toBeVisible()
    const linearProgressBars = content.locator('shade-linear-progress')
    await expect(linearProgressBars.first()).toBeVisible()

    // Verify indeterminate circular progress spinners are visible
    await expect(content.getByText('Circular Progress – Indeterminate')).toBeVisible()
    const circularProgressBars = content.locator('shade-circular-progress')
    await expect(circularProgressBars.first()).toBeVisible()
  })

  test('should update determinate progress with slider', async ({ page }) => {
    await page.goto('/feedback/progress')

    const content = page.locator('progress-page')
    await content.waitFor({ state: 'visible' })

    // Find the range slider in the "Linear Progress – Determinate" section
    const slider = content.locator('input[type="range"]').first()
    await expect(slider).toBeVisible()

    // The initial value should be 40%
    await expect(content.locator('shade-value-label').first()).toHaveText('40%')

    // Change the slider to 80
    await slider.fill('80')

    // Verify the displayed value updates
    await expect(content.locator('shade-value-label').first()).toHaveText('80%')
  })

  test('should show different size sections', async ({ page }) => {
    await page.goto('/feedback/progress')

    const content = page.locator('progress-page')
    await content.waitFor({ state: 'visible' })

    // Verify linear progress sizes section
    await expect(content.getByText('Linear Progress – Sizes')).toBeVisible()
    await expect(content.getByText('Small')).toBeVisible()
    await expect(content.getByText('Medium (default)')).toBeVisible()

    // Verify circular progress sizes section
    await expect(content.getByText('Circular Progress – Sizes')).toBeVisible()
  })
})
