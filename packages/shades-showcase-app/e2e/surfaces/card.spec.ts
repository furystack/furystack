import { expect, test } from '@playwright/test'

test.describe('Card', () => {
  test('rendering and interactions: variants, elevation, clickable, and action buttons', async ({ page }) => {
    await page.goto('/surfaces/card')

    const content = page.locator('shades-card-page')
    await content.waitFor({ state: 'visible' })

    // Verify basic card section
    await expect(content.getByRole('heading', { name: 'Basic Cards' })).toBeVisible()
    const cards = content.locator('shade-card')
    await expect(cards.first()).toBeVisible()

    // Verify outlined variant
    const outlinedCard = content.locator('shade-card[data-variant="outlined"]')
    await expect(outlinedCard.first()).toBeVisible()

    await expect(content).toHaveScreenshot('card-variants.png')

    // Verify elevation levels
    await expect(content.getByText('Elevation 0')).toBeVisible()
    await expect(content.getByText('Elevation 1')).toBeVisible()
    await expect(content.getByText('Elevation 2')).toBeVisible()
    await expect(content.getByText('Elevation 3')).toBeVisible()

    // Click clickable card and verify alert
    let dialogMessage = ''
    page.on('dialog', async (dialog) => {
      dialogMessage = dialog.message()
      await dialog.accept()
    })

    const clickableCard = content.locator('shade-card[data-clickable]').first()
    await clickableCard.click()
    expect(dialogMessage).toContain('card clicked')

    // Click card action button and verify alert
    dialogMessage = ''
    const shareButton = content.getByRole('button', { name: 'Share' }).first()
    await shareButton.click()
    expect(dialogMessage).toContain('Share')
  })
})
