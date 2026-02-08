import { expect, test } from '@playwright/test'

test.describe('Switch', () => {
  test('toggle on/off, controlled state, and disabled state', async ({ page }) => {
    await page.goto('/inputs-and-forms/switch')

    const content = page.locator('switch-page')
    await content.waitFor({ state: 'visible' })

    // Toggle basic switch on and off
    const firstSwitch = content.getByRole('switch').first()
    const firstSwitchTrack = content.locator('shade-switch').first().locator('.switch-track')
    await expect(firstSwitch).not.toBeChecked()
    await firstSwitchTrack.click()
    await expect(firstSwitch).toBeChecked()
    await firstSwitchTrack.click()
    await expect(firstSwitch).not.toBeChecked()

    // Controlled switch initial state
    const controlledHeading = content.getByRole('heading', { name: 'Controlled' })
    await expect(controlledHeading).toBeVisible()
    const controlledSwitch = content.getByRole('switch', { name: 'On', exact: true })
    await expect(controlledSwitch).toBeChecked()

    // Disabled switch
    const disabledSwitch = content.getByRole('switch', { name: 'Disabled off', exact: true })
    await expect(disabledSwitch).toBeDisabled()
  })
})
