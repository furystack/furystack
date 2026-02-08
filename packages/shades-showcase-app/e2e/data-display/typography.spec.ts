import { expect, test } from '@playwright/test'

test.describe('Typography', () => {
  test('should render all typography variants, colors, ellipsis, copyable, and alignment', async ({ page }) => {
    await page.goto('/data-display/typography')

    const content = page.locator('shades-typography-page')
    await content.waitFor({ state: 'visible' })

    // Verify all 12 variant types
    const variantsHeading = content.getByRole('heading', { name: 'Variants' })
    await expect(variantsHeading).toBeVisible()

    const variantLabels = [
      'h1',
      'h2',
      'h3',
      'h4',
      'h5',
      'h6',
      'subtitle1',
      'subtitle2',
      'body1',
      'body2',
      'caption',
      'overline',
    ]
    for (const variant of variantLabels) {
      const el = content.locator(`shade-typography[data-variant="${variant}"]`).first()
      await expect(el).toBeVisible()
    }

    // Verify color variants
    const colorsHeading = content.getByRole('heading', { name: 'Colors' })
    await expect(colorsHeading).toBeVisible()
    await expect(content.getByText('textPrimary (default)')).toBeVisible()
    await expect(content.getByText('textSecondary')).toBeVisible()
    await expect(content.getByText('textDisabled')).toBeVisible()

    // Verify ellipsis sections
    const singleLineHeading = content.getByRole('heading', { name: 'Ellipsis (single line)' })
    await expect(singleLineHeading).toBeVisible()
    await expect(content.locator('shade-typography[data-ellipsis="true"]')).toBeVisible()

    const multiLineHeading = content.getByRole('heading', { name: /Ellipsis.*multi-line/ })
    await expect(multiLineHeading).toBeVisible()
    await expect(content.locator('shade-typography[data-ellipsis="multiline"]')).toBeVisible()

    // Verify copyable text with copy buttons
    const copyableHeading = content.getByRole('heading', { name: 'Copyable', exact: true })
    await expect(copyableHeading).toBeVisible()
    const copyButtons = content.locator('.typo-copy-btn')
    const count = await copyButtons.count()
    expect(count).toBeGreaterThanOrEqual(2)

    // Verify alignment variants
    const alignHeading = content.getByRole('heading', { name: 'Alignment' })
    await expect(alignHeading).toBeVisible()
    await expect(content.locator('shade-typography[data-align="left"]')).toBeVisible()
    await expect(content.locator('shade-typography[data-align="center"]')).toBeVisible()
    await expect(content.locator('shade-typography[data-align="right"]')).toBeVisible()
    await expect(content.locator('shade-typography[data-align="justify"]')).toBeVisible()

    await expect(content).toHaveScreenshot('typography-page.png')
  })
})
