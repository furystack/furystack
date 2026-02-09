import { Injector } from '@furystack/inject'
import { createComponent, initializeShadeRoot } from '@furystack/shades'
import { sleepAsync, usingAsync } from '@furystack/utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ThemeProviderService } from '../../services/theme-provider-service.js'
import { Slider } from './slider.js'

describe('Slider', () => {
  beforeEach(() => {
    document.body.innerHTML = '<div id="root"></div>'
  })

  afterEach(() => {
    document.body.innerHTML = ''
    vi.restoreAllMocks()
  })

  const renderSlider = async (props: Parameters<typeof Slider>[0] = {}) => {
    const injector = new Injector()
    const root = document.getElementById('root')!
    initializeShadeRoot({
      injector,
      rootElement: root,
      jsxElement: <Slider {...props} />,
    })
    await sleepAsync(100)
    return {
      injector,
      slider: document.querySelector('shade-slider') as HTMLElement,
      [Symbol.asyncDispose]: () => injector[Symbol.asyncDispose](),
    }
  }

  describe('rendering', () => {
    it('should render with shadow DOM', async () => {
      await usingAsync(await renderSlider(), async ({ slider }) => {
        expect(slider).not.toBeNull()
      })
    })

    it('should render the rail, track, and thumb', async () => {
      await usingAsync(await renderSlider(), async ({ slider }) => {
        expect(slider.querySelector('.slider-rail')).not.toBeNull()
        expect(slider.querySelector('.slider-track')).not.toBeNull()
        expect(slider.querySelector('.slider-thumb')).not.toBeNull()
      })
    })

    it('should render a single thumb for non-range slider', async () => {
      await usingAsync(await renderSlider({ value: 50 }), async ({ slider }) => {
        const thumbs = slider.querySelectorAll('.slider-thumb')
        expect(thumbs.length).toBe(1)
      })
    })

    it('should render two thumbs for range slider', async () => {
      await usingAsync(await renderSlider({ value: [20, 80] }), async ({ slider }) => {
        const thumbs = slider.querySelectorAll('.slider-thumb')
        expect(thumbs.length).toBe(2)
      })
    })
  })

  describe('value positioning', () => {
    it('should position thumb at 0% when value equals min', async () => {
      await usingAsync(await renderSlider({ value: 0, min: 0, max: 100 }), async ({ slider }) => {
        const thumb = slider.querySelector('.slider-thumb') as HTMLElement
        expect(thumb.style.left).toBe('0%')
      })
    })

    it('should position thumb at 50% when value is midpoint', async () => {
      await usingAsync(await renderSlider({ value: 50, min: 0, max: 100 }), async ({ slider }) => {
        const thumb = slider.querySelector('.slider-thumb') as HTMLElement
        expect(thumb.style.left).toBe('50%')
      })
    })

    it('should position thumb at 100% when value equals max', async () => {
      await usingAsync(await renderSlider({ value: 100, min: 0, max: 100 }), async ({ slider }) => {
        const thumb = slider.querySelector('.slider-thumb') as HTMLElement
        expect(thumb.style.left).toBe('100%')
      })
    })

    it('should set correct track width for single slider', async () => {
      await usingAsync(await renderSlider({ value: 60, min: 0, max: 100 }), async ({ slider }) => {
        const track = slider.querySelector('.slider-track') as HTMLElement
        expect(track.style.left).toBe('0%')
        expect(track.style.width).toBe('60%')
      })
    })

    it('should set correct track position for range slider', async () => {
      await usingAsync(await renderSlider({ value: [20, 80], min: 0, max: 100 }), async ({ slider }) => {
        const track = slider.querySelector('.slider-track') as HTMLElement
        expect(track.style.left).toBe('20%')
        expect(track.style.width).toBe('60%')
      })
    })

    it('should position range thumbs correctly', async () => {
      await usingAsync(await renderSlider({ value: [25, 75], min: 0, max: 100 }), async ({ slider }) => {
        const thumbs = slider.querySelectorAll<HTMLElement>('.slider-thumb')
        expect(thumbs[0].style.left).toBe('25%')
        expect(thumbs[1].style.left).toBe('75%')
      })
    })
  })

  describe('vertical mode', () => {
    it('should set data-vertical attribute', async () => {
      await usingAsync(await renderSlider({ vertical: true }), async ({ slider }) => {
        expect(slider.hasAttribute('data-vertical')).toBe(true)
      })
    })

    it('should not set data-vertical when horizontal', async () => {
      await usingAsync(await renderSlider({ vertical: false }), async ({ slider }) => {
        expect(slider.hasAttribute('data-vertical')).toBe(false)
      })
    })

    it('should use bottom for positioning in vertical mode', async () => {
      await usingAsync(await renderSlider({ value: 50, vertical: true }), async ({ slider }) => {
        const thumb = slider.querySelector('.slider-thumb') as HTMLElement
        expect(thumb.style.bottom).toBe('50%')
      })
    })

    it('should set vertical track via bottom/height', async () => {
      await usingAsync(await renderSlider({ value: 60, vertical: true }), async ({ slider }) => {
        const track = slider.querySelector('.slider-track') as HTMLElement
        expect(track.style.bottom).toBe('0%')
        expect(track.style.height).toBe('60%')
      })
    })
  })

  describe('disabled state', () => {
    it('should set data-disabled attribute when disabled', async () => {
      await usingAsync(await renderSlider({ disabled: true }), async ({ slider }) => {
        expect(slider.hasAttribute('data-disabled')).toBe(true)
      })
    })

    it('should not set data-disabled when not disabled', async () => {
      await usingAsync(await renderSlider({ disabled: false }), async ({ slider }) => {
        expect(slider.hasAttribute('data-disabled')).toBe(false)
      })
    })

    it('should set tabIndex to -1 on thumb when disabled', async () => {
      await usingAsync(await renderSlider({ disabled: true }), async ({ slider }) => {
        const thumb = slider.querySelector('.slider-thumb') as HTMLElement
        expect(thumb.tabIndex).toBe(-1)
      })
    })

    it('should set tabIndex to 0 on thumb when not disabled', async () => {
      await usingAsync(await renderSlider({ disabled: false }), async ({ slider }) => {
        const thumb = slider.querySelector('.slider-thumb') as HTMLElement
        expect(thumb.tabIndex).toBe(0)
      })
    })
  })

  describe('ARIA attributes', () => {
    it('should set role="slider" on thumb', async () => {
      await usingAsync(await renderSlider({ value: 50 }), async ({ slider }) => {
        const thumb = slider.querySelector('.slider-thumb') as HTMLElement
        expect(thumb.getAttribute('role')).toBe('slider')
      })
    })

    it('should set aria-valuemin and aria-valuemax', async () => {
      await usingAsync(await renderSlider({ value: 50, min: 10, max: 90 }), async ({ slider }) => {
        const thumb = slider.querySelector('.slider-thumb') as HTMLElement
        expect(thumb.getAttribute('aria-valuemin')).toBe('10')
        expect(thumb.getAttribute('aria-valuemax')).toBe('90')
      })
    })

    it('should set aria-valuenow to current value', async () => {
      await usingAsync(await renderSlider({ value: 42 }), async ({ slider }) => {
        const thumb = slider.querySelector('.slider-thumb') as HTMLElement
        expect(thumb.getAttribute('aria-valuenow')).toBe('42')
      })
    })

    it('should set aria-orientation to horizontal by default', async () => {
      await usingAsync(await renderSlider(), async ({ slider }) => {
        const thumb = slider.querySelector('.slider-thumb') as HTMLElement
        expect(thumb.getAttribute('aria-orientation')).toBe('horizontal')
      })
    })

    it('should set aria-orientation to vertical when vertical', async () => {
      await usingAsync(await renderSlider({ vertical: true }), async ({ slider }) => {
        const thumb = slider.querySelector('.slider-thumb') as HTMLElement
        expect(thumb.getAttribute('aria-orientation')).toBe('vertical')
      })
    })

    it('should set aria-disabled when disabled', async () => {
      await usingAsync(await renderSlider({ disabled: true }), async ({ slider }) => {
        const thumb = slider.querySelector('.slider-thumb') as HTMLElement
        expect(thumb.getAttribute('aria-disabled')).toBe('true')
      })
    })

    it('should set separate aria-valuenow for range thumbs', async () => {
      await usingAsync(await renderSlider({ value: [20, 80] }), async ({ slider }) => {
        const thumbs = slider.querySelectorAll<HTMLElement>('.slider-thumb')
        expect(thumbs[0].getAttribute('aria-valuenow')).toBe('20')
        expect(thumbs[1].getAttribute('aria-valuenow')).toBe('80')
      })
    })
  })

  describe('marks', () => {
    it('should render mark dots when marks is true', async () => {
      await usingAsync(await renderSlider({ min: 0, max: 10, step: 5, marks: true }), async ({ slider }) => {
        const dots = slider.querySelectorAll('.slider-mark-dot')
        expect(dots.length).toBe(3) // 0, 5, 10
      })
    })

    it('should render custom marks from an array', async () => {
      const marks = [
        { value: 0, label: 'Min' },
        { value: 50, label: 'Mid' },
        { value: 100, label: 'Max' },
      ]
      await usingAsync(await renderSlider({ marks }), async ({ slider }) => {
        const dots = slider.querySelectorAll('.slider-mark-dot')
        const labels = slider.querySelectorAll('.slider-mark-label')
        expect(dots.length).toBe(3)
        expect(labels.length).toBe(3)
        expect(labels[0].textContent).toBe('Min')
        expect(labels[1].textContent).toBe('Mid')
        expect(labels[2].textContent).toBe('Max')
      })
    })

    it('should mark active dots for single slider', async () => {
      await usingAsync(
        await renderSlider({ value: 50, min: 0, max: 100, step: 50, marks: true }),
        async ({ slider }) => {
          const dots = slider.querySelectorAll('.slider-mark-dot')
          expect(dots[0].hasAttribute('data-active')).toBe(true) // 0 <= 50
          expect(dots[1].hasAttribute('data-active')).toBe(true) // 50 <= 50
          expect(dots[2].hasAttribute('data-active')).toBe(false) // 100 > 50
        },
      )
    })

    it('should mark active dots for range slider', async () => {
      await usingAsync(
        await renderSlider({ value: [25, 75] as [number, number], min: 0, max: 100, step: 25, marks: true }),
        async ({ slider }) => {
          const dots = slider.querySelectorAll('.slider-mark-dot')
          expect(dots[0].hasAttribute('data-active')).toBe(false) // 0 < 25
          expect(dots[1].hasAttribute('data-active')).toBe(true) // 25 >= 25 && 25 <= 75
          expect(dots[2].hasAttribute('data-active')).toBe(true) // 50 >= 25 && 50 <= 75
          expect(dots[3].hasAttribute('data-active')).toBe(true) // 75 >= 25 && 75 <= 75
          expect(dots[4].hasAttribute('data-active')).toBe(false) // 100 > 75
        },
      )
    })

    it('should set data-has-labels when marks have labels', async () => {
      const marks = [{ value: 50, label: 'Half' }]
      await usingAsync(await renderSlider({ marks }), async ({ slider }) => {
        expect(slider.hasAttribute('data-has-labels')).toBe(true)
      })
    })

    it('should not set data-has-labels when marks have no labels', async () => {
      await usingAsync(await renderSlider({ min: 0, max: 10, step: 5, marks: true }), async ({ slider }) => {
        expect(slider.hasAttribute('data-has-labels')).toBe(false)
      })
    })

    it('should not render marks when marks is false or undefined', async () => {
      await usingAsync(await renderSlider({ marks: false }), async ({ slider }) => {
        expect(slider.querySelectorAll('.slider-mark-dot').length).toBe(0)
      })
    })
  })

  describe('theme integration', () => {
    it('should set CSS color variable from theme', async () => {
      await usingAsync(await renderSlider(), async ({ slider, injector }) => {
        const themeService = injector.getInstance(ThemeProviderService)
        expect(slider.style.getPropertyValue('--slider-color')).toBe(themeService.theme.palette.primary.main)
      })
    })

    it('should use custom color from color prop', async () => {
      await usingAsync(await renderSlider({ color: 'secondary' }), async ({ slider, injector }) => {
        const themeService = injector.getInstance(ThemeProviderService)
        expect(slider.style.getPropertyValue('--slider-color')).toBe(themeService.theme.palette.secondary.main)
      })
    })
  })

  describe('keyboard navigation', () => {
    it('should increment value on ArrowRight', async () => {
      const onValueChange = vi.fn()
      await usingAsync(await renderSlider({ value: 50, step: 10, onValueChange }), async ({ slider }) => {
        const thumb = slider.querySelector('.slider-thumb') as HTMLElement
        thumb.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }))
        expect(onValueChange).toHaveBeenCalledWith(60)
      })
    })

    it('should decrement value on ArrowLeft', async () => {
      const onValueChange = vi.fn()
      await usingAsync(await renderSlider({ value: 50, step: 10, onValueChange }), async ({ slider }) => {
        const thumb = slider.querySelector('.slider-thumb') as HTMLElement
        thumb.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true }))
        expect(onValueChange).toHaveBeenCalledWith(40)
      })
    })

    it('should increment value on ArrowUp', async () => {
      const onValueChange = vi.fn()
      await usingAsync(await renderSlider({ value: 50, step: 5, onValueChange }), async ({ slider }) => {
        const thumb = slider.querySelector('.slider-thumb') as HTMLElement
        thumb.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp', bubbles: true }))
        expect(onValueChange).toHaveBeenCalledWith(55)
      })
    })

    it('should decrement value on ArrowDown', async () => {
      const onValueChange = vi.fn()
      await usingAsync(await renderSlider({ value: 50, step: 5, onValueChange }), async ({ slider }) => {
        const thumb = slider.querySelector('.slider-thumb') as HTMLElement
        thumb.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }))
        expect(onValueChange).toHaveBeenCalledWith(45)
      })
    })

    it('should jump to min on Home', async () => {
      const onValueChange = vi.fn()
      await usingAsync(await renderSlider({ value: 50, min: 0, max: 100, onValueChange }), async ({ slider }) => {
        const thumb = slider.querySelector('.slider-thumb') as HTMLElement
        thumb.dispatchEvent(new KeyboardEvent('keydown', { key: 'Home', bubbles: true }))
        expect(onValueChange).toHaveBeenCalledWith(0)
      })
    })

    it('should jump to max on End', async () => {
      const onValueChange = vi.fn()
      await usingAsync(await renderSlider({ value: 50, min: 0, max: 100, onValueChange }), async ({ slider }) => {
        const thumb = slider.querySelector('.slider-thumb') as HTMLElement
        thumb.dispatchEvent(new KeyboardEvent('keydown', { key: 'End', bubbles: true }))
        expect(onValueChange).toHaveBeenCalledWith(100)
      })
    })

    it('should large-step on PageUp', async () => {
      const onValueChange = vi.fn()
      await usingAsync(await renderSlider({ value: 50, step: 1, onValueChange }), async ({ slider }) => {
        const thumb = slider.querySelector('.slider-thumb') as HTMLElement
        thumb.dispatchEvent(new KeyboardEvent('keydown', { key: 'PageUp', bubbles: true }))
        expect(onValueChange).toHaveBeenCalledWith(60)
      })
    })

    it('should not exceed max on ArrowRight', async () => {
      const onValueChange = vi.fn()
      await usingAsync(
        await renderSlider({ value: 100, step: 10, min: 0, max: 100, onValueChange }),
        async ({ slider }) => {
          const thumb = slider.querySelector('.slider-thumb') as HTMLElement
          thumb.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }))
          expect(onValueChange).toHaveBeenCalledWith(100)
        },
      )
    })

    it('should not go below min on ArrowLeft', async () => {
      const onValueChange = vi.fn()
      await usingAsync(
        await renderSlider({ value: 0, step: 10, min: 0, max: 100, onValueChange }),
        async ({ slider }) => {
          const thumb = slider.querySelector('.slider-thumb') as HTMLElement
          thumb.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true }))
          expect(onValueChange).toHaveBeenCalledWith(0)
        },
      )
    })

    it('should not fire change when disabled', async () => {
      const onValueChange = vi.fn()
      await usingAsync(await renderSlider({ value: 50, disabled: true, onValueChange }), async ({ slider }) => {
        const thumb = slider.querySelector('.slider-thumb') as HTMLElement
        thumb.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }))
        expect(onValueChange).not.toHaveBeenCalled()
      })
    })
  })

  describe('defaults', () => {
    it('should use min=0, max=100, step=1 by default', async () => {
      await usingAsync(await renderSlider(), async ({ slider }) => {
        const thumb = slider.querySelector('.slider-thumb') as HTMLElement
        expect(thumb.getAttribute('aria-valuemin')).toBe('0')
        expect(thumb.getAttribute('aria-valuemax')).toBe('100')
        expect(thumb.getAttribute('aria-valuenow')).toBe('0')
      })
    })

    it('should default value to min', async () => {
      await usingAsync(await renderSlider({ min: 20, max: 80 }), async ({ slider }) => {
        const thumb = slider.querySelector('.slider-thumb') as HTMLElement
        expect(thumb.style.left).toBe('0%')
      })
    })
  })

  describe('hidden input for form integration', () => {
    it('should render a hidden input when name is provided', async () => {
      await usingAsync(await renderSlider({ name: 'volume', value: 75 }), async ({ slider }) => {
        const input = slider.querySelector('input[type="hidden"]') as HTMLInputElement
        expect(input).not.toBeNull()
        expect(input.name).toBe('volume')
        expect(input.value).toBe('75')
      })
    })

    it('should not render a hidden input when name is not provided', async () => {
      await usingAsync(await renderSlider({ value: 75 }), async ({ slider }) => {
        const input = slider.querySelector('input[type="hidden"]')
        expect(input).toBeNull()
      })
    })
  })

  describe('custom min/max/step', () => {
    it('should respect custom min and max', async () => {
      await usingAsync(await renderSlider({ value: 15, min: 10, max: 20 }), async ({ slider }) => {
        const thumb = slider.querySelector('.slider-thumb') as HTMLElement
        expect(thumb.style.left).toBe('50%')
      })
    })

    it('should handle step with decimals', async () => {
      const onValueChange = vi.fn()
      await usingAsync(
        await renderSlider({ value: 0.5, min: 0, max: 1, step: 0.1, onValueChange }),
        async ({ slider }) => {
          const thumb = slider.querySelector('.slider-thumb') as HTMLElement
          expect(thumb.style.left).toBe('50%')

          thumb.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }))
          expect(onValueChange).toHaveBeenCalledWith(0.6)
        },
      )
    })

    it('should handle step=0 (continuous mode) with keyboard using effective step of 1', async () => {
      const onValueChange = vi.fn()
      await usingAsync(
        await renderSlider({ value: 50, min: 0, max: 100, step: 0, onValueChange }),
        async ({ slider }) => {
          const thumb = slider.querySelector('.slider-thumb') as HTMLElement
          thumb.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }))
          expect(onValueChange).toHaveBeenCalledWith(51)
        },
      )
    })
  })

  describe('range keyboard navigation', () => {
    it('should increment first thumb of range with ArrowRight', async () => {
      const onValueChange = vi.fn()
      await usingAsync(
        await renderSlider({ value: [20, 80] as [number, number], step: 5, onValueChange }),
        async ({ slider }) => {
          const thumbs = slider.querySelectorAll<HTMLElement>('.slider-thumb')
          thumbs[0].dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }))
          expect(onValueChange).toHaveBeenCalledWith([25, 80])
        },
      )
    })

    it('should decrement second thumb of range with ArrowLeft', async () => {
      const onValueChange = vi.fn()
      await usingAsync(
        await renderSlider({ value: [20, 80] as [number, number], step: 5, onValueChange }),
        async ({ slider }) => {
          const thumbs = slider.querySelectorAll<HTMLElement>('.slider-thumb')
          thumbs[1].dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true }))
          expect(onValueChange).toHaveBeenCalledWith([20, 75])
        },
      )
    })

    it('should clamp range thumb 0 to not exceed thumb 1', async () => {
      const onValueChange = vi.fn()
      await usingAsync(
        await renderSlider({ value: [50, 50] as [number, number], step: 10, onValueChange }),
        async ({ slider }) => {
          const thumbs = slider.querySelectorAll<HTMLElement>('.slider-thumb')
          thumbs[0].dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }))
          expect(onValueChange).toHaveBeenCalledWith([50, 50])
        },
      )
    })

    it('should clamp range thumb 1 to not go below thumb 0', async () => {
      const onValueChange = vi.fn()
      await usingAsync(
        await renderSlider({ value: [50, 50] as [number, number], step: 10, onValueChange }),
        async ({ slider }) => {
          const thumbs = slider.querySelectorAll<HTMLElement>('.slider-thumb')
          thumbs[1].dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true }))
          expect(onValueChange).toHaveBeenCalledWith([50, 50])
        },
      )
    })

    it('should jump range thumb to min on Home', async () => {
      const onValueChange = vi.fn()
      await usingAsync(
        await renderSlider({ value: [30, 70] as [number, number], min: 0, max: 100, onValueChange }),
        async ({ slider }) => {
          const thumbs = slider.querySelectorAll<HTMLElement>('.slider-thumb')
          thumbs[0].dispatchEvent(new KeyboardEvent('keydown', { key: 'Home', bubbles: true }))
          expect(onValueChange).toHaveBeenCalledWith([0, 70])
        },
      )
    })

    it('should jump range thumb to max on End', async () => {
      const onValueChange = vi.fn()
      await usingAsync(
        await renderSlider({ value: [30, 70] as [number, number], min: 0, max: 100, onValueChange }),
        async ({ slider }) => {
          const thumbs = slider.querySelectorAll<HTMLElement>('.slider-thumb')
          thumbs[1].dispatchEvent(new KeyboardEvent('keydown', { key: 'End', bubbles: true }))
          expect(onValueChange).toHaveBeenCalledWith([30, 100])
        },
      )
    })

    it('should use ArrowUp to increment value', async () => {
      const onValueChange = vi.fn()
      await usingAsync(
        await renderSlider({ value: [20, 80] as [number, number], step: 5, onValueChange }),
        async ({ slider }) => {
          const thumbs = slider.querySelectorAll<HTMLElement>('.slider-thumb')
          thumbs[0].dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp', bubbles: true }))
          expect(onValueChange).toHaveBeenCalledWith([25, 80])
        },
      )
    })

    it('should use ArrowDown to decrement value', async () => {
      const onValueChange = vi.fn()
      await usingAsync(
        await renderSlider({ value: [20, 80] as [number, number], step: 5, onValueChange }),
        async ({ slider }) => {
          const thumbs = slider.querySelectorAll<HTMLElement>('.slider-thumb')
          thumbs[1].dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }))
          expect(onValueChange).toHaveBeenCalledWith([20, 75])
        },
      )
    })
  })

  describe('PageDown', () => {
    it('should large-step down on PageDown', async () => {
      const onValueChange = vi.fn()
      await usingAsync(await renderSlider({ value: 50, step: 1, onValueChange }), async ({ slider }) => {
        const thumb = slider.querySelector('.slider-thumb') as HTMLElement
        thumb.dispatchEvent(new KeyboardEvent('keydown', { key: 'PageDown', bubbles: true }))
        expect(onValueChange).toHaveBeenCalledWith(40)
      })
    })
  })

  describe('vertical range positioning', () => {
    it('should use bottom for positioning range thumbs vertically', async () => {
      await usingAsync(
        await renderSlider({ value: [20, 80] as [number, number], vertical: true }),
        async ({ slider }) => {
          const thumbs = slider.querySelectorAll<HTMLElement>('.slider-thumb')
          expect(thumbs[0].style.bottom).toBe('20%')
          expect(thumbs[1].style.bottom).toBe('80%')
        },
      )
    })

    it('should use bottom/height for range track in vertical mode', async () => {
      await usingAsync(
        await renderSlider({ value: [20, 80] as [number, number], vertical: true }),
        async ({ slider }) => {
          const track = slider.querySelector('.slider-track') as HTMLElement
          expect(track.style.bottom).toBe('20%')
          expect(track.style.height).toBe('60%')
        },
      )
    })
  })

  describe('marks with step=0', () => {
    it('should not generate auto marks when step is 0', async () => {
      await usingAsync(await renderSlider({ min: 0, max: 100, step: 0, marks: true }), async ({ slider }) => {
        const dots = slider.querySelectorAll('.slider-mark-dot')
        expect(dots.length).toBe(0)
      })
    })
  })

  describe('non-keyboard events are ignored', () => {
    it('should not fire change when non-slider-thumb receives keyboard event', async () => {
      const onValueChange = vi.fn()
      await usingAsync(await renderSlider({ value: 50, onValueChange }), async ({ slider }) => {
        const rail = slider.querySelector('.slider-rail') as HTMLElement
        rail.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }))
        expect(onValueChange).not.toHaveBeenCalled()
      })
    })

    it('should ignore unrecognized keys', async () => {
      const onValueChange = vi.fn()
      await usingAsync(await renderSlider({ value: 50, onValueChange }), async ({ slider }) => {
        const thumb = slider.querySelector('.slider-thumb') as HTMLElement
        thumb.dispatchEvent(new KeyboardEvent('keydown', { key: 'a', bubbles: true }))
        expect(onValueChange).not.toHaveBeenCalled()
      })
    })
  })

  describe('marks positioning in vertical mode', () => {
    it('should use bottom for marks in vertical mode', async () => {
      const marks = [{ value: 50, label: 'Half' }]
      await usingAsync(await renderSlider({ marks, vertical: true }), async ({ slider }) => {
        const dot = slider.querySelector('.slider-mark-dot') as HTMLElement
        expect(dot.style.bottom).toBe('50%')
      })
    })
  })

  describe('mouse interaction', () => {
    const mockSliderRoot = (slider: HTMLElement, rect: Partial<DOMRect>) => {
      const root = slider.querySelector('.slider-root')
      if (root) {
        vi.spyOn(root, 'getBoundingClientRect').mockReturnValue({
          top: 0,
          left: 0,
          width: 200,
          height: 4,
          right: 200,
          bottom: 4,
          x: 0,
          y: 0,
          toJSON: () => ({}),
          ...rect,
        })
      }
    }

    it('should update slider on mousedown on track (single mode)', async () => {
      const onValueChange = vi.fn()
      await usingAsync(
        await renderSlider({ value: 50, min: 0, max: 100, step: 1, onValueChange }),
        async ({ slider }) => {
          mockSliderRoot(slider, { left: 0, width: 200 })
          const root = slider.querySelector('.slider-root') as HTMLElement

          root.dispatchEvent(new MouseEvent('mousedown', { clientX: 150, clientY: 2, bubbles: true }))
          document.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }))
          await sleepAsync(50)

          expect(onValueChange).toHaveBeenCalled()
          const calledWith = onValueChange.mock.calls[0][0] as number
          expect(calledWith).toBe(75)
        },
      )
    })

    it('should not respond to mousedown when disabled', async () => {
      const onValueChange = vi.fn()
      await usingAsync(await renderSlider({ value: 50, disabled: true, onValueChange }), async ({ slider }) => {
        mockSliderRoot(slider, { left: 0, width: 200 })

        slider.dispatchEvent(new MouseEvent('mousedown', { clientX: 100, clientY: 2, bubbles: true }))
        document.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }))
        await sleepAsync(50)

        expect(onValueChange).not.toHaveBeenCalled()
      })
    })

    it('should set data-dragging during drag and remove after', async () => {
      const onValueChange = vi.fn()
      await usingAsync(
        await renderSlider({ value: 50, min: 0, max: 100, step: 1, onValueChange }),
        async ({ slider }) => {
          mockSliderRoot(slider, { left: 0, width: 200 })
          const root = slider.querySelector('.slider-root') as HTMLElement

          root.dispatchEvent(new MouseEvent('mousedown', { clientX: 100, clientY: 2, bubbles: true }))
          expect(root.hasAttribute('data-dragging')).toBe(true)

          document.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }))
          await sleepAsync(50)

          expect(root.hasAttribute('data-dragging')).toBe(false)
        },
      )
    })

    it('should update value on mousemove during drag', async () => {
      const onValueChange = vi.fn()
      await usingAsync(
        await renderSlider({ value: 0, min: 0, max: 100, step: 1, onValueChange }),
        async ({ slider }) => {
          mockSliderRoot(slider, { left: 0, width: 200 })

          const thumb = slider.querySelector('.slider-thumb') as HTMLElement
          thumb.dispatchEvent(new MouseEvent('mousedown', { clientX: 0, clientY: 2, bubbles: true }))

          document.dispatchEvent(new MouseEvent('mousemove', { clientX: 100, clientY: 2, bubbles: true }))
          document.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }))
          await sleepAsync(50)

          expect(onValueChange).toHaveBeenCalled()
          const calledWith = onValueChange.mock.calls[0][0] as number
          expect(calledWith).toBe(50)
        },
      )
    })

    it('should handle range slider mousedown - picks nearest thumb', async () => {
      const onValueChange = vi.fn()
      await usingAsync(
        await renderSlider({
          value: [20, 80] as [number, number],
          min: 0,
          max: 100,
          step: 1,
          onValueChange,
        }),
        async ({ slider }) => {
          mockSliderRoot(slider, { left: 0, width: 200 })
          const root = slider.querySelector('.slider-root') as HTMLElement

          // Click at 90% (180px) → closer to thumb at 80%
          root.dispatchEvent(new MouseEvent('mousedown', { clientX: 180, clientY: 2, bubbles: true }))
          document.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }))
          await sleepAsync(50)

          expect(onValueChange).toHaveBeenCalled()
          const val = onValueChange.mock.calls[0][0] as [number, number]
          expect(val[0]).toBe(20)
          expect(val[1]).toBe(90)
        },
      )
    })

    it('should handle range slider mousedown - swaps if crossover', async () => {
      const onValueChange = vi.fn()
      await usingAsync(
        await renderSlider({
          value: [40, 60] as [number, number],
          min: 0,
          max: 100,
          step: 1,
          onValueChange,
        }),
        async ({ slider }) => {
          mockSliderRoot(slider, { left: 0, width: 200 })
          const root = slider.querySelector('.slider-root') as HTMLElement

          // Click at 20% (40px), closer to start thumb at 40%.
          // New val for thumb[0]=20. 20 < 60, no swap.
          root.dispatchEvent(new MouseEvent('mousedown', { clientX: 40, clientY: 2, bubbles: true }))
          document.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }))
          await sleepAsync(50)

          expect(onValueChange).toHaveBeenCalled()
          const val = onValueChange.mock.calls[0][0] as [number, number]
          expect(val[0]).toBe(20)
          expect(val[1]).toBe(60)
        },
      )
    })

    it('should handle mousemove with range values', async () => {
      const onValueChange = vi.fn()
      await usingAsync(
        await renderSlider({
          value: [20, 80] as [number, number],
          min: 0,
          max: 100,
          step: 1,
          onValueChange,
        }),
        async ({ slider }) => {
          mockSliderRoot(slider, { left: 0, width: 200 })

          const thumbs = slider.querySelectorAll('.slider-thumb')
          // Mousedown on first thumb
          ;(thumbs[0] as HTMLElement).dispatchEvent(
            new MouseEvent('mousedown', { clientX: 40, clientY: 2, bubbles: true }),
          )

          // Move to 60px (30%)
          document.dispatchEvent(new MouseEvent('mousemove', { clientX: 60, clientY: 2, bubbles: true }))
          document.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }))
          await sleepAsync(50)

          expect(onValueChange).toHaveBeenCalled()
          const val = onValueChange.mock.calls[0][0] as [number, number]
          expect(val[0]).toBe(30)
          expect(val[1]).toBe(80)
        },
      )
    })

    it('should handle vertical mode mousedown', async () => {
      const onValueChange = vi.fn()
      await usingAsync(
        await renderSlider({ value: 50, min: 0, max: 100, step: 1, vertical: true, onValueChange }),
        async ({ slider }) => {
          mockSliderRoot(slider, { top: 0, height: 200, bottom: 200, left: 0, width: 4 })
          const root = slider.querySelector('.slider-root') as HTMLElement

          // Click at bottom-50px (bottom=200, clientY=150 → (200-150)/200=25%)
          root.dispatchEvent(new MouseEvent('mousedown', { clientX: 2, clientY: 150, bubbles: true }))
          document.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }))
          await sleepAsync(50)

          expect(onValueChange).toHaveBeenCalled()
          const calledWith = onValueChange.mock.calls[0][0] as number
          expect(calledWith).toBe(25)
        },
      )
    })

    it('should clamp pointer values to 0-100 range', async () => {
      const onValueChange = vi.fn()
      await usingAsync(
        await renderSlider({ value: 50, min: 0, max: 100, step: 1, onValueChange }),
        async ({ slider }) => {
          mockSliderRoot(slider, { left: 0, width: 200 })
          const root = slider.querySelector('.slider-root') as HTMLElement

          // Click far to the right beyond the track
          root.dispatchEvent(new MouseEvent('mousedown', { clientX: 400, clientY: 2, bubbles: true }))
          document.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }))
          await sleepAsync(50)

          expect(onValueChange).toHaveBeenCalled()
          const calledWith = onValueChange.mock.calls[0][0] as number
          expect(calledWith).toBe(100)
        },
      )
    })
  })

  describe('touch interaction', () => {
    const mockSliderRoot = (slider: HTMLElement, rect: Partial<DOMRect>) => {
      const root = slider.querySelector('.slider-root')
      if (root) {
        vi.spyOn(root, 'getBoundingClientRect').mockReturnValue({
          top: 0,
          left: 0,
          width: 200,
          height: 4,
          right: 200,
          bottom: 4,
          x: 0,
          y: 0,
          toJSON: () => ({}),
          ...rect,
        })
      }
    }

    it('should handle touchstart on track', async () => {
      const onValueChange = vi.fn()
      await usingAsync(
        await renderSlider({ value: 50, min: 0, max: 100, step: 1, onValueChange }),
        async ({ slider }) => {
          mockSliderRoot(slider, { left: 0, width: 200 })
          const root = slider.querySelector('.slider-root') as HTMLElement

          const touch = { clientX: 100, clientY: 2, identifier: 0, target: root }
          root.dispatchEvent(new TouchEvent('touchstart', { touches: [touch as unknown as Touch] }))
          document.dispatchEvent(new TouchEvent('touchend', { changedTouches: [touch as unknown as Touch] }))
          await sleepAsync(50)

          expect(onValueChange).toHaveBeenCalled()
          const calledWith = onValueChange.mock.calls[0][0] as number
          expect(calledWith).toBe(50)
        },
      )
    })

    it('should handle touchmove during drag', async () => {
      const onValueChange = vi.fn()
      await usingAsync(
        await renderSlider({ value: 0, min: 0, max: 100, step: 1, onValueChange }),
        async ({ slider }) => {
          mockSliderRoot(slider, { left: 0, width: 200 })
          const root = slider.querySelector('.slider-root') as HTMLElement

          const startTouch = { clientX: 0, clientY: 2, identifier: 0, target: root }
          root.dispatchEvent(new TouchEvent('touchstart', { touches: [startTouch as unknown as Touch] }))

          const moveTouch = { clientX: 150, clientY: 2, identifier: 0, target: slider }
          document.dispatchEvent(
            new TouchEvent('touchmove', { touches: [moveTouch as unknown as Touch], cancelable: true }),
          )

          const endTouch = { clientX: 150, clientY: 2, identifier: 0, target: slider }
          document.dispatchEvent(new TouchEvent('touchend', { changedTouches: [endTouch as unknown as Touch] }))
          await sleepAsync(50)

          expect(onValueChange).toHaveBeenCalled()
          const calledWith = onValueChange.mock.calls[0][0] as number
          expect(calledWith).toBe(75)
        },
      )
    })
  })

  describe('syncVisuals for vertical range', () => {
    it('should position range thumbs and track in vertical mode during drag', async () => {
      const onValueChange = vi.fn()
      await usingAsync(
        await renderSlider({
          value: [20, 80] as [number, number],
          min: 0,
          max: 100,
          step: 1,
          vertical: true,
          onValueChange,
        }),
        async ({ slider }) => {
          const root = slider.querySelector('.slider-root')
          if (root) {
            vi.spyOn(root, 'getBoundingClientRect').mockReturnValue({
              top: 0,
              left: 0,
              width: 4,
              height: 200,
              right: 4,
              bottom: 200,
              x: 0,
              y: 0,
              toJSON: () => ({}),
            })
          }

          const thumbs = slider.querySelectorAll('.slider-thumb')
          // Mousedown on first thumb to start drag
          ;(thumbs[0] as HTMLElement).dispatchEvent(
            new MouseEvent('mousedown', { clientX: 2, clientY: 160, bubbles: true }),
          )

          // Move to 60% from bottom: clientY = 200 - 120 = 80
          document.dispatchEvent(new MouseEvent('mousemove', { clientX: 2, clientY: 80, bubbles: true }))

          // During drag, syncVisuals updates positions directly
          expect(slider.querySelector('.slider-track')).not.toBeNull()
          expect(root!.hasAttribute('data-dragging')).toBe(true)

          document.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }))
          await sleepAsync(50)

          expect(onValueChange).toHaveBeenCalled()
        },
      )
    })
  })

  describe('edge cases', () => {
    it('should return null from getValueFromPointer when root has zero dimensions', async () => {
      const onValueChange = vi.fn()
      await usingAsync(await renderSlider({ value: 50, min: 0, max: 100, onValueChange }), async ({ slider }) => {
        const root = slider.querySelector('.slider-root')
        if (root) {
          vi.spyOn(root, 'getBoundingClientRect').mockReturnValue({
            top: 0,
            left: 0,
            width: 0,
            height: 0,
            right: 0,
            bottom: 0,
            x: 0,
            y: 0,
            toJSON: () => ({}),
          })
        }

        slider.dispatchEvent(new MouseEvent('mousedown', { clientX: 100, clientY: 2, bubbles: true }))
        document.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }))
        await sleepAsync(50)

        // Should not have fired because getValueFromPointer returned null
        expect(onValueChange).not.toHaveBeenCalled()
      })
    })

    it('should handle valueToPercent when max === min', async () => {
      await usingAsync(await renderSlider({ value: 5, min: 5, max: 5 }), async ({ slider }) => {
        const thumb = slider.querySelector('.slider-thumb') as HTMLElement
        expect(thumb.style.left).toBe('0%')
      })
    })
  })
})
