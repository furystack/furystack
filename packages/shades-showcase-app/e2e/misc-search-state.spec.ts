import { expect, test } from '@playwright/test'

test.describe('useSearchState', () => {
  test('Should rerender once on change', async ({ page }) => {
    await page.goto('/misc')
    const testComponent = await page.locator('shades-example-search-change')
    await testComponent.waitFor({ state: 'visible' })

    await expect(testComponent).toHaveText('Search state change (0)')

    const input = await testComponent.locator('input')
    await input.fill('test1')
    await input.press('Enter')

    await expect(testComponent).toHaveText('Search state change (1)')

    await input.fill('test2')
    await input.press('Enter')

    await expect(testComponent).toHaveText('Search state change (2)')

    await page.goBack()

    await expect(input).toHaveValue('test1')
    await expect(testComponent).toHaveText('Search state change (3)')

    await page.goForward()

    await expect(input).toHaveValue('test2')
    await expect(testComponent).toHaveText('Search state change (4)')
  })
})
