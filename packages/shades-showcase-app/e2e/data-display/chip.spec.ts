import { expect, test } from '@playwright/test'

test.describe('Chip', () => {
  test('delete chips, reset, and clickable chip feedback', async ({ page }) => {
    await page.goto('/data-display/chip')

    const content = page.locator('shades-chip-page')
    await content.waitFor({ state: 'visible' })

    // Delete a chip and reset
    await expect(content.getByRole('heading', { name: 'Deletable' })).toBeVisible()

    // Find deletable chips by looking for chips with delete buttons
    const deletableChips = content.locator('shade-chip .chip-delete')
    const initialDeleteCount = await deletableChips.count()
    expect(initialDeleteCount).toBeGreaterThanOrEqual(6)

    // Delete the first chip
    await deletableChips.first().click()

    // A Reset chip should appear
    await expect(content.getByText('Reset')).toBeVisible()

    // Click Reset to restore all chips
    await content.locator('shade-chip', { hasText: 'Reset' }).click()

    // After reset, delete buttons should be back
    const afterResetCount = await content.locator('shade-chip .chip-delete').count()
    expect(afterResetCount).toBeGreaterThanOrEqual(6)

    // Clickable chip feedback
    let dialogMessage = ''
    page.on('dialog', async (dialog) => {
      dialogMessage = dialog.message()
      await dialog.accept()
    })
    await expect(content.getByRole('heading', { name: 'Clickable' })).toBeVisible()
    const clickableChips = content.locator('shade-chip[data-clickable]')
    await clickableChips.first().click()
    expect(dialogMessage).toContain('Clicked')
  })
})
