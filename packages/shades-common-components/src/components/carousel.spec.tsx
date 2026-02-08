import { Injector } from '@furystack/inject'
import { createComponent, initializeShadeRoot } from '@furystack/shades'
import { sleepAsync, usingAsync } from '@furystack/utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { Carousel } from './carousel.js'

describe('Carousel', () => {
  beforeEach(() => {
    document.body.innerHTML = '<div id="root"></div>'
  })

  afterEach(() => {
    document.body.innerHTML = ''
  })

  const createSlides = (): JSX.Element[] => [
    <div id="slide-1">Slide 1</div>,
    <div id="slide-2">Slide 2</div>,
    <div id="slide-3">Slide 3</div>,
  ]

  it('should render all slides', async () => {
    await usingAsync(new Injector(), async (injector) => {
      const rootElement = document.getElementById('root') as HTMLDivElement

      initializeShadeRoot({
        injector,
        rootElement,
        jsxElement: <Carousel slides={createSlides()} />,
      })

      await sleepAsync(100)

      expect(document.getElementById('slide-1')).toBeTruthy()
      expect(document.getElementById('slide-2')).toBeTruthy()
      expect(document.getElementById('slide-3')).toBeTruthy()
    })
  })

  it('should render dot indicators by default', async () => {
    await usingAsync(new Injector(), async (injector) => {
      const rootElement = document.getElementById('root') as HTMLDivElement

      initializeShadeRoot({
        injector,
        rootElement,
        jsxElement: <Carousel slides={createSlides()} />,
      })

      await sleepAsync(100)

      const dots = document.querySelectorAll('.carousel-dot')
      expect(dots.length).toBe(3)
    })
  })

  it('should hide dots when dots prop is false', async () => {
    await usingAsync(new Injector(), async (injector) => {
      const rootElement = document.getElementById('root') as HTMLDivElement

      initializeShadeRoot({
        injector,
        rootElement,
        jsxElement: <Carousel slides={createSlides()} dots={false} />,
      })

      await sleepAsync(100)

      const dots = document.querySelectorAll('.carousel-dot')
      expect(dots.length).toBe(0)
    })
  })

  it('should render prev and next arrow buttons', async () => {
    await usingAsync(new Injector(), async (injector) => {
      const rootElement = document.getElementById('root') as HTMLDivElement

      initializeShadeRoot({
        injector,
        rootElement,
        jsxElement: <Carousel slides={createSlides()} />,
      })

      await sleepAsync(100)

      const prevButton = document.querySelector('.carousel-arrow-prev')
      const nextButton = document.querySelector('.carousel-arrow-next')
      expect(prevButton).toBeTruthy()
      expect(nextButton).toBeTruthy()
    })
  })

  it('should not render arrows or dots for a single slide', async () => {
    await usingAsync(new Injector(), async (injector) => {
      const rootElement = document.getElementById('root') as HTMLDivElement

      initializeShadeRoot({
        injector,
        rootElement,
        jsxElement: <Carousel slides={[<div>Only slide</div>]} />,
      })

      await sleepAsync(100)

      const arrows = document.querySelectorAll('.carousel-arrow')
      const dots = document.querySelectorAll('.carousel-dot')
      expect(arrows.length).toBe(0)
      expect(dots.length).toBe(0)
    })
  })

  it('should set the first dot as active by default', async () => {
    await usingAsync(new Injector(), async (injector) => {
      const rootElement = document.getElementById('root') as HTMLDivElement

      initializeShadeRoot({
        injector,
        rootElement,
        jsxElement: <Carousel slides={createSlides()} />,
      })

      await sleepAsync(100)

      const activeDots = document.querySelectorAll('.carousel-dot[data-active]')
      expect(activeDots.length).toBe(1)

      const dots = document.querySelectorAll('.carousel-dot')
      expect(dots[0].hasAttribute('data-active')).toBe(true)
    })
  })

  it('should respect defaultActiveIndex', async () => {
    await usingAsync(new Injector(), async (injector) => {
      const rootElement = document.getElementById('root') as HTMLDivElement

      initializeShadeRoot({
        injector,
        rootElement,
        jsxElement: <Carousel slides={createSlides()} defaultActiveIndex={2} />,
      })

      await sleepAsync(100)

      const dots = document.querySelectorAll('.carousel-dot')
      expect(dots[2].hasAttribute('data-active')).toBe(true)
      expect(dots[0].hasAttribute('data-active')).toBe(false)
    })
  })

  it('should set the vertical data attribute', async () => {
    await usingAsync(new Injector(), async (injector) => {
      const rootElement = document.getElementById('root') as HTMLDivElement

      initializeShadeRoot({
        injector,
        rootElement,
        jsxElement: <Carousel slides={createSlides()} vertical />,
      })

      await sleepAsync(100)

      const carousel = document.querySelector('shade-carousel') as HTMLElement
      expect(carousel.hasAttribute('data-vertical')).toBe(true)
    })
  })

  it('should use slide effect by default', async () => {
    await usingAsync(new Injector(), async (injector) => {
      const rootElement = document.getElementById('root') as HTMLDivElement

      initializeShadeRoot({
        injector,
        rootElement,
        jsxElement: <Carousel slides={createSlides()} />,
      })

      await sleepAsync(100)

      const track = document.querySelector('.carousel-track')
      expect(track).toBeTruthy()
      expect(document.querySelector('.carousel-fade-container')).toBeFalsy()
    })
  })

  it('should use fade effect when specified', async () => {
    await usingAsync(new Injector(), async (injector) => {
      const rootElement = document.getElementById('root') as HTMLDivElement

      initializeShadeRoot({
        injector,
        rootElement,
        jsxElement: <Carousel slides={createSlides()} effect="fade" />,
      })

      await sleepAsync(100)

      const fadeContainer = document.querySelector('.carousel-fade-container')
      expect(fadeContainer).toBeTruthy()
      expect(document.querySelector('.carousel-track')).toBeFalsy()
    })
  })

  it('should mark the first fade slide as active by default', async () => {
    await usingAsync(new Injector(), async (injector) => {
      const rootElement = document.getElementById('root') as HTMLDivElement

      initializeShadeRoot({
        injector,
        rootElement,
        jsxElement: <Carousel slides={createSlides()} effect="fade" />,
      })

      await sleepAsync(100)

      const fadeSlides = document.querySelectorAll('.carousel-fade-slide')
      expect(fadeSlides[0].hasAttribute('data-active')).toBe(true)
      expect(fadeSlides[1].hasAttribute('data-active')).toBe(false)
    })
  })

  it('should have proper ARIA attributes on host element', async () => {
    await usingAsync(new Injector(), async (injector) => {
      const rootElement = document.getElementById('root') as HTMLDivElement

      initializeShadeRoot({
        injector,
        rootElement,
        jsxElement: <Carousel slides={createSlides()} />,
      })

      await sleepAsync(100)

      const carousel = document.querySelector('shade-carousel') as HTMLElement
      expect(carousel.getAttribute('role')).toBe('region')
      expect(carousel.getAttribute('aria-roledescription')).toBe('carousel')
      expect(carousel.getAttribute('tabindex')).toBe('0')
    })
  })

  it('should render slide groups with role attribute', async () => {
    await usingAsync(new Injector(), async (injector) => {
      const rootElement = document.getElementById('root') as HTMLDivElement

      initializeShadeRoot({
        injector,
        rootElement,
        jsxElement: <Carousel slides={createSlides()} />,
      })

      await sleepAsync(100)

      const carousel = document.querySelector('shade-carousel') as HTMLElement
      const slideGroups = carousel.querySelectorAll('[role="group"]')
      expect(slideGroups.length).toBe(3)
    })
  })

  it('should call onChange when navigating via dots', async () => {
    const handleChange = vi.fn()

    await usingAsync(new Injector(), async (injector) => {
      const rootElement = document.getElementById('root') as HTMLDivElement

      initializeShadeRoot({
        injector,
        rootElement,
        jsxElement: <Carousel slides={createSlides()} onChange={handleChange} />,
      })

      await sleepAsync(100)

      const dots = document.querySelectorAll('.carousel-dot')
      ;(dots[2] as HTMLButtonElement).click()

      expect(handleChange).toHaveBeenCalledWith(2)
    })
  })

  it('should call onChange when navigating via arrows', async () => {
    const handleChange = vi.fn()

    await usingAsync(new Injector(), async (injector) => {
      const rootElement = document.getElementById('root') as HTMLDivElement

      initializeShadeRoot({
        injector,
        rootElement,
        jsxElement: <Carousel slides={createSlides()} onChange={handleChange} />,
      })

      await sleepAsync(100)

      const nextButton = document.querySelector('.carousel-arrow-next') as HTMLButtonElement
      nextButton.click()

      expect(handleChange).toHaveBeenCalledWith(1)
    })
  })

  it('should wrap around when navigating past the last slide', async () => {
    const handleChange = vi.fn()

    await usingAsync(new Injector(), async (injector) => {
      const rootElement = document.getElementById('root') as HTMLDivElement

      initializeShadeRoot({
        injector,
        rootElement,
        jsxElement: <Carousel slides={createSlides()} defaultActiveIndex={2} onChange={handleChange} />,
      })

      await sleepAsync(100)

      const nextButton = document.querySelector('.carousel-arrow-next') as HTMLButtonElement
      nextButton.click()

      expect(handleChange).toHaveBeenCalledWith(0)
    })
  })

  it('should wrap around when navigating before the first slide', async () => {
    const handleChange = vi.fn()

    await usingAsync(new Injector(), async (injector) => {
      const rootElement = document.getElementById('root') as HTMLDivElement

      initializeShadeRoot({
        injector,
        rootElement,
        jsxElement: <Carousel slides={createSlides()} onChange={handleChange} />,
      })

      await sleepAsync(100)

      const prevButton = document.querySelector('.carousel-arrow-prev') as HTMLButtonElement
      prevButton.click()

      expect(handleChange).toHaveBeenCalledWith(2)
    })
  })

  it('should render horizontal arrows with correct symbols', async () => {
    await usingAsync(new Injector(), async (injector) => {
      const rootElement = document.getElementById('root') as HTMLDivElement

      initializeShadeRoot({
        injector,
        rootElement,
        jsxElement: <Carousel slides={createSlides()} />,
      })

      await sleepAsync(100)

      const prevButton = document.querySelector('.carousel-arrow-prev') as HTMLButtonElement
      const nextButton = document.querySelector('.carousel-arrow-next') as HTMLButtonElement
      expect(prevButton.textContent).toContain('◀')
      expect(nextButton.textContent).toContain('▶')
    })
  })

  it('should render vertical arrows with correct symbols', async () => {
    await usingAsync(new Injector(), async (injector) => {
      const rootElement = document.getElementById('root') as HTMLDivElement

      initializeShadeRoot({
        injector,
        rootElement,
        jsxElement: <Carousel slides={createSlides()} vertical />,
      })

      await sleepAsync(100)

      const prevButton = document.querySelector('.carousel-arrow-prev') as HTMLButtonElement
      const nextButton = document.querySelector('.carousel-arrow-next') as HTMLButtonElement
      expect(prevButton.textContent).toContain('▲')
      expect(nextButton.textContent).toContain('▼')
    })
  })

  it('should clamp defaultActiveIndex to valid range', async () => {
    await usingAsync(new Injector(), async (injector) => {
      const rootElement = document.getElementById('root') as HTMLDivElement

      initializeShadeRoot({
        injector,
        rootElement,
        jsxElement: <Carousel slides={createSlides()} defaultActiveIndex={99} />,
      })

      await sleepAsync(100)

      const dots = document.querySelectorAll('.carousel-dot')
      // Should clamp to last slide (index 2)
      expect(dots[2].hasAttribute('data-active')).toBe(true)
    })
  })

  it('should apply custom style', async () => {
    await usingAsync(new Injector(), async (injector) => {
      const rootElement = document.getElementById('root') as HTMLDivElement

      initializeShadeRoot({
        injector,
        rootElement,
        jsxElement: <Carousel slides={createSlides()} style={{ height: '300px' }} />,
      })

      await sleepAsync(100)

      const carousel = document.querySelector('shade-carousel') as HTMLElement
      expect(carousel.style.height).toBe('300px')
    })
  })

  it('should handle empty slides array gracefully', async () => {
    await usingAsync(new Injector(), async (injector) => {
      const rootElement = document.getElementById('root') as HTMLDivElement

      initializeShadeRoot({
        injector,
        rootElement,
        jsxElement: <Carousel slides={[]} />,
      })

      await sleepAsync(100)

      const carousel = document.querySelector('shade-carousel') as HTMLElement
      expect(carousel).toBeTruthy()
      expect(document.querySelectorAll('.carousel-dot').length).toBe(0)
      expect(document.querySelectorAll('.carousel-arrow').length).toBe(0)
    })
  })
})
