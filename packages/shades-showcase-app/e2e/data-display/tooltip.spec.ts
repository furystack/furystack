import { expect, test } from '@playwright/test'

test.describe('Tooltip', () => {
  test.skip(({ isMobile }) => isMobile, 'Tooltip hover tests are desktop-only')

  test('hover to show, placement variants, and disabled tooltip', async ({ page }) => {
    await page.goto('/data-display/tooltip')

    const content = page.locator('shades-tooltip-page')
    await content.waitFor({ state: 'visible' })

    // Hover to show tooltip and hide on mouse leave
    const hoverTarget = content.getByText('Hover me')
    await hoverTarget.hover()
    await expect(page.getByText('This is a tooltip')).toBeVisible()
    await content.locator('shade-page-header').hover()
    await expect(page.getByText('This is a tooltip')).not.toBeVisible()

    // Placement variants
    const topButton = content.getByRole('button', { name: 'Top', exact: true })
    await topButton.hover()
    await expect(page.getByText('Top placement')).toBeVisible()
    await content.locator('shade-page-header').hover()
    await expect(page.getByText('Top placement')).not.toBeVisible()

    const bottomButton = content.getByRole('button', { name: 'Bottom', exact: true })
    await bottomButton.hover()
    await expect(page.getByText('Bottom placement')).toBeVisible()
    await content.locator('shade-page-header').hover()

    // Disabled tooltip should not show
    const disabledButton = content.getByRole('button', { name: 'Disabled tooltip' })
    await disabledButton.hover()
    await expect(page.getByText("You won't see this")).not.toBeVisible()
  })
})
