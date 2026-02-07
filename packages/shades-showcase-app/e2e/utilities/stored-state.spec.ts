import { expect, test } from '@playwright/test'

test.describe('useStoredState', () => {
  test('Should rerender once on change', async ({ page }) => {
    await page.goto('/utilities/stored-state')
    const testComponent = page.locator('shades-stored-state-page')
    await testComponent.waitFor({ state: 'visible' })

    const renderText = testComponent.locator('p', { hasText: 'Stored state change' })
    await expect(renderText).toContainText('Stored state change (0)')

    const input = testComponent.locator('input')
    await input.fill('test1')
    await input.press('Enter')

    await expect(renderText).toContainText('Stored state change (1)')

    await input.fill('test2')
    await input.press('Enter')

    await expect(renderText).toContainText('Stored state change (2)')
  })
})
