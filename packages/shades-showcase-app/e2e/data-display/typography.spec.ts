import { expect, test } from '@playwright/test'

test.describe('Typography', () => {
  test('should render all variant headings', async ({ page }) => {
    await page.goto('/data-display/typography')

    const content = page.locator('shades-typography-page')
    await content.waitFor({ state: 'visible' })

    // Check that the Variants section renders all 12 variants
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
  })

  test('should render color variants', async ({ page }) => {
    await page.goto('/data-display/typography')

    const content = page.locator('shades-typography-page')
    await content.waitFor({ state: 'visible' })

    const colorsHeading = content.getByRole('heading', { name: 'Colors' })
    await expect(colorsHeading).toBeVisible()

    // Verify a few color labels are present
    await expect(content.getByText('textPrimary (default)')).toBeVisible()
    await expect(content.getByText('textSecondary')).toBeVisible()
    await expect(content.getByText('textDisabled')).toBeVisible()
  })

  test('should display ellipsis sections', async ({ page }) => {
    await page.goto('/data-display/typography')

    const content = page.locator('shades-typography-page')
    await content.waitFor({ state: 'visible' })

    // Single-line ellipsis
    const singleLineHeading = content.getByRole('heading', { name: 'Ellipsis (single line)' })
    await expect(singleLineHeading).toBeVisible()

    const singleLineEl = content.locator('shade-typography[data-ellipsis="true"]')
    await expect(singleLineEl).toBeVisible()

    // Multi-line ellipsis
    const multiLineHeading = content.getByRole('heading', { name: /Ellipsis.*multi-line/ })
    await expect(multiLineHeading).toBeVisible()

    const multiLineEl = content.locator('shade-typography[data-ellipsis="multiline"]')
    await expect(multiLineEl).toBeVisible()
  })

  test('should render copyable text with copy button', async ({ page }) => {
    await page.goto('/data-display/typography')

    const content = page.locator('shades-typography-page')
    await content.waitFor({ state: 'visible' })

    const copyableHeading = content.getByRole('heading', { name: 'Copyable' })
    await expect(copyableHeading).toBeVisible()

    // Check that copy buttons exist
    const copyButtons = content.locator('.typo-copy-btn')
    const count = await copyButtons.count()
    expect(count).toBeGreaterThanOrEqual(2)
  })

  test('should render alignment variants', async ({ page }) => {
    await page.goto('/data-display/typography')

    const content = page.locator('shades-typography-page')
    await content.waitFor({ state: 'visible' })

    const alignHeading = content.getByRole('heading', { name: 'Alignment' })
    await expect(alignHeading).toBeVisible()

    await expect(content.locator('shade-typography[data-align="left"]')).toBeVisible()
    await expect(content.locator('shade-typography[data-align="center"]')).toBeVisible()
    await expect(content.locator('shade-typography[data-align="right"]')).toBeVisible()
    await expect(content.locator('shade-typography[data-align="justify"]')).toBeVisible()
  })
})
