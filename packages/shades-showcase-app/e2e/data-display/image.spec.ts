import { expect, test } from '@playwright/test'

test.describe('Image', () => {
  test('rendering and single image lightbox: open, controls, and close', async ({ page }) => {
    await page.goto('/data-display/image')

    await expect(page.getByRole('heading', { name: 'Image', level: 2 })).toBeVisible()

    const images = page.locator('shade-image')
    await expect(images.first()).toBeVisible()

    // Verify preview-enabled images
    const previewImage = page.locator('shade-image[data-preview]').first()
    await expect(previewImage).toBeVisible()

    // Open lightbox by clicking preview image
    await page.locator('shade-image[data-preview] img').first().click()

    const lightbox = page.locator('.lightbox-backdrop')
    await expect(lightbox).toBeVisible()
    await expect(page.locator('.lightbox-image')).toBeVisible()
    await expect(page.locator('.lightbox-toolbar')).toBeVisible()

    // Verify zoom and rotate controls
    await expect(page.locator('.lightbox-zoom-in')).toBeVisible()
    await expect(page.locator('.lightbox-zoom-out')).toBeVisible()
    await expect(page.locator('.lightbox-rotate')).toBeVisible()

    // Close lightbox with Escape
    await page.keyboard.press('Escape')
    await expect(lightbox).not.toBeVisible()
  })

  test('image group: gallery navigation with buttons and keyboard', async ({ page }) => {
    await page.goto('/data-display/image')

    const group = page.locator('shade-image-group')
    await expect(group).toBeVisible()

    const groupImages = group.locator('shade-image')
    const count = await groupImages.count()
    expect(count).toBeGreaterThanOrEqual(2)

    // Open lightbox from group
    await groupImages.first().locator('img').click()
    const lightbox = page.locator('.lightbox-backdrop')
    await expect(lightbox).toBeVisible()

    await expect(page.locator('.lightbox-prev')).toBeVisible()
    await expect(page.locator('.lightbox-next')).toBeVisible()
    const counter = page.locator('.lightbox-counter')
    await expect(counter).toBeVisible()
    await expect(counter).toContainText('1 /')

    // Navigate with button
    await page.locator('.lightbox-next').click()
    await expect(counter).toContainText('2 /')

    // Navigate with keyboard
    await page.keyboard.press('ArrowRight')
    await expect(counter).toContainText('3 /')

    await page.keyboard.press('ArrowLeft')
    await expect(counter).toContainText('2 /')

    // Close lightbox
    await page.keyboard.press('Escape')
    await expect(lightbox).not.toBeVisible()
  })
})
