import { test, expect, Locator, Page } from '@playwright/test'
import { pages } from './pages'

test.describe('Notys', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(pages.notys.url)
  })

  test('Should be able to open and close notys in order', async ({ page }) => {
    const infoButton = await page.locator('button:has-text("Info")')
    await infoButton.click()
    const infoNoty = await page.locator('shade-noty:has-text("Info")')
    await infoNoty.waitFor({ state: 'visible' })
    const successButton = await page.locator('button:has-text("Success")')
    await successButton.click()
    const successNoty = await page.locator('shade-noty:has-text("Success")')
    await successNoty.waitFor({ state: 'visible' })
    const warningButton = await page.locator('button:has-text("Warning")')
    await warningButton.click()
    const warningNoty = await page.locator('shade-noty:has-text("Warning")')
    await warningNoty.waitFor({ state: 'visible' })
    const errorButton = await page.locator('button:has-text("Error")')
    await errorButton.click()
    const errorNoty = await page.locator('shade-noty:has-text("Error")')
    await errorNoty.waitFor({ state: 'visible' })

    const warningCloseButton = await warningNoty.locator('button.dismissNoty')
    await warningCloseButton.click()
    await warningNoty.waitFor({ state: 'detached' })
  })
})
