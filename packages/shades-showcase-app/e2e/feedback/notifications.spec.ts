import { sleepAsync } from '@furystack/utils'
import { expect, test } from '@playwright/test'

test.describe('Notys', () => {
  test('Should be able to open and close notys in order', async ({ page }) => {
    await page.goto('/feedback/notifications')
    const infoButton = page.locator('button:has-text("Info")')
    await infoButton.click()
    const infoNoty = page.locator('shade-noty:has-text("Info")')
    await infoNoty.waitFor({ state: 'visible' })
    await sleepAsync(1000)
    await expect(infoNoty).toHaveScreenshot('noty-info.png')
    await infoNoty.locator('button.dismiss-button').click()
    await infoNoty.waitFor({ state: 'detached' })

    const successButton = page.locator('button:has-text("Success")')
    await successButton.click()
    const successNoty = page.locator('shade-noty:has-text("Success")')
    await successNoty.waitFor({ state: 'visible' })
    await sleepAsync(1000)
    await expect(successNoty).toHaveScreenshot('noty-success.png')
    await successNoty.locator('button.dismiss-button').click()
    await successNoty.waitFor({ state: 'detached' })

    const warningButton = page.locator('button:has-text("Warning")')
    await warningButton.click()
    const warningNoty = page.locator('shade-noty:has-text("Warning")')
    await warningNoty.waitFor({ state: 'visible' })
    await sleepAsync(1000)
    await expect(warningNoty).toHaveScreenshot('noty-warning.png')
    await warningNoty.locator('button.dismiss-button').click()
    await warningNoty.waitFor({ state: 'detached' })

    const errorButton = page.locator('button:has-text("Error")')
    await errorButton.click()
    const errorNoty = page.locator('shade-noty:has-text("Error")')
    await errorNoty.waitFor({ state: 'visible' })
    await sleepAsync(1000)
    await expect(errorNoty).toHaveScreenshot('noty-error.png')
    await errorNoty.locator('button.dismiss-button').click()
    await errorNoty.waitFor({ state: 'detached' })
  })
})
