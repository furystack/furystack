import { expect, test } from '@playwright/test'

test.describe('Chip', () => {
  test('should delete chips and reset them', async ({ page }) => {
    await page.goto('/data-display/chip')

    const content = page.locator('shades-chip-page')
    await content.waitFor({ state: 'visible' })

    // Find the "Deletable" heading
    const deletableHeading = content.getByRole('heading', { name: 'Deletable' })
    await expect(deletableHeading).toBeVisible()

    // Count initial deletable chips (6 palette colors) - they are in the next sibling div
    const deletableSection = deletableHeading.locator('+ div')
    const initialChips = deletableSection.locator('shade-chip')
    const initialCount = await initialChips.count()
    expect(initialCount).toBe(6)

    // Delete the first chip by clicking its delete button
    const firstDeleteButton = initialChips.first().locator('.chip-delete')
    await firstDeleteButton.click()

    // Should now have one fewer chip plus a Reset chip
    const chipsAfterDelete = deletableSection.locator('shade-chip')
    const countAfterDelete = await chipsAfterDelete.count()
    // 5 remaining palette chips + 1 Reset chip = 6
    expect(countAfterDelete).toBe(6)

    // The Reset chip should be visible
    await expect(deletableSection.getByText('Reset')).toBeVisible()

    // Click Reset to restore all chips
    await deletableSection.locator('shade-chip', { hasText: 'Reset' }).click()

    // All original chips should be back, no Reset chip
    const chipsAfterReset = deletableSection.locator('shade-chip')
    const countAfterReset = await chipsAfterReset.count()
    expect(countAfterReset).toBe(6)
  })

  test('should trigger feedback when clicking a clickable chip', async ({ page }) => {
    await page.goto('/data-display/chip')

    const content = page.locator('shades-chip-page')
    await content.waitFor({ state: 'visible' })

    // Set up dialog handler to auto-accept before clicking
    let dialogMessage = ''
    page.on('dialog', async (dialog) => {
      dialogMessage = dialog.message()
      await dialog.accept()
    })

    // Click a clickable chip - find the "Clickable" heading's sibling section
    const clickableHeading = content.getByRole('heading', { name: 'Clickable' })
    const clickableSection = clickableHeading.locator('+ div')
    await clickableSection.locator('shade-chip').first().click()

    // Verify the alert dialog appeared with expected content
    expect(dialogMessage).toContain('Clicked')
  })
})
