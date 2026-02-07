import { expect, test } from '@playwright/test'

test.describe('Switch', () => {
  test('should toggle a switch on and off', async ({ page }) => {
    await page.goto('/inputs-and-forms/switch')

    const content = page.locator('switch-page')
    await content.waitFor({ state: 'visible' })

    // Find the first basic switch (unchecked by default)
    const firstSwitch = content.getByRole('switch').first()
    const firstSwitchTrack = content.locator('shade-switch').first().locator('.switch-track')

    // Should be unchecked initially
    await expect(firstSwitch).not.toBeChecked()

    // Check it by clicking the visible switch track element
    await firstSwitchTrack.click()
    await expect(firstSwitch).toBeChecked()

    // Uncheck it
    await firstSwitchTrack.click()
    await expect(firstSwitch).not.toBeChecked()
  })

  test('should render controlled switch with correct initial state', async ({ page }) => {
    await page.goto('/inputs-and-forms/switch')

    const content = page.locator('switch-page')
    await content.waitFor({ state: 'visible' })

    // The controlled section shows the switch with label "On" and checked state
    const controlledHeading = content.getByRole('heading', { name: 'Controlled' })
    await expect(controlledHeading).toBeVisible()

    // The controlled switch should be checked and labeled "On"
    const controlledSwitch = content.getByRole('switch', { name: 'On', exact: true })
    await expect(controlledSwitch).toBeChecked()
  })

  test('should not toggle disabled switches', async ({ page }) => {
    await page.goto('/inputs-and-forms/switch')

    const content = page.locator('switch-page')
    await content.waitFor({ state: 'visible' })

    // Find the disabled switch by its exact label
    const disabledSwitch = content.getByRole('switch', { name: 'Disabled off', exact: true })
    await expect(disabledSwitch).toBeDisabled()
  })
})
