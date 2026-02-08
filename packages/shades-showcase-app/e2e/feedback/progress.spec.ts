import { expect, test } from '@playwright/test'

test.describe('Progress', () => {
  test('should display all progress variants and support interaction', async ({ page }) => {
    await page.goto('/feedback/progress')

    const content = page.locator('progress-page')
    await content.waitFor({ state: 'visible' })

    // Verify indeterminate linear progress bars
    await expect(content.getByText('Linear Progress – Indeterminate')).toBeVisible()
    const linearProgressBars = content.locator('shade-linear-progress')
    await expect(linearProgressBars.first()).toBeVisible()

    // Verify indeterminate circular progress spinners
    await expect(content.getByText('Circular Progress – Indeterminate')).toBeVisible()
    const circularProgressBars = content.locator('shade-circular-progress')
    await expect(circularProgressBars.first()).toBeVisible()

    // Verify size sections
    await expect(content.getByText('Linear Progress – Sizes')).toBeVisible()
    await expect(content.getByText('Small')).toBeVisible()
    await expect(content.getByText('Medium (default)')).toBeVisible()
    await expect(content.getByText('Circular Progress – Sizes')).toBeVisible()

    // Verify determinate progress slider interaction
    const slider = content.locator('input[type="range"]').first()
    await expect(slider).toBeVisible()
    await expect(content.locator('shade-value-label').first()).toHaveText('40%')

    await slider.fill('80')
    await expect(content.locator('shade-value-label').first()).toHaveText('80%')
  })
})
