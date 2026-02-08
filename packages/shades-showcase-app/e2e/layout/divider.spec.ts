import { expect, test } from '@playwright/test'

test.describe('Divider', () => {
  test('should render all divider variants', async ({ page }) => {
    await page.goto('/layout/divider')

    const content = page.locator('shades-divider-page')
    await content.waitFor({ state: 'visible' })

    // Verify horizontal dividers
    await expect(content.getByRole('heading', { name: 'Basic horizontal' })).toBeVisible()
    await expect(content.getByRole('heading', { name: 'Variants' })).toBeVisible()
    const dividers = content.locator('shade-divider')
    const count = await dividers.count()
    expect(count).toBeGreaterThan(5)

    // Verify dividers with text content
    await expect(content.getByText('CENTER', { exact: true })).toBeVisible()
    await expect(content.getByText('LEFT', { exact: true })).toBeVisible()
    await expect(content.getByText('RIGHT', { exact: true })).toBeVisible()

    // Verify vertical dividers
    await expect(content.getByRole('heading', { name: 'Vertical orientation' })).toBeVisible()
    await expect(content.getByText('Item 1', { exact: true })).toBeVisible()
    await expect(content.getByText('Item 2', { exact: true })).toBeVisible()
    await expect(content.getByText('Item 3', { exact: true })).toBeVisible()
  })
})
