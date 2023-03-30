import { test, expect, Locator, Page } from '@playwright/test'
import { pages } from './pages'
import { sleepAsync } from '@furystack/utils'

test.describe('Notys', () => {
  test('Should be able to open and close notys in order', async ({ page }) => {
    await page.goto(pages.notys.url)
    const infoButton = await page.locator('button:has-text("Info")')
    await infoButton.click()
    const infoNoty = await page.locator('shade-noty:has-text("Info")')
    await infoNoty.waitFor({ state: 'visible' })
    await sleepAsync(1000)
    await expect(infoNoty).toHaveScreenshot('noty-info.png')
    await infoNoty.locator('button.dismissNoty').click()
    await infoNoty.waitFor({ state: 'detached' })

    const successButton = await page.locator('button:has-text("Success")')
    await successButton.click()
    const successNoty = await page.locator('shade-noty:has-text("Success")')
    await successNoty.waitFor({ state: 'visible' })
    await sleepAsync(1000)
    await expect(successNoty).toHaveScreenshot('noty-success.png')
    await successNoty.locator('button.dismissNoty').click()
    await successNoty.waitFor({ state: 'detached' })

    const warningButton = await page.locator('button:has-text("Warning")')
    await warningButton.click()
    const warningNoty = await page.locator('shade-noty:has-text("Warning")')
    await warningNoty.waitFor({ state: 'visible' })
    await sleepAsync(1000)
    await expect(warningNoty).toHaveScreenshot('noty-warning.png')
    await warningNoty.locator('button.dismissNoty').click()
    await warningNoty.waitFor({ state: 'detached' })

    const errorButton = await page.locator('button:has-text("Error")')
    await errorButton.click()
    const errorNoty = await page.locator('shade-noty:has-text("Error")')
    await errorNoty.waitFor({ state: 'visible' })
    await sleepAsync(1000)
    await expect(errorNoty).toHaveScreenshot('noty-error.png')
    await errorNoty.locator('button.dismissNoty').click()
    await errorNoty.waitFor({ state: 'detached' })
  })
})
