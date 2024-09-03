import { serializeToQueryString } from '@furystack/rest'
import { expect, test } from '@playwright/test'

test.describe('useSearchState', () => {
  test('Should rerender once on change', async ({ page }) => {
    await page.goto('/misc')
    const testComponent = page.locator('shades-example-search-change')
    await testComponent.waitFor({ state: 'visible' })

    await expect(testComponent).toHaveText('Search state change (0)')

    const input = testComponent.locator('input')
    await input.fill('test1')
    await input.press('Enter')

    await expect(testComponent).toHaveText('Search state change (1)')

    await input.fill('test2')
    await input.press('Enter')

    await expect(testComponent).toHaveText('Search state change (2)')

    await page.goBack()
    await expect(testComponent).toHaveText('Search state change (3)')
    await expect(input).toHaveValue('test1')

    await page.goForward()
    await expect(testComponent).toHaveText('Search state change (4)')
    await expect(input).toHaveValue('test2')
  })

  test('should be populated from a query param', async ({ page }) => {
    const searchValue = crypto.randomUUID()
    await page.goto(`/misc?${serializeToQueryString({ searchValue })}`)
    const testComponent = page.locator('shades-example-search-change input')
    await testComponent.waitFor({ state: 'visible' })

    await expect(testComponent).toHaveValue(searchValue)
  })
})
