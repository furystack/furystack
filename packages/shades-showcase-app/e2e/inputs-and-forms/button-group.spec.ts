import { expect, test } from '@playwright/test'

test.describe('Button Group', () => {
  test('rendering and toggle button groups: sections, variants, exclusive and multi-select', async ({ page }) => {
    await page.goto('/inputs-and-forms/button-group')

    const content = page.locator('button-group-page')
    await content.waitFor({ state: 'visible' })

    // Verify all sections
    await expect(content.getByRole('heading', { name: 'Button Group', level: 2 })).toBeVisible()
    await expect(content.getByRole('heading', { name: 'ButtonGroup', level: 3, exact: true })).toBeVisible()
    await expect(content.getByRole('heading', { name: 'ToggleButtonGroup', level: 3 })).toBeVisible()
    await expect(content.getByRole('heading', { name: 'SegmentedControl', level: 3 })).toBeVisible()

    // Verify ButtonGroup variants
    const groups = content.locator('shade-button-group')
    const groupCount = await groups.count()
    expect(groupCount).toBeGreaterThanOrEqual(4)
    const buttons = content.locator('shade-button-group button[is="shade-button"]')
    const buttonCount = await buttons.count()
    expect(buttonCount).toBeGreaterThanOrEqual(12)

    // ToggleButtonGroup exclusive selection
    const exclusiveDemo = content.locator('toggle-exclusive-demo')
    const exclusiveGroup = exclusiveDemo.locator('shade-toggle-button-group')
    await expect(exclusiveGroup).toBeVisible()
    const centerBtn = exclusiveGroup.locator('button[data-value="center"]')
    await expect(centerBtn).toHaveAttribute('data-selected', '')
    const rightBtn = exclusiveGroup.locator('button[data-value="right"]')
    await rightBtn.click()
    await expect(rightBtn).toHaveAttribute('data-selected', '')
    await expect(centerBtn).not.toHaveAttribute('data-selected', '')

    await expect(exclusiveGroup).toHaveScreenshot('button-group-toggle-exclusive.png')

    // ToggleButtonGroup multi-select
    const multiDemo = content.locator('toggle-multi-demo')
    const multiGroup = multiDemo.locator('shade-toggle-button-group')
    await expect(multiGroup).toBeVisible()
    const boldBtn = multiGroup.locator('button[data-value="bold"]')
    await expect(boldBtn).toHaveAttribute('data-selected', '')
    const italicBtn = multiGroup.locator('button[data-value="italic"]')
    await italicBtn.click()
    await expect(boldBtn).toHaveAttribute('data-selected', '')
    await expect(italicBtn).toHaveAttribute('data-selected', '')
  })

  test('segmented control: rendering, selection, and disabled state', async ({ page }) => {
    await page.goto('/inputs-and-forms/button-group')

    const content = page.locator('button-group-page')
    await content.waitFor({ state: 'visible' })

    // Verify segmented controls
    const segmented = content.locator('shade-segmented-control')
    const segmentedCount = await segmented.count()
    expect(segmentedCount).toBe(4)

    const firstSegmented = segmented.first()
    const options = firstSegmented.locator('.segmented-option')
    await expect(options).toHaveCount(4)

    // Selection
    const segmentedDemo = content.locator('segmented-control-demo')
    const demoSegmented = segmentedDemo.locator('shade-segmented-control')
    const weeklyBtn = demoSegmented.locator('.segmented-option', { hasText: 'Weekly' })
    await expect(weeklyBtn).toHaveAttribute('data-selected', '')
    const monthlyBtn = demoSegmented.locator('.segmented-option', { hasText: 'Monthly' })
    await monthlyBtn.click()
    await expect(monthlyBtn).toHaveAttribute('data-selected', '')
    await expect(weeklyBtn).not.toHaveAttribute('data-selected', '')

    // Disabled state
    const disabledSegmented = content.locator('shade-segmented-control').last()
    const disabledOptions = disabledSegmented.locator('.segmented-option')
    const count = await disabledOptions.count()
    for (let i = 0; i < count; i++) {
      await expect(disabledOptions.nth(i)).toBeDisabled()
    }
  })
})
