import type { Locator } from '@playwright/test'
import { test, expect } from '@playwright/test'
import { pages } from './pages.js'

test.describe('Wizard', () => {
  let wizardButton!: Locator
  let wizard!: Locator
  let backdrop!: Locator

  const openWizard = async () => {
    await wizardButton.click()
    await wizard.waitFor({ state: 'visible' })
  }

  const closeWizardWithBackdropClick = async () => {
    await backdrop.click({ position: { y: 50, x: 50 }, force: true })
    await backdrop.waitFor({
      state: 'detached',
      timeout: 2500,
    })
  }

  test.beforeEach(async ({ page }) => {
    await page.goto(pages.wizard.url)
    wizardButton = await page.locator('text=Open Wizard')
    wizard = await page.locator('shades-wizard')
    backdrop = await page.locator('shade-modal > div')
  })

  test('Should be opened and closed with a backdrop click', async () => {
    await openWizard()
    await closeWizardWithBackdropClick()
    await wizard.waitFor({
      state: 'detached',
    })
    await expect(await wizard.count()).toBe(0)
  })

  test('Should be opened and finished by walking through the steps', async () => {
    await openWizard()

    const input = await wizard.locator('input[name=username]')
    expect(input).toBeFocused()

    await input.type('PlaywrightBot')

    const nextButton = await wizard.locator('button:has-text("Next")')
    await nextButton.click()

    const step2Text = wizard.locator('text=Step 2')
    expect(step2Text).toBeVisible()
    await nextButton.click()

    const step3Text = wizard.locator('text=Step 3')
    expect(step3Text).toBeVisible()

    const finishButton = await wizard.locator('button:has-text("Finish")')
    await finishButton.click()

    await wizard.waitFor({
      state: 'detached',
    })
    await expect(await wizard.count()).toBe(0)
  })
})
