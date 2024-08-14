import { expect, test } from '@playwright/test'

test.describe('useStoredState', () => {
  test('Should rerender once on change', async ({ page }) => {
    await page.goto('/misc')
    const testComponent = page.locator('shades-example-storedstate-change')
    await testComponent.waitFor({ state: 'visible' })

    await expect(testComponent).toHaveText('Stored state change (0)')

    const input = testComponent.locator('input')
    await input.fill('test1')
    await input.press('Enter')

    await expect(testComponent).toHaveText('Stored state change (1)')

    await input.fill('test2')
    await input.press('Enter')

    await expect(testComponent).toHaveText('Stored state change (2)')
  })
})
