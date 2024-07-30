import { expect, test } from '@playwright/test'

test.describe('Lottie', () => {
  test('Should be able to display a Lottie Animation', async ({ page }) => {
    await page.goto('/lottie')
    const lottie = page.locator('lottie-player')
    await lottie.waitFor({ state: 'visible' })

    await expect(lottie).toHaveScreenshot('lottie.png')
  })
})
