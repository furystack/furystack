import { expect, test } from '@playwright/test'

test.describe('Card', () => {
  test('should render basic and outlined cards', async ({ page }) => {
    await page.goto('/surfaces/card')

    const content = page.locator('shades-card-page')
    await content.waitFor({ state: 'visible' })

    // Verify basic card section is visible
    await expect(content.getByRole('heading', { name: 'Basic Cards' })).toBeVisible()

    // Both elevation and outlined cards should be present
    const cards = content.locator('shade-card')
    await expect(cards.first()).toBeVisible()

    // Verify outlined variant exists
    const outlinedCard = content.locator('shade-card[data-variant="outlined"]')
    await expect(outlinedCard.first()).toBeVisible()
  })

  test('should trigger alert when clicking a clickable card', async ({ page }) => {
    await page.goto('/surfaces/card')

    const content = page.locator('shades-card-page')
    await content.waitFor({ state: 'visible' })

    // Set up dialog handler to auto-accept before clicking
    let dialogMessage = ''
    page.on('dialog', async (dialog) => {
      dialogMessage = dialog.message()
      await dialog.accept()
    })

    // Click the first clickable card
    const clickableCard = content.locator('shade-card[data-clickable]').first()
    await clickableCard.click()

    // Verify the alert fired
    expect(dialogMessage).toContain('card clicked')
  })

  test('should trigger alert when clicking card action buttons', async ({ page }) => {
    await page.goto('/surfaces/card')

    const content = page.locator('shades-card-page')
    await content.waitFor({ state: 'visible' })

    // Set up dialog handler to auto-accept
    let dialogMessage = ''
    page.on('dialog', async (dialog) => {
      dialogMessage = dialog.message()
      await dialog.accept()
    })

    // Click the "Share" button on the media card
    const shareButton = content.getByRole('button', { name: 'Share' }).first()
    await shareButton.click()

    // Verify the alert fired
    expect(dialogMessage).toContain('Share')
  })

  test('should render elevation levels', async ({ page }) => {
    await page.goto('/surfaces/card')

    const content = page.locator('shades-card-page')
    await content.waitFor({ state: 'visible' })

    // Verify all elevation levels are labeled
    await expect(content.getByText('Elevation 0')).toBeVisible()
    await expect(content.getByText('Elevation 1')).toBeVisible()
    await expect(content.getByText('Elevation 2')).toBeVisible()
    await expect(content.getByText('Elevation 3')).toBeVisible()
  })
})
