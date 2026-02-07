import { expect, test } from '@playwright/test'

test.describe('Tooltip', () => {
  test.skip(({ isMobile }) => isMobile, 'Tooltip hover tests are desktop-only')

  test('should show tooltip on hover and hide on mouse leave', async ({ page }) => {
    await page.goto('/data-display/tooltip')

    const content = page.locator('shades-tooltip-page')
    await content.waitFor({ state: 'visible' })

    // Hover over the "Hover me" text
    const hoverTarget = content.getByText('Hover me')
    await hoverTarget.hover()

    // Tooltip text should appear
    await expect(page.getByText('This is a tooltip')).toBeVisible()

    // Move mouse away to the page header area
    await content.locator('shade-page-header').hover()

    // Tooltip should disappear
    await expect(page.getByText('This is a tooltip')).not.toBeVisible()
  })

  test('should show tooltips with different placements', async ({ page }) => {
    await page.goto('/data-display/tooltip')

    const content = page.locator('shades-tooltip-page')
    await content.waitFor({ state: 'visible' })

    // Hover the "Top" button
    const topButton = content.getByRole('button', { name: 'Top', exact: true })
    await topButton.hover()
    await expect(page.getByText('Top placement')).toBeVisible()

    // Move away
    await content.locator('shade-page-header').hover()
    await expect(page.getByText('Top placement')).not.toBeVisible()

    // Hover the "Bottom" button
    const bottomButton = content.getByRole('button', { name: 'Bottom', exact: true })
    await bottomButton.hover()
    await expect(page.getByText('Bottom placement')).toBeVisible()
  })

  test('should not show disabled tooltip', async ({ page }) => {
    await page.goto('/data-display/tooltip')

    const content = page.locator('shades-tooltip-page')
    await content.waitFor({ state: 'visible' })

    // Hover the "Disabled tooltip" button
    const disabledButton = content.getByRole('button', { name: 'Disabled tooltip' })
    await disabledButton.hover()

    // The tooltip text "You won't see this" should NOT appear
    await expect(page.getByText("You won't see this")).not.toBeVisible()
  })
})
