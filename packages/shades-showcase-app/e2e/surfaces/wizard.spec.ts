import { expect, test } from '@playwright/test'

const wizardPageUrl = '/surfaces/wizard'

test.describe('Wizard', () => {
  test('open, screenshot, backdrop close, then walk through steps to finish', async ({ page }) => {
    await page.goto(wizardPageUrl)

    // Open wizard and close with backdrop
    const wizardButton = page.locator('button', { hasText: 'Open Wizard' })
    await wizardButton.click()
    const wizard = page.locator('shades-wizard')
    await wizard.waitFor({ state: 'visible' })

    await expect(wizard).toHaveScreenshot('wizard-1.png')

    const backdrop = page.locator('shade-modal > div')
    const boundingBox = await backdrop.boundingBox()
    const position = { y: (boundingBox?.height || 100) - 10, x: (boundingBox?.width || 100) - 50 }
    await backdrop.click({ position, force: true })
    await backdrop.waitFor({ state: 'detached' })
    await wizard.waitFor({ state: 'detached' })
    expect(await wizard.count()).toBe(0)

    // Open wizard again and walk through steps
    await wizardButton.click()
    await wizard.waitFor({ state: 'visible' })

    const input = wizard.locator('input[name=username]')
    await expect(input).toBeFocused()
    await input.fill('PlaywrightBot')

    const nextButton = wizard.locator('button', { hasText: 'Next' })
    await nextButton.click()
    const step2Text = wizard.locator('text=Step 2')
    await expect(step2Text).toBeVisible()

    await nextButton.click()
    const step3Text = wizard.locator('text=Step 3')
    await expect(step3Text).toBeVisible()

    const finishButton = wizard.locator('button', { hasText: 'Finish' })
    await finishButton.click()
    await wizard.waitFor({ state: 'detached' })
    expect(await wizard.count()).toBe(0)
  })
})
