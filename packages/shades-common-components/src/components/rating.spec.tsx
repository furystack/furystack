import { createInjector } from '@furystack/inject'
import { createComponent, flushUpdates, initializeShadeRoot } from '@furystack/shades'
import { usingAsync } from '@furystack/utils'
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

  it('should render as custom element', async () => {
    await usingAsync(createInjector(), async (injector) => {
      const rootElement = document.getElementById('root') as HTMLDivElement

      initializeShadeRoot({
        injector,
        rootElement,
        jsxElement: <Rating />,
      })

      await flushUpdates()

      const rating = document.querySelector('shade-rating')
      expect(rating).not.toBeNull()
    })
  })

  it('should render 5 stars by default', async () => {
    await usingAsync(createInjector(), async (injector) => {
      const rootElement = document.getElementById('root') as HTMLDivElement

      initializeShadeRoot({
        injector,
        rootElement,
        jsxElement: <Rating />,
      })

      await flushUpdates()

      const stars = document.querySelectorAll('shade-rating .rating-star')
      expect(stars.length).toBe(5)
    })
  })

  it('should render custom number of stars with max prop', async () => {
    await usingAsync(createInjector(), async (injector) => {
      const rootElement = document.getElementById('root') as HTMLDivElement

      initializeShadeRoot({
        injector,
        rootElement,
        jsxElement: <Rating max={10} />,
      })

      await flushUpdates()

      const stars = document.querySelectorAll('shade-rating .rating-star')
      expect(stars.length).toBe(10)
    })
  })

  describe('value display', () => {
    it('should show filled stars based on value', async () => {
      await usingAsync(createInjector(), async (injector) => {
        const rootElement = document.getElementById('root') as HTMLDivElement

        initializeShadeRoot({
          injector,
          rootElement,
          jsxElement: <Rating value={3} />,
        })

        await flushUpdates()

        const filledSpans = document.querySelectorAll('shade-rating .star-filled')
        expect((filledSpans[0] as HTMLElement).style.width).toBe('100%')
        expect((filledSpans[1] as HTMLElement).style.width).toBe('100%')
        expect((filledSpans[2] as HTMLElement).style.width).toBe('100%')
        expect((filledSpans[3] as HTMLElement).style.width).toBe('0%')
        expect((filledSpans[4] as HTMLElement).style.width).toBe('0%')
      })
    })

    it('should show half-filled stars with precision=0.5', async () => {
      await usingAsync(createInjector(), async (injector) => {
        const rootElement = document.getElementById('root') as HTMLDivElement

        initializeShadeRoot({
          injector,
          rootElement,
          jsxElement: <Rating value={2.5} precision={0.5} />,
        })

        await flushUpdates()

        const filledSpans = document.querySelectorAll('shade-rating .star-filled')
        expect((filledSpans[0] as HTMLElement).style.width).toBe('100%')
        expect((filledSpans[1] as HTMLElement).style.width).toBe('100%')
        expect((filledSpans[2] as HTMLElement).style.width).toBe('50%')
        expect((filledSpans[3] as HTMLElement).style.width).toBe('0%')
        expect((filledSpans[4] as HTMLElement).style.width).toBe('0%')
      })
    })

    it('should show no filled stars when value is 0', async () => {
      await usingAsync(createInjector(), async (injector) => {
        const rootElement = document.getElementById('root') as HTMLDivElement

        initializeShadeRoot({
          injector,
          rootElement,
          jsxElement: <Rating value={0} />,
        })

        await flushUpdates()

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
      await usingAsync(createInjector(), async (injector) => {
        const rootElement = document.getElementById('root') as HTMLDivElement
        const onchange = vi.fn()

        initializeShadeRoot({
          injector,
          rootElement,
          jsxElement: <Rating value={0} onValueChange={onchange} />,
        })

        await flushUpdates()

        const stars = document.querySelectorAll('shade-rating .rating-star')
        ;(stars[2] as HTMLElement).dispatchEvent(new MouseEvent('click', { bubbles: true }))

        await flushUpdates()

        expect(onchange).toHaveBeenCalledWith(3)
      })
    })

    it('should not call onchange when disabled', async () => {
      await usingAsync(createInjector(), async (injector) => {
        const rootElement = document.getElementById('root') as HTMLDivElement
        const onchange = vi.fn()

        initializeShadeRoot({
          injector,
          rootElement,
          jsxElement: <Rating value={0} onValueChange={onchange} disabled />,
        })

        await flushUpdates()

        const stars = document.querySelectorAll('shade-rating .rating-star')
        ;(stars[2] as HTMLElement).dispatchEvent(new MouseEvent('click', { bubbles: true }))

        await flushUpdates()

        expect(onchange).not.toHaveBeenCalled()
      })
    })

    it('should not call onchange when readOnly', async () => {
      await usingAsync(createInjector(), async (injector) => {
        const rootElement = document.getElementById('root') as HTMLDivElement
        const onchange = vi.fn()

        initializeShadeRoot({
          injector,
          rootElement,
          jsxElement: <Rating value={3} onValueChange={onchange} readOnly />,
        })

        await flushUpdates()

        const stars = document.querySelectorAll('shade-rating .rating-star')
        ;(stars[0] as HTMLElement).dispatchEvent(new MouseEvent('click', { bubbles: true }))

        await flushUpdates()

        expect(onchange).not.toHaveBeenCalled()
      })
    })
  })

  describe('keyboard navigation', () => {
    it('should increase value with ArrowRight', async () => {
      await usingAsync(createInjector(), async (injector) => {
        const rootElement = document.getElementById('root') as HTMLDivElement
        const onchange = vi.fn()

        initializeShadeRoot({
          injector,
          rootElement,
          jsxElement: <Rating value={3} onValueChange={onchange} />,
        })

        await flushUpdates()

        const ratingEl = document.querySelector('shade-rating') as HTMLElement
        ratingEl.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }))

        await flushUpdates()

        expect(onchange).toHaveBeenCalledWith(4)
      })
    })

    it('should decrease value with ArrowLeft', async () => {
      await usingAsync(createInjector(), async (injector) => {
        const rootElement = document.getElementById('root') as HTMLDivElement
        const onchange = vi.fn()

        initializeShadeRoot({
          injector,
          rootElement,
          jsxElement: <Rating value={3} onValueChange={onchange} />,
        })

        await flushUpdates()

        const ratingEl = document.querySelector('shade-rating') as HTMLElement
        ratingEl.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true }))

        await flushUpdates()

        expect(onchange).toHaveBeenCalledWith(2)
      })
    })

    it('should use 0.5 step with precision=0.5', async () => {
      await usingAsync(createInjector(), async (injector) => {
        const rootElement = document.getElementById('root') as HTMLDivElement
        const onchange = vi.fn()

        initializeShadeRoot({
          injector,
          rootElement,
          jsxElement: <Rating value={3} precision={0.5} onValueChange={onchange} />,
        })

        await flushUpdates()

        const ratingEl = document.querySelector('shade-rating') as HTMLElement
        ratingEl.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }))

        await flushUpdates()

        expect(onchange).toHaveBeenCalledWith(3.5)
      })
    })

    it('should not exceed max value', async () => {
      await usingAsync(createInjector(), async (injector) => {
        const rootElement = document.getElementById('root') as HTMLDivElement
        const onchange = vi.fn()

        initializeShadeRoot({
          injector,
          rootElement,
          jsxElement: <Rating value={5} onValueChange={onchange} />,
        })

        await flushUpdates()

        const ratingEl = document.querySelector('shade-rating') as HTMLElement
        ratingEl.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }))

        await flushUpdates()

        expect(onchange).not.toHaveBeenCalled()
      })
    })

    it('should not go below 0', async () => {
      await usingAsync(createInjector(), async (injector) => {
        const rootElement = document.getElementById('root') as HTMLDivElement
        const onchange = vi.fn()

        initializeShadeRoot({
          injector,
          rootElement,
          jsxElement: <Rating value={0} onValueChange={onchange} />,
        })

        await flushUpdates()

        const ratingEl = document.querySelector('shade-rating') as HTMLElement
        ratingEl.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true }))

        await flushUpdates()

        expect(onchange).not.toHaveBeenCalled()
      })
    })
  })

  describe('disabled state', () => {
    it('should set data-disabled attribute when disabled', async () => {
      await usingAsync(createInjector(), async (injector) => {
        const rootElement = document.getElementById('root') as HTMLDivElement

        initializeShadeRoot({
          injector,
          rootElement,
          jsxElement: <Rating disabled />,
        })

        await flushUpdates()

        const wrapper = document.querySelector('shade-rating') as HTMLElement
        expect(wrapper.hasAttribute('data-disabled')).toBe(true)
        expect(wrapper.getAttribute('aria-disabled')).toBe('true')
      })
    })

    it('should not have data-disabled when not disabled', async () => {
      await usingAsync(createInjector(), async (injector) => {
        const rootElement = document.getElementById('root') as HTMLDivElement

        initializeShadeRoot({
          injector,
          rootElement,
          jsxElement: <Rating />,
        })

        await flushUpdates()

        const wrapper = document.querySelector('shade-rating') as HTMLElement
        expect(wrapper.hasAttribute('data-disabled')).toBe(false)
      })
    })
  })

  describe('readOnly state', () => {
    it('should set data-readonly attribute when readOnly', async () => {
      await usingAsync(createInjector(), async (injector) => {
        const rootElement = document.getElementById('root') as HTMLDivElement

        initializeShadeRoot({
          injector,
          rootElement,
          jsxElement: <Rating readOnly />,
        })

        await flushUpdates()

        const wrapper = document.querySelector('shade-rating') as HTMLElement
        expect(wrapper.hasAttribute('data-readonly')).toBe(true)
        expect(wrapper.getAttribute('role')).toBe('img')
      })
    })
  })

  describe('custom icons', () => {
    it('should use custom filled and empty icons', async () => {
      await usingAsync(createInjector(), async (injector) => {
        const rootElement = document.getElementById('root') as HTMLDivElement

        initializeShadeRoot({
          injector,
          rootElement,
          jsxElement: <Rating value={1} icon="❤️" emptyIcon="🤍" />,
        })

        await flushUpdates()

        const emptySpans = document.querySelectorAll('shade-rating .star-empty')
        const filledSpans = document.querySelectorAll('shade-rating .star-filled')

        expect(emptySpans[0]?.textContent).toBe('🤍')
        expect(filledSpans[0]?.textContent).toBe('❤️')
      })
    })
  })

  describe('size', () => {
    it('should set data-size attribute', async () => {
      await usingAsync(createInjector(), async (injector) => {
        const rootElement = document.getElementById('root') as HTMLDivElement

        initializeShadeRoot({
          injector,
          rootElement,
          jsxElement: <Rating size="large" />,
        })

        await flushUpdates()

        const wrapper = document.querySelector('shade-rating') as HTMLElement
        expect(wrapper.getAttribute('data-size')).toBe('large')
      })
    })

    it('should default to medium size', async () => {
      await usingAsync(createInjector(), async (injector) => {
        const rootElement = document.getElementById('root') as HTMLDivElement

        initializeShadeRoot({
          injector,
          rootElement,
          jsxElement: <Rating />,
        })

        await flushUpdates()

        const wrapper = document.querySelector('shade-rating') as HTMLElement
        expect(wrapper.getAttribute('data-size')).toBe('medium')
      })
    })
  })

  describe('theme integration', () => {
    it('should set CSS color variable from theme (default warning)', async () => {
      await usingAsync(createInjector(), async (injector) => {
        const rootElement = document.getElementById('root') as HTMLDivElement

        initializeShadeRoot({
          injector,
          rootElement,
          jsxElement: <Rating />,
        })

        await flushUpdates()

        const wrapper = document.querySelector('shade-rating') as HTMLElement
        const themeService = injector.get(ThemeProviderService)
        expect(wrapper.style.getPropertyValue('--rating-color')).toBe(themeService.theme.palette.warning.main)
      })
    })

    it('should use custom color from color prop', async () => {
      await usingAsync(createInjector(), async (injector) => {
        const rootElement = document.getElementById('root') as HTMLDivElement

        initializeShadeRoot({
          injector,
          rootElement,
          jsxElement: <Rating color="primary" />,
        })

        await flushUpdates()

        const wrapper = document.querySelector('shade-rating') as HTMLElement
        const themeService = injector.get(ThemeProviderService)
        expect(wrapper.style.getPropertyValue('--rating-color')).toBe(themeService.theme.palette.primary.main)
      })
    })
  })

  describe('accessibility', () => {
    it('should have slider role when interactive', async () => {
      await usingAsync(createInjector(), async (injector) => {
        const rootElement = document.getElementById('root') as HTMLDivElement

        initializeShadeRoot({
          injector,
          rootElement,
          jsxElement: <Rating value={3} max={5} />,
        })

        await flushUpdates()

        const wrapper = document.querySelector('shade-rating') as HTMLElement
        expect(wrapper.getAttribute('role')).toBe('slider')
        expect(wrapper.getAttribute('aria-valuenow')).toBe('3')
        expect(wrapper.getAttribute('aria-valuemin')).toBe('0')
        expect(wrapper.getAttribute('aria-valuemax')).toBe('5')
        expect(wrapper.getAttribute('tabindex')).toBe('0')
      })
    })

    it('should have img role when readOnly', async () => {
      await usingAsync(createInjector(), async (injector) => {
        const rootElement = document.getElementById('root') as HTMLDivElement

        initializeShadeRoot({
          injector,
          rootElement,
          jsxElement: <Rating value={3} max={5} readOnly />,
        })

        await flushUpdates()

        const wrapper = document.querySelector('shade-rating') as HTMLElement
        expect(wrapper.getAttribute('role')).toBe('img')
        expect(wrapper.getAttribute('aria-label')).toBe('Rating: 3 out of 5')
        expect(wrapper.hasAttribute('tabindex')).toBe(false)
      })
    })
  })

  describe('hidden input', () => {
    it('should render hidden input with name and value', async () => {
      await usingAsync(createInjector(), async (injector) => {
        const rootElement = document.getElementById('root') as HTMLDivElement

        initializeShadeRoot({
          injector,
          rootElement,
          jsxElement: <Rating name="userRating" value={4} />,
        })

        await flushUpdates()

        const input = document.querySelector('shade-rating input[type="hidden"]') as HTMLInputElement
        expect(input).not.toBeNull()
        expect(input.name).toBe('userRating')
        expect(input.value).toBe('4')
      })
    })

    it('should not render hidden input without name', async () => {
      await usingAsync(createInjector(), async (injector) => {
        const rootElement = document.getElementById('root') as HTMLDivElement

        initializeShadeRoot({
          injector,
          rootElement,
          jsxElement: <Rating value={4} />,
        })

        await flushUpdates()

        const input = document.querySelector('shade-rating input[type="hidden"]')
        expect(input).toBeNull()
      })
    })
  })

  describe('additional keyboard navigation', () => {
    it('should jump to max on End', async () => {
      await usingAsync(createInjector(), async (injector) => {
        const rootElement = document.getElementById('root') as HTMLDivElement
        const onchange = vi.fn()

        initializeShadeRoot({
          injector,
          rootElement,
          jsxElement: <Rating value={3} max={5} onValueChange={onchange} />,
        })

        await flushUpdates()

        const ratingEl = document.querySelector('shade-rating') as HTMLElement
        ratingEl.dispatchEvent(new KeyboardEvent('keydown', { key: 'End', bubbles: true }))

        await flushUpdates()

        expect(onchange).toHaveBeenCalledWith(5)
      })
    })

    it('should jump to 0 on Home', async () => {
      await usingAsync(createInjector(), async (injector) => {
        const rootElement = document.getElementById('root') as HTMLDivElement
        const onchange = vi.fn()

        initializeShadeRoot({
          injector,
          rootElement,
          jsxElement: <Rating value={3} onValueChange={onchange} />,
        })

        await flushUpdates()

        const ratingEl = document.querySelector('shade-rating') as HTMLElement
        ratingEl.dispatchEvent(new KeyboardEvent('keydown', { key: 'Home', bubbles: true }))

        await flushUpdates()

        expect(onchange).toHaveBeenCalledWith(0)
      })
    })

    it('should not change value with ArrowUp (reserved for spatial navigation)', async () => {
      await usingAsync(createInjector(), async (injector) => {
        const rootElement = document.getElementById('root') as HTMLDivElement
        const onchange = vi.fn()

        initializeShadeRoot({
          injector,
          rootElement,
          jsxElement: <Rating value={2} onValueChange={onchange} />,
        })

        await flushUpdates()

        const ratingEl = document.querySelector('shade-rating') as HTMLElement
        ratingEl.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp', bubbles: true }))

        await flushUpdates()

        expect(onchange).not.toHaveBeenCalled()
      })
    })

    it('should not change value with ArrowDown (reserved for spatial navigation)', async () => {
      await usingAsync(createInjector(), async (injector) => {
        const rootElement = document.getElementById('root') as HTMLDivElement
        const onchange = vi.fn()

        initializeShadeRoot({
          injector,
          rootElement,
          jsxElement: <Rating value={3} onValueChange={onchange} />,
        })

        await flushUpdates()

        const ratingEl = document.querySelector('shade-rating') as HTMLElement
        ratingEl.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }))

        await flushUpdates()

        expect(onchange).not.toHaveBeenCalled()
      })
    })

    it('should not fire onValueChange for unrecognized keys', async () => {
      await usingAsync(createInjector(), async (injector) => {
        const rootElement = document.getElementById('root') as HTMLDivElement
        const onchange = vi.fn()

        initializeShadeRoot({
          injector,
          rootElement,
          jsxElement: <Rating value={3} onValueChange={onchange} />,
        })

        await flushUpdates()

        const ratingEl = document.querySelector('shade-rating') as HTMLElement
        ratingEl.dispatchEvent(new KeyboardEvent('keydown', { key: 'a', bubbles: true }))

        await flushUpdates()

        expect(onchange).not.toHaveBeenCalled()
      })
    })

    it('should not handle keyboard when disabled', async () => {
      await usingAsync(createInjector(), async (injector) => {
        const rootElement = document.getElementById('root') as HTMLDivElement
        const onchange = vi.fn()

        initializeShadeRoot({
          injector,
          rootElement,
          jsxElement: <Rating value={3} disabled onValueChange={onchange} />,
        })

        await flushUpdates()

        const ratingEl = document.querySelector('shade-rating') as HTMLElement
        ratingEl.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }))

        await flushUpdates()

        expect(onchange).not.toHaveBeenCalled()
      })
    })

    it('should not handle keyboard when readOnly', async () => {
      await usingAsync(createInjector(), async (injector) => {
        const rootElement = document.getElementById('root') as HTMLDivElement
        const onchange = vi.fn()

        initializeShadeRoot({
          injector,
          rootElement,
          jsxElement: <Rating value={3} readOnly onValueChange={onchange} />,
        })

        await flushUpdates()

        const ratingEl = document.querySelector('shade-rating') as HTMLElement
        ratingEl.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }))

        await flushUpdates()

        expect(onchange).not.toHaveBeenCalled()
      })
    })
  })

  describe('hover visuals', () => {
    it('should restore star visuals on mouse leave', async () => {
      await usingAsync(createInjector(), async (injector) => {
        const rootElement = document.getElementById('root') as HTMLDivElement

        initializeShadeRoot({
          injector,
          rootElement,
          jsxElement: <Rating value={2} />,
        })

        await flushUpdates()

        const container = document.querySelector('shade-rating .rating-container') as HTMLElement
        container.dispatchEvent(new MouseEvent('mouseleave', { bubbles: true }))

        await flushUpdates()

        const filledSpans = document.querySelectorAll('shade-rating .star-filled')
        expect((filledSpans[0] as HTMLElement).style.width).toBe('100%')
        expect((filledSpans[1] as HTMLElement).style.width).toBe('100%')
        expect((filledSpans[2] as HTMLElement).style.width).toBe('0%')
      })
    })

    it('should update star visuals on hover', async () => {
      await usingAsync(createInjector(), async (injector) => {
        const rootElement = document.getElementById('root') as HTMLDivElement

        initializeShadeRoot({
          injector,
          rootElement,
          jsxElement: <Rating value={1} />,
        })

        await flushUpdates()

        const stars = document.querySelectorAll('shade-rating .rating-star')
        const star4 = stars[3] as HTMLElement

        // Simulate mouse move on 4th star
        const rect = star4.getBoundingClientRect()
        star4.dispatchEvent(
          new MouseEvent('mousemove', {
            bubbles: true,
            clientX: rect.left + rect.width / 2 + 1,
          }),
        )

        await flushUpdates()

        const filledSpans = document.querySelectorAll('shade-rating .star-filled')
        // Stars 0-3 should be filled (hover value = 4)
        expect((filledSpans[0] as HTMLElement).style.width).toBe('100%')
        expect((filledSpans[1] as HTMLElement).style.width).toBe('100%')
        expect((filledSpans[2] as HTMLElement).style.width).toBe('100%')
        expect((filledSpans[3] as HTMLElement).style.width).toBe('100%')
        expect((filledSpans[4] as HTMLElement).style.width).toBe('0%')
      })
    })

    it('should not update star visuals on hover when disabled', async () => {
      await usingAsync(createInjector(), async (injector) => {
        const rootElement = document.getElementById('root') as HTMLDivElement

        initializeShadeRoot({
          injector,
          rootElement,
          jsxElement: <Rating value={1} disabled />,
        })

        await flushUpdates()

        const stars = document.querySelectorAll('shade-rating .rating-star')
        ;(stars[3] as HTMLElement).dispatchEvent(new MouseEvent('mousemove', { bubbles: true, clientX: 100 }))

        await flushUpdates()

        const filledSpans = document.querySelectorAll('shade-rating .star-filled')
        // Only first star should be filled (no hover effect)
        expect((filledSpans[0] as HTMLElement).style.width).toBe('100%')
        expect((filledSpans[1] as HTMLElement).style.width).toBe('0%')
      })
    })

    it('should not update star visuals on mouse leave when disabled', async () => {
      await usingAsync(createInjector(), async (injector) => {
        const rootElement = document.getElementById('root') as HTMLDivElement

        initializeShadeRoot({
          injector,
          rootElement,
          jsxElement: <Rating value={2} disabled />,
        })

        await flushUpdates()

        const container = document.querySelector('shade-rating .rating-container') as HTMLElement
        container.dispatchEvent(new MouseEvent('mouseleave', { bubbles: true }))

        await flushUpdates()

        const filledSpans = document.querySelectorAll('shade-rating .star-filled')
        expect((filledSpans[0] as HTMLElement).style.width).toBe('100%')
        expect((filledSpans[1] as HTMLElement).style.width).toBe('100%')
        expect((filledSpans[2] as HTMLElement).style.width).toBe('0%')
      })
    })
  })

  describe('small size', () => {
    it('should set data-size to small', async () => {
      await usingAsync(createInjector(), async (injector) => {
        const rootElement = document.getElementById('root') as HTMLDivElement

        initializeShadeRoot({
          injector,
          rootElement,
          jsxElement: <Rating size="small" />,
        })

        await flushUpdates()

        const wrapper = document.querySelector('shade-rating') as HTMLElement
        expect(wrapper.getAttribute('data-size')).toBe('small')
      })
    })
  })

  describe('aria-readonly', () => {
    it('should set aria-readonly when readOnly', async () => {
      await usingAsync(createInjector(), async (injector) => {
        const rootElement = document.getElementById('root') as HTMLDivElement

        initializeShadeRoot({
          injector,
          rootElement,
          jsxElement: <Rating readOnly value={3} />,
        })

        await flushUpdates()

        const wrapper = document.querySelector('shade-rating') as HTMLElement
        expect(wrapper.getAttribute('aria-readonly')).toBe('true')
      })
    })

    it('should not have aria-readonly when interactive', async () => {
      await usingAsync(createInjector(), async (injector) => {
        const rootElement = document.getElementById('root') as HTMLDivElement

        initializeShadeRoot({
          injector,
          rootElement,
          jsxElement: <Rating value={3} />,
        })

        await flushUpdates()

        const wrapper = document.querySelector('shade-rating') as HTMLElement
        expect(wrapper.hasAttribute('aria-readonly')).toBe(false)
      })
    })
  })

  describe('spatial navigation integration', () => {
    it('should set data-spatial-nav-target on the host element', async () => {
      await usingAsync(createInjector(), async (injector) => {
        const rootElement = document.getElementById('root') as HTMLDivElement

        initializeShadeRoot({
          injector,
          rootElement,
          jsxElement: <Rating value={3} />,
        })

        await flushUpdates()

        const wrapper = document.querySelector('shade-rating') as HTMLElement
        expect(wrapper.hasAttribute('data-spatial-nav-target')).toBe(true)
      })
    })

    it('should not set data-spatial-nav-target when readOnly', async () => {
      await usingAsync(createInjector(), async (injector) => {
        const rootElement = document.getElementById('root') as HTMLDivElement

        initializeShadeRoot({
          injector,
          rootElement,
          jsxElement: <Rating value={3} readOnly />,
        })

        await flushUpdates()

        const wrapper = document.querySelector('shade-rating') as HTMLElement
        expect(wrapper.hasAttribute('data-spatial-nav-target')).toBe(false)
      })
    })

    it('should not set data-spatial-nav-target when disabled', async () => {
      await usingAsync(createInjector(), async (injector) => {
        const rootElement = document.getElementById('root') as HTMLDivElement

        initializeShadeRoot({
          injector,
          rootElement,
          jsxElement: <Rating value={3} disabled />,
        })

        await flushUpdates()

        const wrapper = document.querySelector('shade-rating') as HTMLElement
        expect(wrapper.hasAttribute('data-spatial-nav-target')).toBe(false)
      })
    })

    it('should set aria-orientation to horizontal', async () => {
      await usingAsync(createInjector(), async (injector) => {
        const rootElement = document.getElementById('root') as HTMLDivElement

        initializeShadeRoot({
          injector,
          rootElement,
          jsxElement: <Rating value={3} />,
        })

        await flushUpdates()

        const wrapper = document.querySelector('shade-rating') as HTMLElement
        expect(wrapper.getAttribute('aria-orientation')).toBe('horizontal')
      })
    })

    it('should not preventDefault on ArrowRight when at max value', async () => {
      await usingAsync(createInjector(), async (injector) => {
        const rootElement = document.getElementById('root') as HTMLDivElement
        const onchange = vi.fn()

        initializeShadeRoot({
          injector,
          rootElement,
          jsxElement: <Rating value={5} max={5} onValueChange={onchange} />,
        })

        await flushUpdates()

        const ratingEl = document.querySelector('shade-rating') as HTMLElement
        const event = new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true, cancelable: true })
        ratingEl.dispatchEvent(event)

        await flushUpdates()

        expect(onchange).not.toHaveBeenCalled()
        expect(event.defaultPrevented).toBe(false)
      })
    })

    it('should not preventDefault on ArrowLeft when at min value', async () => {
      await usingAsync(createInjector(), async (injector) => {
        const rootElement = document.getElementById('root') as HTMLDivElement
        const onchange = vi.fn()

        initializeShadeRoot({
          injector,
          rootElement,
          jsxElement: <Rating value={0} onValueChange={onchange} />,
        })

        await flushUpdates()

        const ratingEl = document.querySelector('shade-rating') as HTMLElement
        const event = new KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true, cancelable: true })
        ratingEl.dispatchEvent(event)

        await flushUpdates()

        expect(onchange).not.toHaveBeenCalled()
        expect(event.defaultPrevented).toBe(false)
      })
    })

    it('should preventDefault on ArrowRight when value can increase', async () => {
      await usingAsync(createInjector(), async (injector) => {
        const rootElement = document.getElementById('root') as HTMLDivElement
        const onchange = vi.fn()

        initializeShadeRoot({
          injector,
          rootElement,
          jsxElement: <Rating value={3} max={5} onValueChange={onchange} />,
        })

        await flushUpdates()

        const ratingEl = document.querySelector('shade-rating') as HTMLElement
        const event = new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true, cancelable: true })
        ratingEl.dispatchEvent(event)

        await flushUpdates()

        expect(onchange).toHaveBeenCalledWith(4)
        expect(event.defaultPrevented).toBe(true)
      })
    })

    it('should preventDefault on ArrowLeft when value can decrease', async () => {
      await usingAsync(createInjector(), async (injector) => {
        const rootElement = document.getElementById('root') as HTMLDivElement
        const onchange = vi.fn()

        initializeShadeRoot({
          injector,
          rootElement,
          jsxElement: <Rating value={3} onValueChange={onchange} />,
        })

        await flushUpdates()

        const ratingEl = document.querySelector('shade-rating') as HTMLElement
        const event = new KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true, cancelable: true })
        ratingEl.dispatchEvent(event)

        await flushUpdates()

        expect(onchange).toHaveBeenCalledWith(2)
        expect(event.defaultPrevented).toBe(true)
      })
    })

    it('should not preventDefault on ArrowUp or ArrowDown', async () => {
      await usingAsync(createInjector(), async (injector) => {
        const rootElement = document.getElementById('root') as HTMLDivElement
        const onchange = vi.fn()

        initializeShadeRoot({
          injector,
          rootElement,
          jsxElement: <Rating value={3} onValueChange={onchange} />,
        })

        await flushUpdates()

        const ratingEl = document.querySelector('shade-rating') as HTMLElement

        const upEvent = new KeyboardEvent('keydown', { key: 'ArrowUp', bubbles: true, cancelable: true })
        ratingEl.dispatchEvent(upEvent)

        const downEvent = new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true, cancelable: true })
        ratingEl.dispatchEvent(downEvent)

        await flushUpdates()

        expect(onchange).not.toHaveBeenCalled()
        expect(upEvent.defaultPrevented).toBe(false)
        expect(downEvent.defaultPrevented).toBe(false)
      })
    })
  })
})
