import { test, expect, Locator } from '@playwright/test'
import { pages } from './pages'

test.describe('Wizard', () => {
  let wizardButton!: Locator

  const openWizard = async () => await wizardButton.click()

  test.beforeEach(async ({ page }) => {
    await page.goto(pages.wizard.url)
    wizardButton = await page.locator('shades-welcome-wizard shade-button')
  })

  test('Should be opened and closed', () => {
    openWizard()
    expect(wizardButton).not.toBeVisible()
  })
})
