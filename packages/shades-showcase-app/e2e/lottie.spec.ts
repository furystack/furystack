import { test, expect } from '@playwright/test'
import { sleepAsync } from '@furystack/utils'
import { pages } from './pages'

test.describe('Lottie', () => {
  test('Should be able to display a Lottie Animation', async ({ page }) => {
    await page.goto(pages.lottie.url)
    const lottie = await page.locator('lottie-player')
    await lottie.waitFor({ state: 'visible' })
    await sleepAsync(1000)
    await expect(lottie).toHaveScreenshot()
  })
})
