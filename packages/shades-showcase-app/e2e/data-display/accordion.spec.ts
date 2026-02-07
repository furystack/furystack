import { expect, test } from '@playwright/test'

test.describe('Accordion', () => {
  test('should expand and collapse accordion items', async ({ page }) => {
    await page.goto('/data-display/accordion')

    const content = page.locator('shades-accordion-page')
    await content.waitFor({ state: 'visible' })

    // The first accordion item "What is FuryStack?" starts expanded (defaultExpanded)
    const firstItem = content.locator('shade-accordion-item').first()
    await expect(firstItem).toHaveAttribute('data-expanded', '')
    await expect(firstItem.locator('.accordion-content')).not.toHaveCSS('height', '0px')

    // Click the header to collapse
    await firstItem.locator('.accordion-header').click()
    await expect(firstItem).not.toHaveAttribute('data-expanded', '')

    // Click again to expand
    await firstItem.locator('.accordion-header').click()
    await expect(firstItem).toHaveAttribute('data-expanded', '')
  })

  test('should expand multiple items independently', async ({ page }) => {
    await page.goto('/data-display/accordion')

    const content = page.locator('shades-accordion-page')
    await content.waitFor({ state: 'visible' })

    const accordionItems = content.locator('shade-accordion:first-of-type shade-accordion-item')

    // Second item "How does the Shades framework work?" starts collapsed
    const secondItem = accordionItems.nth(1)
    await expect(secondItem).not.toHaveAttribute('data-expanded', '')

    // Expand it
    await secondItem.locator('.accordion-header').click()
    await expect(secondItem).toHaveAttribute('data-expanded', '')

    // First item should still be expanded (independent toggling)
    const firstItem = accordionItems.nth(0)
    await expect(firstItem).toHaveAttribute('data-expanded', '')
  })

  test('should not expand disabled accordion items', async ({ page }) => {
    await page.goto('/data-display/accordion')

    const content = page.locator('shades-accordion-page')
    await content.waitFor({ state: 'visible' })

    // Find the disabled item in the "Disabled Items" section
    const disabledItem = content.locator('shade-accordion-item[data-disabled]')
    await expect(disabledItem).toBeVisible()
    await expect(disabledItem).not.toHaveAttribute('data-expanded', '')

    // The disabled item should have pointer-events: none, so we force-click
    // and verify it still has no data-expanded attribute
    await disabledItem.locator('.accordion-header').click({ force: true })
    await expect(disabledItem).not.toHaveAttribute('data-expanded', '')
  })
})
