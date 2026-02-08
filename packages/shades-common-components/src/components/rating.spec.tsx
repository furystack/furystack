import { Injector } from '@furystack/inject'
import { createComponent, initializeShadeRoot } from '@furystack/shades'
import { sleepAsync, usingAsync } from '@furystack/utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ThemeProviderService } from '../services/theme-provider-service.js'
import { Rating } from './rating.js'

describe('Rating', () => {
  beforeEach(() => {
    document.body.innerHTML = '<div id="root"></div>'
  })

  afterEach(() => {
    document.body.innerHTML = ''
    vi.restoreAllMocks()
  })

  it('should render with shadow DOM', async () => {
    await usingAsync(new Injector(), async (injector) => {
      const rootElement = document.getElementById('root') as HTMLDivElement

      initializeShadeRoot({
        injector,
        rootElement,
        jsxElement: <Rating />,
      })

      await sleepAsync(50)

      const rating = document.querySelector('shade-rating')
      expect(rating).not.toBeNull()
    })
  })

  it('should render 5 stars by default', async () => {
    await usingAsync(new Injector(), async (injector) => {
      const rootElement = document.getElementById('root') as HTMLDivElement

      initializeShadeRoot({
        injector,
        rootElement,
        jsxElement: <Rating />,
      })

      await sleepAsync(50)

      const stars = document.querySelectorAll('shade-rating .rating-star')
      expect(stars.length).toBe(5)
    })
  })

  it('should render custom number of stars with max prop', async () => {
    await usingAsync(new Injector(), async (injector) => {
      const rootElement = document.getElementById('root') as HTMLDivElement

      initializeShadeRoot({
        injector,
        rootElement,
        jsxElement: <Rating max={10} />,
      })

      await sleepAsync(50)

      const stars = document.querySelectorAll('shade-rating .rating-star')
      expect(stars.length).toBe(10)
    })
  })

  describe('value display', () => {
    it('should show filled stars based on value', async () => {
      await usingAsync(new Injector(), async (injector) => {
        const rootElement = document.getElementById('root') as HTMLDivElement

        initializeShadeRoot({
          injector,
          rootElement,
          jsxElement: <Rating value={3} />,
        })

        await sleepAsync(50)

        const filledSpans = document.querySelectorAll('shade-rating .star-filled')
        expect((filledSpans[0] as HTMLElement).style.width).toBe('100%')
        expect((filledSpans[1] as HTMLElement).style.width).toBe('100%')
        expect((filledSpans[2] as HTMLElement).style.width).toBe('100%')
        expect((filledSpans[3] as HTMLElement).style.width).toBe('0%')
        expect((filledSpans[4] as HTMLElement).style.width).toBe('0%')
      })
    })

    it('should show half-filled stars with precision=0.5', async () => {
      await usingAsync(new Injector(), async (injector) => {
        const rootElement = document.getElementById('root') as HTMLDivElement

        initializeShadeRoot({
          injector,
          rootElement,
          jsxElement: <Rating value={2.5} precision={0.5} />,
        })

        await sleepAsync(50)

        const filledSpans = document.querySelectorAll('shade-rating .star-filled')
        expect((filledSpans[0] as HTMLElement).style.width).toBe('100%')
        expect((filledSpans[1] as HTMLElement).style.width).toBe('100%')
        expect((filledSpans[2] as HTMLElement).style.width).toBe('50%')
        expect((filledSpans[3] as HTMLElement).style.width).toBe('0%')
        expect((filledSpans[4] as HTMLElement).style.width).toBe('0%')
      })
    })

    it('should show no filled stars when value is 0', async () => {
      await usingAsync(new Injector(), async (injector) => {
        const rootElement = document.getElementById('root') as HTMLDivElement

        initializeShadeRoot({
          injector,
          rootElement,
          jsxElement: <Rating value={0} />,
        })

        await sleepAsync(50)

        const filledSpans = document.querySelectorAll('shade-rating .star-filled')
        expect(filledSpans.length).toBe(5)
        for (const span of filledSpans) {
          expect((span as HTMLElement).style.width).toBe('0%')
        }
      })
    })
  })

  describe('interaction', () => {
    it('should call onchange when a star is clicked', async () => {
      await usingAsync(new Injector(), async (injector) => {
        const rootElement = document.getElementById('root') as HTMLDivElement
        const onchange = vi.fn()

        initializeShadeRoot({
          injector,
          rootElement,
          jsxElement: <Rating value={0} onValueChange={onchange} />,
        })

        await sleepAsync(50)

        const stars = document.querySelectorAll('shade-rating .rating-star')
        ;(stars[2] as HTMLElement).dispatchEvent(new MouseEvent('click', { bubbles: true }))

        await sleepAsync(50)

        expect(onchange).toHaveBeenCalledWith(3)
      })
    })

    it('should not call onchange when disabled', async () => {
      await usingAsync(new Injector(), async (injector) => {
        const rootElement = document.getElementById('root') as HTMLDivElement
        const onchange = vi.fn()

        initializeShadeRoot({
          injector,
          rootElement,
          jsxElement: <Rating value={0} onValueChange={onchange} disabled />,
        })

        await sleepAsync(50)

        const stars = document.querySelectorAll('shade-rating .rating-star')
        ;(stars[2] as HTMLElement).dispatchEvent(new MouseEvent('click', { bubbles: true }))

        await sleepAsync(50)

        expect(onchange).not.toHaveBeenCalled()
      })
    })

    it('should not call onchange when readOnly', async () => {
      await usingAsync(new Injector(), async (injector) => {
        const rootElement = document.getElementById('root') as HTMLDivElement
        const onchange = vi.fn()

        initializeShadeRoot({
          injector,
          rootElement,
          jsxElement: <Rating value={3} onValueChange={onchange} readOnly />,
        })

        await sleepAsync(50)

        const stars = document.querySelectorAll('shade-rating .rating-star')
        ;(stars[0] as HTMLElement).dispatchEvent(new MouseEvent('click', { bubbles: true }))

        await sleepAsync(50)

        expect(onchange).not.toHaveBeenCalled()
      })
    })
  })

  describe('keyboard navigation', () => {
    it('should increase value with ArrowRight', async () => {
      await usingAsync(new Injector(), async (injector) => {
        const rootElement = document.getElementById('root') as HTMLDivElement
        const onchange = vi.fn()

        initializeShadeRoot({
          injector,
          rootElement,
          jsxElement: <Rating value={3} onValueChange={onchange} />,
        })

        await sleepAsync(50)

        const ratingEl = document.querySelector('shade-rating') as HTMLElement
        ratingEl.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }))

        await sleepAsync(50)

        expect(onchange).toHaveBeenCalledWith(4)
      })
    })

    it('should decrease value with ArrowLeft', async () => {
      await usingAsync(new Injector(), async (injector) => {
        const rootElement = document.getElementById('root') as HTMLDivElement
        const onchange = vi.fn()

        initializeShadeRoot({
          injector,
          rootElement,
          jsxElement: <Rating value={3} onValueChange={onchange} />,
        })

        await sleepAsync(50)

        const ratingEl = document.querySelector('shade-rating') as HTMLElement
        ratingEl.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true }))

        await sleepAsync(50)

        expect(onchange).toHaveBeenCalledWith(2)
      })
    })

    it('should use 0.5 step with precision=0.5', async () => {
      await usingAsync(new Injector(), async (injector) => {
        const rootElement = document.getElementById('root') as HTMLDivElement
        const onchange = vi.fn()

        initializeShadeRoot({
          injector,
          rootElement,
          jsxElement: <Rating value={3} precision={0.5} onValueChange={onchange} />,
        })

        await sleepAsync(50)

        const ratingEl = document.querySelector('shade-rating') as HTMLElement
        ratingEl.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }))

        await sleepAsync(50)

        expect(onchange).toHaveBeenCalledWith(3.5)
      })
    })

    it('should not exceed max value', async () => {
      await usingAsync(new Injector(), async (injector) => {
        const rootElement = document.getElementById('root') as HTMLDivElement
        const onchange = vi.fn()

        initializeShadeRoot({
          injector,
          rootElement,
          jsxElement: <Rating value={5} onValueChange={onchange} />,
        })

        await sleepAsync(50)

        const ratingEl = document.querySelector('shade-rating') as HTMLElement
        ratingEl.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }))

        await sleepAsync(50)

        expect(onchange).not.toHaveBeenCalled()
      })
    })

    it('should not go below 0', async () => {
      await usingAsync(new Injector(), async (injector) => {
        const rootElement = document.getElementById('root') as HTMLDivElement
        const onchange = vi.fn()

        initializeShadeRoot({
          injector,
          rootElement,
          jsxElement: <Rating value={0} onValueChange={onchange} />,
        })

        await sleepAsync(50)

        const ratingEl = document.querySelector('shade-rating') as HTMLElement
        ratingEl.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true }))

        await sleepAsync(50)

        expect(onchange).not.toHaveBeenCalled()
      })
    })
  })

  describe('disabled state', () => {
    it('should set data-disabled attribute when disabled', async () => {
      await usingAsync(new Injector(), async (injector) => {
        const rootElement = document.getElementById('root') as HTMLDivElement

        initializeShadeRoot({
          injector,
          rootElement,
          jsxElement: <Rating disabled />,
        })

        await sleepAsync(50)

        const wrapper = document.querySelector('shade-rating') as HTMLElement
        expect(wrapper.hasAttribute('data-disabled')).toBe(true)
        expect(wrapper.getAttribute('aria-disabled')).toBe('true')
      })
    })

    it('should not have data-disabled when not disabled', async () => {
      await usingAsync(new Injector(), async (injector) => {
        const rootElement = document.getElementById('root') as HTMLDivElement

        initializeShadeRoot({
          injector,
          rootElement,
          jsxElement: <Rating />,
        })

        await sleepAsync(50)

        const wrapper = document.querySelector('shade-rating') as HTMLElement
        expect(wrapper.hasAttribute('data-disabled')).toBe(false)
      })
    })
  })

  describe('readOnly state', () => {
    it('should set data-readonly attribute when readOnly', async () => {
      await usingAsync(new Injector(), async (injector) => {
        const rootElement = document.getElementById('root') as HTMLDivElement

        initializeShadeRoot({
          injector,
          rootElement,
          jsxElement: <Rating readOnly />,
        })

        await sleepAsync(50)

        const wrapper = document.querySelector('shade-rating') as HTMLElement
        expect(wrapper.hasAttribute('data-readonly')).toBe(true)
        expect(wrapper.getAttribute('role')).toBe('img')
      })
    })
  })

  describe('custom icons', () => {
    it('should use custom filled and empty icons', async () => {
      await usingAsync(new Injector(), async (injector) => {
        const rootElement = document.getElementById('root') as HTMLDivElement

        initializeShadeRoot({
          injector,
          rootElement,
          jsxElement: <Rating value={1} icon="❤️" emptyIcon="🤍" />,
        })

        await sleepAsync(50)

        const emptySpans = document.querySelectorAll('shade-rating .star-empty')
        const filledSpans = document.querySelectorAll('shade-rating .star-filled')

        expect(emptySpans[0]?.textContent).toBe('🤍')
        expect(filledSpans[0]?.textContent).toBe('❤️')
      })
    })
  })

  describe('size', () => {
    it('should set data-size attribute', async () => {
      await usingAsync(new Injector(), async (injector) => {
        const rootElement = document.getElementById('root') as HTMLDivElement

        initializeShadeRoot({
          injector,
          rootElement,
          jsxElement: <Rating size="large" />,
        })

        await sleepAsync(50)

        const wrapper = document.querySelector('shade-rating') as HTMLElement
        expect(wrapper.getAttribute('data-size')).toBe('large')
      })
    })

    it('should default to medium size', async () => {
      await usingAsync(new Injector(), async (injector) => {
        const rootElement = document.getElementById('root') as HTMLDivElement

        initializeShadeRoot({
          injector,
          rootElement,
          jsxElement: <Rating />,
        })

        await sleepAsync(50)

        const wrapper = document.querySelector('shade-rating') as HTMLElement
        expect(wrapper.getAttribute('data-size')).toBe('medium')
      })
    })
  })

  describe('theme integration', () => {
    it('should set CSS color variable from theme (default warning)', async () => {
      await usingAsync(new Injector(), async (injector) => {
        const rootElement = document.getElementById('root') as HTMLDivElement

        initializeShadeRoot({
          injector,
          rootElement,
          jsxElement: <Rating />,
        })

        await sleepAsync(50)

        const wrapper = document.querySelector('shade-rating') as HTMLElement
        const themeService = injector.getInstance(ThemeProviderService)
        expect(wrapper.style.getPropertyValue('--rating-color')).toBe(themeService.theme.palette.warning.main)
      })
    })

    it('should use custom color from color prop', async () => {
      await usingAsync(new Injector(), async (injector) => {
        const rootElement = document.getElementById('root') as HTMLDivElement

        initializeShadeRoot({
          injector,
          rootElement,
          jsxElement: <Rating color="primary" />,
        })

        await sleepAsync(50)

        const wrapper = document.querySelector('shade-rating') as HTMLElement
        const themeService = injector.getInstance(ThemeProviderService)
        expect(wrapper.style.getPropertyValue('--rating-color')).toBe(themeService.theme.palette.primary.main)
      })
    })
  })

  describe('accessibility', () => {
    it('should have slider role when interactive', async () => {
      await usingAsync(new Injector(), async (injector) => {
        const rootElement = document.getElementById('root') as HTMLDivElement

        initializeShadeRoot({
          injector,
          rootElement,
          jsxElement: <Rating value={3} max={5} />,
        })

        await sleepAsync(50)

        const wrapper = document.querySelector('shade-rating') as HTMLElement
        expect(wrapper.getAttribute('role')).toBe('slider')
        expect(wrapper.getAttribute('aria-valuenow')).toBe('3')
        expect(wrapper.getAttribute('aria-valuemin')).toBe('0')
        expect(wrapper.getAttribute('aria-valuemax')).toBe('5')
        expect(wrapper.getAttribute('tabindex')).toBe('0')
      })
    })

    it('should have img role when readOnly', async () => {
      await usingAsync(new Injector(), async (injector) => {
        const rootElement = document.getElementById('root') as HTMLDivElement

        initializeShadeRoot({
          injector,
          rootElement,
          jsxElement: <Rating value={3} max={5} readOnly />,
        })

        await sleepAsync(50)

        const wrapper = document.querySelector('shade-rating') as HTMLElement
        expect(wrapper.getAttribute('role')).toBe('img')
        expect(wrapper.getAttribute('aria-label')).toBe('Rating: 3 out of 5')
        expect(wrapper.hasAttribute('tabindex')).toBe(false)
      })
    })
  })

  describe('hidden input', () => {
    it('should render hidden input with name and value', async () => {
      await usingAsync(new Injector(), async (injector) => {
        const rootElement = document.getElementById('root') as HTMLDivElement

        initializeShadeRoot({
          injector,
          rootElement,
          jsxElement: <Rating name="userRating" value={4} />,
        })

        await sleepAsync(50)

        const input = document.querySelector('shade-rating input[type="hidden"]') as HTMLInputElement
        expect(input).not.toBeNull()
        expect(input.name).toBe('userRating')
        expect(input.value).toBe('4')
      })
    })

    it('should not render hidden input without name', async () => {
      await usingAsync(new Injector(), async (injector) => {
        const rootElement = document.getElementById('root') as HTMLDivElement

        initializeShadeRoot({
          injector,
          rootElement,
          jsxElement: <Rating value={4} />,
        })

        await sleepAsync(50)

        const input = document.querySelector('shade-rating input[type="hidden"]')
        expect(input).toBeNull()
      })
    })
  })
})
