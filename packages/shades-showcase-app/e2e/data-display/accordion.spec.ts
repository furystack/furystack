import { expect, test } from '@playwright/test'

test.describe('Accordion', () => {
  test('expand, collapse, independent items, and disabled state', async ({ page }) => {
    await page.goto('/data-display/accordion')

    const content = page.locator('shades-accordion-page')
    await content.waitFor({ state: 'visible' })

    await expect(content).toHaveScreenshot('accordion-initial.png')

    // First accordion item starts expanded
    const firstItem = content.locator('shade-accordion-item').first()
    await expect(firstItem).toHaveAttribute('data-expanded', '')
    await expect(firstItem.locator('.accordion-content')).not.toHaveCSS('height', '0px')

    // Collapse it
    await firstItem.locator('.accordion-header').click()
    await expect(firstItem).not.toHaveAttribute('data-expanded', '')

    // Expand it again
    await firstItem.locator('.accordion-header').click()
    await expect(firstItem).toHaveAttribute('data-expanded', '')

    // Expand second item independently
    const accordionItems = content.locator('shade-accordion:first-of-type shade-accordion-item')
    const secondItem = accordionItems.nth(1)
    await expect(secondItem).not.toHaveAttribute('data-expanded', '')
    await secondItem.locator('.accordion-header').click()
    await expect(secondItem).toHaveAttribute('data-expanded', '')
    await expect(firstItem).toHaveAttribute('data-expanded', '')

    // Disabled item should not expand
    const disabledItem = content.locator('shade-accordion-item[data-disabled]')
    await expect(disabledItem).toBeVisible()
    await expect(disabledItem).not.toHaveAttribute('data-expanded', '')
    await disabledItem.locator('.accordion-header').click({ force: true })
    await expect(disabledItem).not.toHaveAttribute('data-expanded', '')
  })
})
