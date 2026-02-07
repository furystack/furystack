import { Injector } from '@furystack/inject'
import { createComponent, initializeShadeRoot } from '@furystack/shades'
import { ObservableValue, sleepAsync, usingAsync } from '@furystack/utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ThemeProviderService } from '../services/theme-provider-service.js'
import { CircularProgress } from './circular-progress.js'

describe('CircularProgress', () => {
  let originalAnimate: typeof Element.prototype.animate

  beforeEach(() => {
    document.body.innerHTML = '<div id="root"></div>'
    originalAnimate = Element.prototype.animate

    Element.prototype.animate = vi.fn(
      (_keyframes: Keyframe[] | PropertyIndexedKeyframes | null, _options?: number | KeyframeAnimationOptions) => {
        const mockAnimation = {
          onfinish: null as ((event: AnimationPlaybackEvent) => void) | null,
          oncancel: null as ((event: AnimationPlaybackEvent) => void) | null,
          cancel: vi.fn(),
          play: vi.fn(),
          pause: vi.fn(),
          finish: vi.fn(),
          addEventListener: vi.fn(),
          removeEventListener: vi.fn(),
        }
        return mockAnimation as unknown as Animation
      },
    ) as typeof Element.prototype.animate
  })

  afterEach(() => {
    document.body.innerHTML = ''
    Element.prototype.animate = originalAnimate
    vi.restoreAllMocks()
  })

  it('should render with shadow DOM', async () => {
    await usingAsync(new Injector(), async (injector) => {
      const rootElement = document.getElementById('root') as HTMLDivElement

      initializeShadeRoot({
        injector,
        rootElement,
        jsxElement: <CircularProgress />,
      })

      await sleepAsync(50)

      const el = document.querySelector('shade-circular-progress')
      expect(el).not.toBeNull()
    })
  })

  it('should render an SVG element', async () => {
    await usingAsync(new Injector(), async (injector) => {
      const rootElement = document.getElementById('root') as HTMLDivElement

      initializeShadeRoot({
        injector,
        rootElement,
        jsxElement: <CircularProgress />,
      })

      await sleepAsync(50)

      const svg = document.querySelector('shade-circular-progress svg')
      expect(svg).not.toBeNull()
    })
  })

  it('should render track and progress circles', async () => {
    await usingAsync(new Injector(), async (injector) => {
      const rootElement = document.getElementById('root') as HTMLDivElement

      initializeShadeRoot({
        injector,
        rootElement,
        jsxElement: <CircularProgress />,
      })

      await sleepAsync(50)

      const track = document.querySelector('shade-circular-progress .progress-track')
      const circle = document.querySelector('shade-circular-progress .progress-circle')
      expect(track).not.toBeNull()
      expect(circle).not.toBeNull()
    })
  })

  it('should set role="progressbar"', async () => {
    await usingAsync(new Injector(), async (injector) => {
      const rootElement = document.getElementById('root') as HTMLDivElement

      initializeShadeRoot({
        injector,
        rootElement,
        jsxElement: <CircularProgress />,
      })

      await sleepAsync(50)

      const el = document.querySelector('shade-circular-progress') as HTMLElement
      expect(el.getAttribute('role')).toBe('progressbar')
    })
  })

  describe('size', () => {
    it('should use default size of 40px', async () => {
      await usingAsync(new Injector(), async (injector) => {
        const rootElement = document.getElementById('root') as HTMLDivElement

        initializeShadeRoot({
          injector,
          rootElement,
          jsxElement: <CircularProgress />,
        })

        await sleepAsync(50)

        const svg = document.querySelector('shade-circular-progress svg') as SVGElement
        expect(svg.getAttribute('width')).toBe('40')
        expect(svg.getAttribute('height')).toBe('40')
      })
    })

    it('should accept custom size', async () => {
      await usingAsync(new Injector(), async (injector) => {
        const rootElement = document.getElementById('root') as HTMLDivElement

        initializeShadeRoot({
          injector,
          rootElement,
          jsxElement: <CircularProgress size={60} />,
        })

        await sleepAsync(50)

        const svg = document.querySelector('shade-circular-progress svg') as SVGElement
        expect(svg.getAttribute('width')).toBe('60')
        expect(svg.getAttribute('height')).toBe('60')
      })
    })
  })

  describe('determinate variant', () => {
    it('should set aria-valuenow for determinate variant', async () => {
      await usingAsync(new Injector(), async (injector) => {
        const rootElement = document.getElementById('root') as HTMLDivElement
        const value = new ObservableValue(50)

        initializeShadeRoot({
          injector,
          rootElement,
          jsxElement: <CircularProgress variant="determinate" value={value} />,
        })

        await sleepAsync(50)

        const el = document.querySelector('shade-circular-progress') as HTMLElement
        expect(el.getAttribute('aria-valuenow')).toBe('50')
        expect(el.getAttribute('aria-valuemin')).toBe('0')
        expect(el.getAttribute('aria-valuemax')).toBe('100')
      })
    })

    it('should clamp value to 0-100 range', async () => {
      await usingAsync(new Injector(), async (injector) => {
        const rootElement = document.getElementById('root') as HTMLDivElement
        const value = new ObservableValue(150)

        initializeShadeRoot({
          injector,
          rootElement,
          jsxElement: <CircularProgress variant="determinate" value={value} />,
        })

        await sleepAsync(50)

        const el = document.querySelector('shade-circular-progress') as HTMLElement
        expect(el.getAttribute('aria-valuenow')).toBe('100')
      })
    })

    it('should update stroke-dashoffset when observable value changes', async () => {
      await usingAsync(new Injector(), async (injector) => {
        const rootElement = document.getElementById('root') as HTMLDivElement
        const value = new ObservableValue(0)

        initializeShadeRoot({
          injector,
          rootElement,
          jsxElement: <CircularProgress variant="determinate" value={value} />,
        })

        await sleepAsync(50)

        const circle = document.querySelector('shade-circular-progress .progress-circle') as SVGCircleElement
        const initialOffset = circle.style.strokeDashoffset

        value.setValue(75)
        await sleepAsync(10)

        const updatedOffset = circle.style.strokeDashoffset
        expect(updatedOffset).not.toBe(initialOffset)
      })
    })

    it('should update aria-valuenow when observable value changes', async () => {
      await usingAsync(new Injector(), async (injector) => {
        const rootElement = document.getElementById('root') as HTMLDivElement
        const value = new ObservableValue(20)

        initializeShadeRoot({
          injector,
          rootElement,
          jsxElement: <CircularProgress variant="determinate" value={value} />,
        })

        await sleepAsync(50)

        const el = document.querySelector('shade-circular-progress') as HTMLElement
        expect(el.getAttribute('aria-valuenow')).toBe('20')

        value.setValue(85)
        await sleepAsync(10)

        expect(el.getAttribute('aria-valuenow')).toBe('85')
      })
    })
  })

  describe('indeterminate variant', () => {
    it('should default to indeterminate variant', async () => {
      await usingAsync(new Injector(), async (injector) => {
        const rootElement = document.getElementById('root') as HTMLDivElement

        initializeShadeRoot({
          injector,
          rootElement,
          jsxElement: <CircularProgress />,
        })

        await sleepAsync(50)

        const el = document.querySelector('shade-circular-progress') as HTMLElement
        expect(el.hasAttribute('aria-valuenow')).toBe(false)
      })
    })
  })

  describe('theme integration', () => {
    it('should set CSS color variable from theme', async () => {
      await usingAsync(new Injector(), async (injector) => {
        const rootElement = document.getElementById('root') as HTMLDivElement

        initializeShadeRoot({
          injector,
          rootElement,
          jsxElement: <CircularProgress />,
        })

        await sleepAsync(50)

        const el = document.querySelector('shade-circular-progress') as HTMLElement
        const themeService = injector.getInstance(ThemeProviderService)
        expect(el.style.getPropertyValue('--circular-progress-color')).toBe(themeService.theme.palette.primary.main)
      })
    })

    it('should use custom color from color prop', async () => {
      await usingAsync(new Injector(), async (injector) => {
        const rootElement = document.getElementById('root') as HTMLDivElement

        initializeShadeRoot({
          injector,
          rootElement,
          jsxElement: <CircularProgress color="secondary" />,
        })

        await sleepAsync(50)

        const el = document.querySelector('shade-circular-progress') as HTMLElement
        const themeService = injector.getInstance(ThemeProviderService)
        expect(el.style.getPropertyValue('--circular-progress-color')).toBe(themeService.theme.palette.secondary.main)
      })
    })
  })
})
