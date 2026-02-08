import { expect, test } from '@playwright/test'

test.describe('Timeline', () => {
  test('should render basic timeline items', async ({ page }) => {
    await page.goto('/data-display/timeline')

    const content = page.locator('shades-timeline-page')
    await content.waitFor({ state: 'visible' })

    const basicSection = content.locator('h3:has-text("Basic (left mode)")')
    await expect(basicSection).toBeVisible()

    const timelines = content.locator('shade-timeline')
    await expect(timelines.first()).toBeVisible()

    await expect(content.getByText('Create a services site')).toBeVisible()
    await expect(content.getByText('Solve initial network problems')).toBeVisible()
    await expect(content.getByText('Technical testing')).toBeVisible()
    await expect(content.getByText('Network problems being solved')).toBeVisible()
  })

  test('should render timeline with colors', async ({ page }) => {
    await page.goto('/data-display/timeline')

    const content = page.locator('shades-timeline-page')
    await content.waitFor({ state: 'visible' })

    const colorsSection = content.locator('h3:has-text("Colors")')
    await expect(colorsSection).toBeVisible()

    await expect(content.getByText('Primary event (1)')).toBeVisible()
    await expect(content.getByText('Success event (5)')).toBeVisible()
  })

  test('should render custom dots', async ({ page }) => {
    await page.goto('/data-display/timeline')

    const content = page.locator('shades-timeline-page')
    await content.waitFor({ state: 'visible' })

    const customDotsSection = content.locator('h3:has-text("Custom dots")')
    await expect(customDotsSection).toBeVisible()

    await expect(content.getByText('Project launched')).toBeVisible()
    await expect(content.getByText('Bug reported')).toBeVisible()
  })

  test('should render alternate mode with labels', async ({ page }) => {
    await page.goto('/data-display/timeline')

    const content = page.locator('shades-timeline-page')
    await content.waitFor({ state: 'visible' })

    const labelsSection = content.locator('h3:has-text("With labels")')
    await expect(labelsSection).toBeVisible()

    await expect(content.getByText('2024-01-15')).toBeVisible()
    await expect(content.getByText('Project kickoff meeting')).toBeVisible()
    await expect(content.getByText('Production launch')).toBeVisible()
  })

  test('should render right mode', async ({ page }) => {
    await page.goto('/data-display/timeline')

    const content = page.locator('shades-timeline-page')
    await content.waitFor({ state: 'visible' })

    const rightSection = content.locator('h3:has-text("Right mode")')
    await expect(rightSection).toBeVisible()

    await expect(content.getByText('Sign up for account')).toBeVisible()
    await expect(content.getByText('Step 1')).toBeVisible()
  })

  test('should render pending state', async ({ page }) => {
    await page.goto('/data-display/timeline')

    const content = page.locator('shades-timeline-page')
    await content.waitFor({ state: 'visible' })

    const pendingSection = content.locator('h3:has-text("Pending state")')
    await expect(pendingSection).toBeVisible()

    await expect(content.getByText('Recording...')).toBeVisible()
  })
})
