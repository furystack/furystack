import { expect, test } from '@playwright/test'

test.describe('Nipple (Virtual Joystick)', () => {
  test('should render the virtual joystick', async ({ page }) => {
    await page.goto('/integrations/nipple')

    const pageHeader = page.locator('shade-page-header')
    await expect(pageHeader).toBeVisible()
    await expect(pageHeader).toContainText('Virtual Joystick')

    // The nipple component should be present
    const nipple = page.locator('shade-nipple')
    await expect(nipple).toBeVisible()
  })
})
