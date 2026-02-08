import { expect, test } from '@playwright/test'

test.describe('Timeline', () => {
  test('should render all timeline sections and modes', async ({ page }) => {
    await page.goto('/data-display/timeline')

    const content = page.locator('shades-timeline-page')
    await content.waitFor({ state: 'visible' })

    // Verify basic timeline
    await expect(content.locator('h3:has-text("Basic (left mode)")')).toBeVisible()
    const timelines = content.locator('shade-timeline')
    await expect(timelines.first()).toBeVisible()
    await expect(content.getByText('Create a services site')).toBeVisible()
    await expect(content.getByText('Solve initial network problems')).toBeVisible()
    await expect(content.getByText('Technical testing')).toBeVisible()
    await expect(content.getByText('Network problems being solved')).toBeVisible()

    // Verify colors section
    await expect(content.locator('h3:has-text("Colors")')).toBeVisible()
    await expect(content.getByText('Primary event (1)')).toBeVisible()
    await expect(content.getByText('Success event (5)')).toBeVisible()

    // Verify custom dots
    await expect(content.locator('h3:has-text("Custom dots")')).toBeVisible()
    await expect(content.getByText('Project launched')).toBeVisible()
    await expect(content.getByText('Bug reported')).toBeVisible()

    // Verify alternate mode with labels
    await expect(content.locator('h3:has-text("With labels")')).toBeVisible()
    await expect(content.getByText('2024-01-15')).toBeVisible()
    await expect(content.getByText('Project kickoff meeting')).toBeVisible()
    await expect(content.getByText('Production launch')).toBeVisible()

    // Verify right mode
    await expect(content.locator('h3:has-text("Right mode")')).toBeVisible()
    await expect(content.getByText('Sign up for account')).toBeVisible()
    await expect(content.getByText('Step 1')).toBeVisible()

    // Verify pending state
    await expect(content.locator('h3:has-text("Pending state")')).toBeVisible()
    await expect(content.getByText('Recording...')).toBeVisible()
  })
})
