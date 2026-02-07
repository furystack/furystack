import { expect, test } from '@playwright/test'

test.describe('Divider', () => {
  test('should render horizontal dividers', async ({ page }) => {
    await page.goto('/layout/divider')

    const content = page.locator('shades-divider-page')
    await content.waitFor({ state: 'visible' })

    // Verify the page loaded with sections
    await expect(content.getByRole('heading', { name: 'Basic horizontal' })).toBeVisible()
    await expect(content.getByRole('heading', { name: 'Variants' })).toBeVisible()

    // Verify dividers are rendered
    const dividers = content.locator('shade-divider')
    const count = await dividers.count()
    expect(count).toBeGreaterThan(5)
  })

  test('should render dividers with text content', async ({ page }) => {
    await page.goto('/layout/divider')

    const content = page.locator('shades-divider-page')
    await content.waitFor({ state: 'visible' })

    // Verify text dividers exist by checking the divider text spans
    await expect(content.getByText('CENTER', { exact: true })).toBeVisible()
    await expect(content.getByText('LEFT', { exact: true })).toBeVisible()
    await expect(content.getByText('RIGHT', { exact: true })).toBeVisible()
  })

  test('should render vertical dividers', async ({ page }) => {
    await page.goto('/layout/divider')

    const content = page.locator('shades-divider-page')
    await content.waitFor({ state: 'visible' })

    // The vertical section should have items separated by dividers
    await expect(content.getByRole('heading', { name: 'Vertical orientation' })).toBeVisible()
    await expect(content.getByText('Item 1', { exact: true })).toBeVisible()
    await expect(content.getByText('Item 2', { exact: true })).toBeVisible()
    await expect(content.getByText('Item 3', { exact: true })).toBeVisible()
  })
})
