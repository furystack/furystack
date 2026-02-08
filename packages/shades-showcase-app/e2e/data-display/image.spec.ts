import { expect, test } from '@playwright/test'

test.describe('Image', () => {
  test('should render the Image page with all sections', async ({ page }) => {
    await page.goto('/data-display/image')

    const pageHeader = page.locator('shade-page-header')
    await expect(pageHeader).toBeVisible()
    await expect(pageHeader).toContainText('Image')

    // Should have multiple paper sections
    const papers = page.locator('shade-paper')
    await expect(papers.first()).toBeVisible()
  })

  test('should render basic images', async ({ page }) => {
    await page.goto('/data-display/image')

    const images = page.locator('shade-image')
    await expect(images.first()).toBeVisible()
  })

  test('should show preview icon on hover for preview-enabled images', async ({ page }) => {
    await page.goto('/data-display/image')

    // Find a preview-enabled image
    const previewImage = page.locator('shade-image[data-preview]').first()
    await expect(previewImage).toBeVisible()
  })

  test('should open lightbox when clicking a preview image', async ({ page }) => {
    await page.goto('/data-display/image')

    // Click a preview-enabled image
    const previewImage = page.locator('shade-image[data-preview] img').first()
    await expect(previewImage).toBeVisible()
    await previewImage.click()

    // Lightbox should appear
    const lightbox = page.locator('.lightbox-backdrop')
    await expect(lightbox).toBeVisible()

    // Lightbox image should be visible
    const lightboxImage = page.locator('.lightbox-image')
    await expect(lightboxImage).toBeVisible()

    // Toolbar with controls should be visible
    const toolbar = page.locator('.lightbox-toolbar')
    await expect(toolbar).toBeVisible()

    // Close lightbox with Escape
    await page.keyboard.press('Escape')
    await expect(lightbox).not.toBeVisible()
  })

  test('should show zoom and rotate controls in lightbox', async ({ page }) => {
    await page.goto('/data-display/image')

    const previewImage = page.locator('shade-image[data-preview] img').first()
    await previewImage.click()

    const zoomIn = page.locator('.lightbox-zoom-in')
    const zoomOut = page.locator('.lightbox-zoom-out')
    const rotate = page.locator('.lightbox-rotate')

    await expect(zoomIn).toBeVisible()
    await expect(zoomOut).toBeVisible()
    await expect(rotate).toBeVisible()

    // Close lightbox
    await page.keyboard.press('Escape')
  })

  test('should render ImageGroup with gallery navigation', async ({ page }) => {
    await page.goto('/data-display/image')

    const group = page.locator('shade-image-group')
    await expect(group).toBeVisible()

    // Should have multiple images in the group
    const groupImages = group.locator('shade-image')
    const count = await groupImages.count()
    expect(count).toBeGreaterThanOrEqual(2)

    // Click an image in the group
    await groupImages.first().locator('img').click()

    // Should open lightbox with navigation
    const lightbox = page.locator('.lightbox-backdrop')
    await expect(lightbox).toBeVisible()

    const prevBtn = page.locator('.lightbox-prev')
    const nextBtn = page.locator('.lightbox-next')
    await expect(prevBtn).toBeVisible()
    await expect(nextBtn).toBeVisible()

    // Counter should show position
    const counter = page.locator('.lightbox-counter')
    await expect(counter).toBeVisible()
    await expect(counter).toContainText('/')

    // Close lightbox
    await page.keyboard.press('Escape')
  })

  test('should navigate between images in group lightbox', async ({ page }) => {
    await page.goto('/data-display/image')

    const group = page.locator('shade-image-group')
    await group.locator('shade-image img').first().click()

    const lightbox = page.locator('.lightbox-backdrop')
    await expect(lightbox).toBeVisible()

    const counter = page.locator('.lightbox-counter')
    await expect(counter).toContainText('1 /')

    // Navigate to next
    await page.locator('.lightbox-next').click()
    await expect(counter).toContainText('2 /')

    // Navigate with arrow key
    await page.keyboard.press('ArrowRight')
    await expect(counter).toContainText('3 /')

    // Navigate back with arrow key
    await page.keyboard.press('ArrowLeft')
    await expect(counter).toContainText('2 /')

    // Close lightbox
    await page.keyboard.press('Escape')
  })
})
