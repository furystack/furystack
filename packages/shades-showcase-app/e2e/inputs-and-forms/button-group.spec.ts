import { expect, test } from '@playwright/test'

test.describe('Button Group', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/inputs-and-forms/button-group')
    const content = page.locator('button-group-page')
    await content.waitFor({ state: 'visible' })
  })

  test('should render the page with all sections', async ({ page }) => {
    const content = page.locator('button-group-page')

    // Page header should be visible
    await expect(content.getByRole('heading', { name: 'Button Group', level: 2 })).toBeVisible()

    // Should have 3 sections: ButtonGroup, ToggleButtonGroup, SegmentedControl
    await expect(content.getByRole('heading', { name: 'ButtonGroup', level: 3, exact: true })).toBeVisible()
    await expect(content.getByRole('heading', { name: 'ToggleButtonGroup', level: 3 })).toBeVisible()
    await expect(content.getByRole('heading', { name: 'SegmentedControl', level: 3 })).toBeVisible()
  })

  test('should render ButtonGroup variants', async ({ page }) => {
    const content = page.locator('button-group-page')

    // Should have ButtonGroup components
    const groups = content.locator('shade-button-group')
    const groupCount = await groups.count()
    expect(groupCount).toBeGreaterThanOrEqual(4)

    // Should contain grouped buttons
    const buttons = content.locator('shade-button-group button[is="shade-button"]')
    const buttonCount = await buttons.count()
    expect(buttonCount).toBeGreaterThanOrEqual(12)
  })

  test('should support ToggleButtonGroup exclusive selection', async ({ page }) => {
    const content = page.locator('button-group-page')

    // Find the exclusive toggle group (alignment) inside its demo wrapper
    const exclusiveDemo = content.locator('toggle-exclusive-demo')
    const exclusiveGroup = exclusiveDemo.locator('shade-toggle-button-group')
    await expect(exclusiveGroup).toBeVisible()

    // "center" should be selected by default
    const centerBtn = exclusiveGroup.locator('button[data-value="center"]')
    await expect(centerBtn).toHaveAttribute('data-selected', '')

    // Click "right" to change selection
    const rightBtn = exclusiveGroup.locator('button[data-value="right"]')
    await rightBtn.click()

    // "right" should now be selected, "center" should not
    await expect(rightBtn).toHaveAttribute('data-selected', '')
    await expect(centerBtn).not.toHaveAttribute('data-selected', '')
  })

  test('should support ToggleButtonGroup multi-select', async ({ page }) => {
    const content = page.locator('button-group-page')

    // Find the multi-select toggle group (formats) inside its demo wrapper
    const multiDemo = content.locator('toggle-multi-demo')
    const multiGroup = multiDemo.locator('shade-toggle-button-group')
    await expect(multiGroup).toBeVisible()

    // "bold" should be selected by default
    const boldBtn = multiGroup.locator('button[data-value="bold"]')
    await expect(boldBtn).toHaveAttribute('data-selected', '')

    // Click "italic" to add to selection
    const italicBtn = multiGroup.locator('button[data-value="italic"]')
    await italicBtn.click()

    // Both "bold" and "italic" should now be selected
    await expect(boldBtn).toHaveAttribute('data-selected', '')
    await expect(italicBtn).toHaveAttribute('data-selected', '')
  })

  test('should render SegmentedControl options', async ({ page }) => {
    const content = page.locator('button-group-page')

    // Should have segmented controls
    const segmented = content.locator('shade-segmented-control')
    const segmentedCount = await segmented.count()
    expect(segmentedCount).toBe(4)

    // First segmented control should have 4 options
    const firstSegmented = segmented.first()
    const options = firstSegmented.locator('.segmented-option')
    await expect(options).toHaveCount(4)
  })

  test('should support SegmentedControl selection', async ({ page }) => {
    const content = page.locator('button-group-page')

    // Find the interactive segmented control (inside the demo wrapper)
    const segmentedDemo = content.locator('segmented-control-demo')
    const segmented = segmentedDemo.locator('shade-segmented-control')

    // "weekly" should be selected by default
    const weeklyBtn = segmented.locator('.segmented-option', { hasText: 'Weekly' })
    await expect(weeklyBtn).toHaveAttribute('data-selected', '')

    // Click on "Monthly"
    const monthlyBtn = segmented.locator('.segmented-option', { hasText: 'Monthly' })
    await monthlyBtn.click()

    // "Monthly" should now be selected, "Weekly" should not
    await expect(monthlyBtn).toHaveAttribute('data-selected', '')
    await expect(weeklyBtn).not.toHaveAttribute('data-selected', '')
  })

  test('should disable SegmentedControl options when disabled', async ({ page }) => {
    const content = page.locator('button-group-page')

    // The last segmented control is fully disabled
    const disabledSegmented = content.locator('shade-segmented-control').last()
    const options = disabledSegmented.locator('.segmented-option')

    const count = await options.count()
    for (let i = 0; i < count; i++) {
      await expect(options.nth(i)).toBeDisabled()
    }
  })
})
