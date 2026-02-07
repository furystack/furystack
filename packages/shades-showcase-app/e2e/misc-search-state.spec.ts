import { serializeToQueryString } from '@furystack/rest'
import { expect, test } from '@playwright/test'

test.describe('useSearchState', () => {
  test('Should rerender once on change', async ({ page }) => {
    await page.goto('/utilities/search-state')
    const testComponent = page.locator('shades-search-state-page')
    await testComponent.waitFor({ state: 'visible' })

    const renderText = testComponent.locator('p', { hasText: 'Search state change' })
    await expect(renderText).toContainText('Search state change (0)')

    const input = testComponent.locator('input')
    await input.fill('test1')
    await input.press('Enter')

    await expect(renderText).toContainText('Search state change (1)')

    await input.fill('test2')
    await input.press('Enter')

    await expect(renderText).toContainText('Search state change (2)')

    await page.goBack()
    await expect(renderText).toContainText('Search state change (3)')
    await expect(input).toHaveValue('test1')

    await page.goForward()
    await expect(renderText).toContainText('Search state change (4)')
    await expect(input).toHaveValue('test2')
  })

  test('should be populated from a query param', async ({ page }) => {
    const searchValue = crypto.randomUUID()
    await page.goto(`/utilities/search-state?${serializeToQueryString({ searchValue })}`)
    const testComponent = page.locator('shades-search-state-page input')
    await testComponent.waitFor({ state: 'visible' })

    await expect(testComponent).toHaveValue(searchValue)
  })
})
