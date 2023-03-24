import { test, expect } from '@playwright/test'
import { sleepAsync } from '@furystack/utils'
import { pages } from './pages'

test.describe('Wizard', () => {
  test('Should be opened and closed with a backdrop click', async ({ page }) => {
    await page.goto(pages.wizard.url)
    const wizardButton = await page.locator('button', { hasText: 'Open Wizard' })
    await wizardButton.click()
    const wizard = await page.locator('shades-wizard')

    await wizard.waitFor({ state: 'visible' })

    await sleepAsync(1000)

    await expect(wizard).toHaveScreenshot()

    const backdrop = await page.locator('shade-modal > div')

    const boundingBox = await backdrop.boundingBox()
    const position = { y: (boundingBox?.height || 100) - 10, x: (boundingBox?.width || 100) - 50 }

    await backdrop.click({
      position,
      force: true,
    })

    await backdrop.waitFor({
      state: 'detached',
    })
    await wizard.waitFor({
      state: 'detached',
    })
    await expect(await wizard.count()).toBe(0)
  })

  test('Should be opened and finished by walking through the steps', async ({ page }) => {
    await page.goto(pages.wizard.url)
    const wizardButton = await page.locator('button', { hasText: 'Open Wizard' })
    await wizardButton.click()

    const wizard = await page.locator('shades-wizard')

    const input = wizard.locator('input[name=username]')
    expect(input).toBeFocused()

    await input.type('PlaywrightBot')

    const nextButton = wizard.locator('button', { hasText: 'Next' })
    await nextButton.click()

    const step2Text = wizard.locator('text=Step 2')
    expect(step2Text).toBeVisible()
    await nextButton.click()

    const step3Text = wizard.locator('text=Step 3')
    expect(step3Text).toBeVisible()

    const finishButton = wizard.locator('button', { hasText: 'Finish' })
    await finishButton.click()

    await wizard.waitFor({
      state: 'detached',
    })
    await expect(await wizard.count()).toBe(0)
  })
})
