import { Injector } from '@furystack/inject'
import { createComponent, initializeShadeRoot } from '@furystack/shades'
import { sleepAsync, usingAsync } from '@furystack/utils'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { Image, ImageGroup } from './image.js'

describe('Image component', () => {
  beforeEach(() => {
    document.body.innerHTML = '<div id="root"></div>'
  })

  afterEach(() => {
    document.body.innerHTML = ''
  })

  it('should render an image with the provided src and alt', async () => {
    await usingAsync(new Injector(), async (injector) => {
      const rootElement = document.getElementById('root') as HTMLDivElement
      const testSrc = 'https://example.com/photo.jpg'
      const testAlt = 'Test photo'

      initializeShadeRoot({
        injector,
        rootElement,
        jsxElement: <Image src={testSrc} alt={testAlt} />,
      })

      await sleepAsync(50)

      const imageComponent = document.querySelector('shade-image')
      expect(imageComponent).not.toBeNull()

      const img = imageComponent?.querySelector('img')
      expect(img).not.toBeNull()
      expect(img?.src).toBe(testSrc)
      expect(img?.alt).toBe(testAlt)
    })
  })

  it('should render with default alt when not provided', async () => {
    await usingAsync(new Injector(), async (injector) => {
      const rootElement = document.getElementById('root') as HTMLDivElement

      initializeShadeRoot({
        injector,
        rootElement,
        jsxElement: <Image src="https://example.com/photo.jpg" />,
      })

      await sleepAsync(50)

      const img = document.querySelector('shade-image img')
      expect(img).not.toBeNull()
      expect((img as HTMLImageElement)?.alt).toBe('')
    })
  })

  it('should apply width and height props', async () => {
    await usingAsync(new Injector(), async (injector) => {
      const rootElement = document.getElementById('root') as HTMLDivElement

      initializeShadeRoot({
        injector,
        rootElement,
        jsxElement: <Image src="https://example.com/photo.jpg" width="300px" height="200px" />,
      })

      await sleepAsync(50)

      const img = document.querySelector('shade-image img') as HTMLImageElement
      expect(img).not.toBeNull()
      expect(img.style.width).toBe('300px')
      expect(img.style.height).toBe('200px')
    })
  })

  it('should apply objectFit prop', async () => {
    await usingAsync(new Injector(), async (injector) => {
      const rootElement = document.getElementById('root') as HTMLDivElement

      initializeShadeRoot({
        injector,
        rootElement,
        jsxElement: <Image src="https://example.com/photo.jpg" objectFit="contain" />,
      })

      await sleepAsync(50)

      const img = document.querySelector('shade-image img') as HTMLImageElement
      expect(img).not.toBeNull()
      expect(img.style.objectFit).toBe('contain')
    })
  })

  it('should set loading="lazy" when lazy prop is true', async () => {
    await usingAsync(new Injector(), async (injector) => {
      const rootElement = document.getElementById('root') as HTMLDivElement

      initializeShadeRoot({
        injector,
        rootElement,
        jsxElement: <Image src="https://example.com/photo.jpg" lazy />,
      })

      await sleepAsync(50)

      const img = document.querySelector('shade-image img') as HTMLImageElement
      expect(img).not.toBeNull()
      expect(img.loading).toBe('lazy')
    })
  })

  it('should not set loading="lazy" by default', async () => {
    await usingAsync(new Injector(), async (injector) => {
      const rootElement = document.getElementById('root') as HTMLDivElement

      initializeShadeRoot({
        injector,
        rootElement,
        jsxElement: <Image src="https://example.com/photo.jpg" />,
      })

      await sleepAsync(50)

      const img = document.querySelector('shade-image img') as HTMLImageElement
      expect(img).not.toBeNull()
      expect(img.loading).not.toBe('lazy')
    })
  })

  it('should show default fallback when image fails to load', async () => {
    await usingAsync(new Injector(), async (injector) => {
      const rootElement = document.getElementById('root') as HTMLDivElement

      initializeShadeRoot({
        injector,
        rootElement,
        jsxElement: <Image src="invalid-url" />,
      })

      await sleepAsync(50)

      const imageComponent = document.querySelector('shade-image')
      expect(imageComponent).not.toBeNull()

      const img = imageComponent?.querySelector('img') as HTMLImageElement
      expect(img).not.toBeNull()

      const errorEvent = new Event('error')
      img.dispatchEvent(errorEvent)

      await sleepAsync(50)

      expect(img.style.display).toBe('none')

      const fallback = imageComponent?.querySelector('.image-fallback') as HTMLElement
      expect(fallback).not.toBeNull()
      expect(fallback.style.display).toBe('flex')
      expect(fallback.querySelector('shade-icon')).not.toBeNull()
    })
  })

  it('should show custom fallback when image fails to load', async () => {
    await usingAsync(new Injector(), async (injector) => {
      const rootElement = document.getElementById('root') as HTMLDivElement

      initializeShadeRoot({
        injector,
        rootElement,
        jsxElement: <Image src="invalid-url" fallback={<span data-testid="custom-fallback">Image not found</span>} />,
      })

      await sleepAsync(50)

      const imageComponent = document.querySelector('shade-image')
      const img = imageComponent?.querySelector('img') as HTMLImageElement

      const errorEvent = new Event('error')
      img.dispatchEvent(errorEvent)

      await sleepAsync(50)

      const customFallback = imageComponent?.querySelector('[data-testid="custom-fallback"]')
      expect(customFallback).not.toBeNull()
      expect(customFallback?.textContent).toBe('Image not found')
    })
  })

  it('should set data-preview attribute when preview is enabled', async () => {
    await usingAsync(new Injector(), async (injector) => {
      const rootElement = document.getElementById('root') as HTMLDivElement

      initializeShadeRoot({
        injector,
        rootElement,
        jsxElement: <Image src="https://example.com/photo.jpg" preview />,
      })

      await sleepAsync(50)

      const imageComponent = document.querySelector('shade-image') as HTMLElement
      expect(imageComponent).not.toBeNull()
      expect(imageComponent.hasAttribute('data-preview')).toBe(true)

      const previewIcon = imageComponent.querySelector('.image-preview-icon')
      expect(previewIcon).not.toBeNull()
    })
  })

  it('should not show preview icon when preview is disabled', async () => {
    await usingAsync(new Injector(), async (injector) => {
      const rootElement = document.getElementById('root') as HTMLDivElement

      initializeShadeRoot({
        injector,
        rootElement,
        jsxElement: <Image src="https://example.com/photo.jpg" />,
      })

      await sleepAsync(50)

      const imageComponent = document.querySelector('shade-image') as HTMLElement
      expect(imageComponent.hasAttribute('data-preview')).toBe(false)

      const previewIcon = imageComponent.querySelector('.image-preview-icon')
      expect(previewIcon).toBeNull()
    })
  })

  it('should open lightbox when clicking a preview-enabled image', async () => {
    await usingAsync(new Injector(), async (injector) => {
      const rootElement = document.getElementById('root') as HTMLDivElement

      initializeShadeRoot({
        injector,
        rootElement,
        jsxElement: <Image src="https://example.com/photo.jpg" alt="My photo" preview />,
      })

      await sleepAsync(50)

      const img = document.querySelector('shade-image img') as HTMLImageElement
      img.click()

      await sleepAsync(50)

      const lightbox = document.querySelector('.lightbox-backdrop')
      expect(lightbox).not.toBeNull()

      const lightboxImg = lightbox?.querySelector('.lightbox-image') as HTMLImageElement
      expect(lightboxImg).not.toBeNull()
      expect(lightboxImg.src).toBe('https://example.com/photo.jpg')
      expect(lightboxImg.alt).toBe('My photo')

      // Toolbar should be present
      const toolbar = lightbox?.querySelector('.lightbox-toolbar')
      expect(toolbar).not.toBeNull()

      // Clean up lightbox
      lightbox?.remove()
    })
  })

  it('should not open lightbox when clicking a non-preview image', async () => {
    await usingAsync(new Injector(), async (injector) => {
      const rootElement = document.getElementById('root') as HTMLDivElement

      initializeShadeRoot({
        injector,
        rootElement,
        jsxElement: <Image src="https://example.com/photo.jpg" />,
      })

      await sleepAsync(50)

      const img = document.querySelector('shade-image img') as HTMLImageElement
      img.click()

      await sleepAsync(50)

      const lightbox = document.querySelector('.lightbox-backdrop')
      expect(lightbox).toBeNull()
    })
  })

  it('should close lightbox when pressing Escape', async () => {
    await usingAsync(new Injector(), async (injector) => {
      const rootElement = document.getElementById('root') as HTMLDivElement

      initializeShadeRoot({
        injector,
        rootElement,
        jsxElement: <Image src="https://example.com/photo.jpg" preview />,
      })

      await sleepAsync(50)

      const img = document.querySelector('shade-image img') as HTMLImageElement
      img.click()

      await sleepAsync(50)

      let lightbox = document.querySelector('.lightbox-backdrop')
      expect(lightbox).not.toBeNull()

      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))

      await sleepAsync(200)

      lightbox = document.querySelector('.lightbox-backdrop')
      expect(lightbox).toBeNull()
    })
  })

  it('should have zoom controls in the lightbox', async () => {
    await usingAsync(new Injector(), async (injector) => {
      const rootElement = document.getElementById('root') as HTMLDivElement

      initializeShadeRoot({
        injector,
        rootElement,
        jsxElement: <Image src="https://example.com/photo.jpg" preview />,
      })

      await sleepAsync(50)

      const img = document.querySelector('shade-image img') as HTMLImageElement
      img.click()

      await sleepAsync(50)

      const lightbox = document.querySelector('.lightbox-backdrop')
      expect(lightbox).not.toBeNull()

      const zoomIn = lightbox?.querySelector('.lightbox-zoom-in')
      const zoomOut = lightbox?.querySelector('.lightbox-zoom-out')
      const rotate = lightbox?.querySelector('.lightbox-rotate')
      expect(zoomIn).not.toBeNull()
      expect(zoomOut).not.toBeNull()
      expect(rotate).not.toBeNull()

      // Clean up
      lightbox?.remove()
    })
  })

  it('should store src and alt as data attributes', async () => {
    await usingAsync(new Injector(), async (injector) => {
      const rootElement = document.getElementById('root') as HTMLDivElement

      initializeShadeRoot({
        injector,
        rootElement,
        jsxElement: <Image src="https://example.com/photo.jpg" alt="Test" />,
      })

      await sleepAsync(50)

      const imageComponent = document.querySelector('shade-image') as HTMLElement
      expect(imageComponent.getAttribute('data-src')).toBe('https://example.com/photo.jpg')
      expect(imageComponent.getAttribute('data-alt')).toBe('Test')
    })
  })
})

describe('ImageGroup component', () => {
  beforeEach(() => {
    document.body.innerHTML = '<div id="root"></div>'
  })

  afterEach(() => {
    document.body.innerHTML = ''
  })

  it('should render children images', async () => {
    await usingAsync(new Injector(), async (injector) => {
      const rootElement = document.getElementById('root') as HTMLDivElement

      initializeShadeRoot({
        injector,
        rootElement,
        jsxElement: (
          <ImageGroup>
            <Image src="https://example.com/1.jpg" alt="Image 1" preview />
            <Image src="https://example.com/2.jpg" alt="Image 2" preview />
            <Image src="https://example.com/3.jpg" alt="Image 3" preview />
          </ImageGroup>
        ),
      })

      await sleepAsync(50)

      const group = document.querySelector('shade-image-group')
      expect(group).not.toBeNull()

      const images = group?.querySelectorAll('shade-image')
      expect(images?.length).toBe(3)
    })
  })

  it('should apply gap prop', async () => {
    await usingAsync(new Injector(), async (injector) => {
      const rootElement = document.getElementById('root') as HTMLDivElement

      initializeShadeRoot({
        injector,
        rootElement,
        jsxElement: (
          <ImageGroup gap="16px">
            <Image src="https://example.com/1.jpg" preview />
            <Image src="https://example.com/2.jpg" preview />
          </ImageGroup>
        ),
      })

      await sleepAsync(50)

      const group = document.querySelector('shade-image-group') as HTMLElement
      expect(group).not.toBeNull()
      expect(group.style.gap).toBe('16px')
    })
  })

  it('should open lightbox with navigation when clicking an image in a group', async () => {
    await usingAsync(new Injector(), async (injector) => {
      const rootElement = document.getElementById('root') as HTMLDivElement

      initializeShadeRoot({
        injector,
        rootElement,
        jsxElement: (
          <ImageGroup>
            <Image src="https://example.com/1.jpg" alt="Image 1" preview />
            <Image src="https://example.com/2.jpg" alt="Image 2" preview />
            <Image src="https://example.com/3.jpg" alt="Image 3" preview />
          </ImageGroup>
        ),
      })

      await sleepAsync(50)

      const images = document.querySelectorAll('shade-image img')
      expect(images.length).toBe(3)

      // Click the second image
      ;(images[1] as HTMLImageElement).click()

      await sleepAsync(50)

      const lightbox = document.querySelector('.lightbox-backdrop')
      expect(lightbox).not.toBeNull()

      // Should have navigation arrows
      const prevBtn = lightbox?.querySelector('.lightbox-prev')
      const nextBtn = lightbox?.querySelector('.lightbox-next')
      expect(prevBtn).not.toBeNull()
      expect(nextBtn).not.toBeNull()

      // Should show the counter
      const counter = lightbox?.querySelector('.lightbox-counter')
      expect(counter).not.toBeNull()
      expect(counter?.textContent).toContain('2 / 3')

      // Clean up
      lightbox?.remove()
    })
  })

  it('should navigate to next image in group lightbox', async () => {
    await usingAsync(new Injector(), async (injector) => {
      const rootElement = document.getElementById('root') as HTMLDivElement

      initializeShadeRoot({
        injector,
        rootElement,
        jsxElement: (
          <ImageGroup>
            <Image src="https://example.com/1.jpg" alt="Image 1" preview />
            <Image src="https://example.com/2.jpg" alt="Image 2" preview />
            <Image src="https://example.com/3.jpg" alt="Image 3" preview />
          </ImageGroup>
        ),
      })

      await sleepAsync(50)

      const images = document.querySelectorAll('shade-image img')
      ;(images[0] as HTMLImageElement).click()

      await sleepAsync(50)

      const lightbox = document.querySelector('.lightbox-backdrop')
      expect(lightbox).not.toBeNull()

      const lightboxImg = lightbox?.querySelector('.lightbox-image') as HTMLImageElement
      expect(lightboxImg.src).toBe('https://example.com/1.jpg')

      // Click next
      const nextBtn = lightbox?.querySelector('.lightbox-next') as HTMLButtonElement
      nextBtn.click()

      await sleepAsync(50)

      expect(lightboxImg.src).toBe('https://example.com/2.jpg')

      const counter = lightbox?.querySelector('.lightbox-counter')
      expect(counter?.textContent).toContain('2 / 3')

      // Clean up
      lightbox?.remove()
    })
  })

  it('should navigate to previous image in group lightbox', async () => {
    await usingAsync(new Injector(), async (injector) => {
      const rootElement = document.getElementById('root') as HTMLDivElement

      initializeShadeRoot({
        injector,
        rootElement,
        jsxElement: (
          <ImageGroup>
            <Image src="https://example.com/1.jpg" alt="Image 1" preview />
            <Image src="https://example.com/2.jpg" alt="Image 2" preview />
            <Image src="https://example.com/3.jpg" alt="Image 3" preview />
          </ImageGroup>
        ),
      })

      await sleepAsync(50)

      const images = document.querySelectorAll('shade-image img')
      ;(images[0] as HTMLImageElement).click()

      await sleepAsync(50)

      const lightbox = document.querySelector('.lightbox-backdrop')
      const lightboxImg = lightbox?.querySelector('.lightbox-image') as HTMLImageElement

      // Click prev should wrap to last image
      const prevBtn = lightbox?.querySelector('.lightbox-prev') as HTMLButtonElement
      prevBtn.click()

      await sleepAsync(50)

      expect(lightboxImg.src).toBe('https://example.com/3.jpg')

      const counter = lightbox?.querySelector('.lightbox-counter')
      expect(counter?.textContent).toContain('3 / 3')

      // Clean up
      lightbox?.remove()
    })
  })

  it('should navigate with keyboard arrows in group lightbox', async () => {
    await usingAsync(new Injector(), async (injector) => {
      const rootElement = document.getElementById('root') as HTMLDivElement

      initializeShadeRoot({
        injector,
        rootElement,
        jsxElement: (
          <ImageGroup>
            <Image src="https://example.com/1.jpg" alt="Image 1" preview />
            <Image src="https://example.com/2.jpg" alt="Image 2" preview />
          </ImageGroup>
        ),
      })

      await sleepAsync(50)

      const images = document.querySelectorAll('shade-image img')
      ;(images[0] as HTMLImageElement).click()

      await sleepAsync(50)

      const lightbox = document.querySelector('.lightbox-backdrop')
      expect(lightbox).not.toBeNull()

      const lightboxImg = lightbox?.querySelector('.lightbox-image') as HTMLImageElement
      expect(lightboxImg.src).toBe('https://example.com/1.jpg')

      // Navigate with ArrowRight
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight' }))
      await sleepAsync(50)

      expect(lightboxImg.src).toBe('https://example.com/2.jpg')

      // Navigate with ArrowLeft
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft' }))
      await sleepAsync(50)

      expect(lightboxImg.src).toBe('https://example.com/1.jpg')

      // Clean up
      lightbox?.remove()
    })
  })

  it('should zoom in and out in the lightbox', async () => {
    await usingAsync(new Injector(), async (injector) => {
      const rootElement = document.getElementById('root') as HTMLDivElement

      initializeShadeRoot({
        injector,
        rootElement,
        jsxElement: <Image src="https://example.com/photo.jpg" preview />,
      })

      await sleepAsync(50)

      const img = document.querySelector('shade-image img') as HTMLImageElement
      img.click()

      await sleepAsync(50)

      const lightbox = document.querySelector('.lightbox-backdrop')
      expect(lightbox).not.toBeNull()

      const lightboxImg = lightbox?.querySelector('.lightbox-image') as HTMLImageElement

      // Zoom in
      const zoomInBtn = lightbox?.querySelector('.lightbox-zoom-in') as HTMLButtonElement
      zoomInBtn.click()
      await sleepAsync(50)

      expect(lightboxImg.style.transform).toContain('scale(1.25)')

      // Zoom out
      const zoomOutBtn = lightbox?.querySelector('.lightbox-zoom-out') as HTMLButtonElement
      zoomOutBtn.click()
      await sleepAsync(50)

      expect(lightboxImg.style.transform).toContain('scale(1)')

      // Clean up
      lightbox?.remove()
    })
  })

  it('should rotate in the lightbox', async () => {
    await usingAsync(new Injector(), async (injector) => {
      const rootElement = document.getElementById('root') as HTMLDivElement

      initializeShadeRoot({
        injector,
        rootElement,
        jsxElement: <Image src="https://example.com/photo.jpg" preview />,
      })

      await sleepAsync(50)

      const img = document.querySelector('shade-image img') as HTMLImageElement
      img.click()

      await sleepAsync(50)

      const lightbox = document.querySelector('.lightbox-backdrop')
      const lightboxImg = lightbox?.querySelector('.lightbox-image') as HTMLImageElement

      const rotateBtn = lightbox?.querySelector('.lightbox-rotate') as HTMLButtonElement
      rotateBtn.click()
      await sleepAsync(50)

      expect(lightboxImg.style.transform).toContain('rotate(90deg)')

      // Clean up
      lightbox?.remove()
    })
  })

  it('should close lightbox when clicking the close button', async () => {
    await usingAsync(new Injector(), async (injector) => {
      const rootElement = document.getElementById('root') as HTMLDivElement

      initializeShadeRoot({
        injector,
        rootElement,
        jsxElement: <Image src="https://example.com/photo.jpg" preview />,
      })

      await sleepAsync(50)

      const img = document.querySelector('shade-image img') as HTMLImageElement
      img.click()

      await sleepAsync(50)

      let lightbox = document.querySelector('.lightbox-backdrop')
      expect(lightbox).not.toBeNull()

      const closeBtn = lightbox?.querySelector('.lightbox-close') as HTMLButtonElement
      closeBtn.click()

      await sleepAsync(200)

      lightbox = document.querySelector('.lightbox-backdrop')
      expect(lightbox).toBeNull()
    })
  })

  it('should close lightbox when clicking the backdrop', async () => {
    await usingAsync(new Injector(), async (injector) => {
      const rootElement = document.getElementById('root') as HTMLDivElement

      initializeShadeRoot({
        injector,
        rootElement,
        jsxElement: <Image src="https://example.com/photo.jpg" preview />,
      })

      await sleepAsync(50)

      const img = document.querySelector('shade-image img') as HTMLImageElement
      img.click()

      await sleepAsync(50)

      const lightbox = document.querySelector('.lightbox-backdrop') as HTMLElement
      expect(lightbox).not.toBeNull()

      // Click on the backdrop itself (not child elements)
      lightbox.dispatchEvent(new MouseEvent('click', { bubbles: true }))

      await sleepAsync(200)

      expect(document.querySelector('.lightbox-backdrop')).toBeNull()
    })
  })

  it('should apply style overrides', async () => {
    await usingAsync(new Injector(), async (injector) => {
      const rootElement = document.getElementById('root') as HTMLDivElement

      initializeShadeRoot({
        injector,
        rootElement,
        jsxElement: <Image src="https://example.com/photo.jpg" style={{ margin: '10px' }} />,
      })

      await sleepAsync(50)

      const imageComponent = document.querySelector('shade-image') as HTMLElement
      expect(imageComponent.style.margin).toBe('10px')
    })
  })
})
