import { Injector } from '@furystack/inject'
import { createComponent, initializeShadeRoot } from '@furystack/shades'
import { ObservableValue, sleepAsync, usingAsync } from '@furystack/utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ThemeProviderService } from '../services/theme-provider-service.js'
import { LinearProgress } from './linear-progress.js'

describe('LinearProgress', () => {
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
        jsxElement: <LinearProgress />,
      })

      await sleepAsync(50)

      const el = document.querySelector('shade-linear-progress')
      expect(el).not.toBeNull()
    })
  })

  it('should render the progress bar element', async () => {
    await usingAsync(new Injector(), async (injector) => {
      const rootElement = document.getElementById('root') as HTMLDivElement

      initializeShadeRoot({
        injector,
        rootElement,
        jsxElement: <LinearProgress />,
      })

      await sleepAsync(50)

      const bar = document.querySelector('shade-linear-progress .progress-bar')
      expect(bar).not.toBeNull()
    })
  })

  it('should set role="progressbar"', async () => {
    await usingAsync(new Injector(), async (injector) => {
      const rootElement = document.getElementById('root') as HTMLDivElement

      initializeShadeRoot({
        injector,
        rootElement,
        jsxElement: <LinearProgress />,
      })

      await sleepAsync(50)

      const el = document.querySelector('shade-linear-progress') as HTMLElement
      expect(el.getAttribute('role')).toBe('progressbar')
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
          jsxElement: <LinearProgress variant="determinate" value={value} />,
        })

        await sleepAsync(50)

        const el = document.querySelector('shade-linear-progress') as HTMLElement
        expect(el.getAttribute('aria-valuenow')).toBe('50')
        expect(el.getAttribute('aria-valuemin')).toBe('0')
        expect(el.getAttribute('aria-valuemax')).toBe('100')
      })
    })

    it('should set bar width based on value', async () => {
      await usingAsync(new Injector(), async (injector) => {
        const rootElement = document.getElementById('root') as HTMLDivElement
        const value = new ObservableValue(75)

        initializeShadeRoot({
          injector,
          rootElement,
          jsxElement: <LinearProgress variant="determinate" value={value} />,
        })

        await sleepAsync(50)

        const bar = document.querySelector('shade-linear-progress .progress-bar') as HTMLElement
        expect(bar.style.width).toBe('75%')
      })
    })

    it('should clamp value to 0-100 range', async () => {
      await usingAsync(new Injector(), async (injector) => {
        const rootElement = document.getElementById('root') as HTMLDivElement
        const value = new ObservableValue(150)

        initializeShadeRoot({
          injector,
          rootElement,
          jsxElement: <LinearProgress variant="determinate" value={value} />,
        })

        await sleepAsync(50)

        const bar = document.querySelector('shade-linear-progress .progress-bar') as HTMLElement
        expect(bar.style.width).toBe('100%')
      })
    })

    it('should clamp negative values to 0', async () => {
      await usingAsync(new Injector(), async (injector) => {
        const rootElement = document.getElementById('root') as HTMLDivElement
        const value = new ObservableValue(-20)

        initializeShadeRoot({
          injector,
          rootElement,
          jsxElement: <LinearProgress variant="determinate" value={value} />,
        })

        await sleepAsync(50)

        const bar = document.querySelector('shade-linear-progress .progress-bar') as HTMLElement
        expect(bar.style.width).toBe('0%')
      })
    })

    it('should update bar width when observable value changes', async () => {
      await usingAsync(new Injector(), async (injector) => {
        const rootElement = document.getElementById('root') as HTMLDivElement
        const value = new ObservableValue(20)

        initializeShadeRoot({
          injector,
          rootElement,
          jsxElement: <LinearProgress variant="determinate" value={value} />,
        })

        await sleepAsync(50)

        const bar = document.querySelector('shade-linear-progress .progress-bar') as HTMLElement
        expect(bar.style.width).toBe('20%')

        value.setValue(80)
        await sleepAsync(10)

        expect(bar.style.width).toBe('80%')
      })
    })

    it('should update aria-valuenow when observable value changes', async () => {
      await usingAsync(new Injector(), async (injector) => {
        const rootElement = document.getElementById('root') as HTMLDivElement
        const value = new ObservableValue(30)

        initializeShadeRoot({
          injector,
          rootElement,
          jsxElement: <LinearProgress variant="determinate" value={value} />,
        })

        await sleepAsync(50)

        const el = document.querySelector('shade-linear-progress') as HTMLElement
        expect(el.getAttribute('aria-valuenow')).toBe('30')

        value.setValue(90)
        await sleepAsync(10)

        expect(el.getAttribute('aria-valuenow')).toBe('90')
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
          jsxElement: <LinearProgress />,
        })

        await sleepAsync(50)

        const bar = document.querySelector('shade-linear-progress .progress-bar') as HTMLElement
        expect(bar.hasAttribute('data-indeterminate')).toBe(true)
      })
    })

    it('should not set aria-valuenow for indeterminate variant', async () => {
      await usingAsync(new Injector(), async (injector) => {
        const rootElement = document.getElementById('root') as HTMLDivElement

        initializeShadeRoot({
          injector,
          rootElement,
          jsxElement: <LinearProgress />,
        })

        await sleepAsync(50)

        const el = document.querySelector('shade-linear-progress') as HTMLElement
        expect(el.hasAttribute('aria-valuenow')).toBe(false)
      })
    })
  })

  describe('size', () => {
    it('should set data-size="small" when size is small', async () => {
      await usingAsync(new Injector(), async (injector) => {
        const rootElement = document.getElementById('root') as HTMLDivElement

        initializeShadeRoot({
          injector,
          rootElement,
          jsxElement: <LinearProgress size="small" />,
        })

        await sleepAsync(50)

        const el = document.querySelector('shade-linear-progress') as HTMLElement
        expect(el.getAttribute('data-size')).toBe('small')
      })
    })

    it('should not set data-size when size is medium (default)', async () => {
      await usingAsync(new Injector(), async (injector) => {
        const rootElement = document.getElementById('root') as HTMLDivElement

        initializeShadeRoot({
          injector,
          rootElement,
          jsxElement: <LinearProgress />,
        })

        await sleepAsync(50)

        const el = document.querySelector('shade-linear-progress') as HTMLElement
        expect(el.hasAttribute('data-size')).toBe(false)
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
          jsxElement: <LinearProgress />,
        })

        await sleepAsync(50)

        const el = document.querySelector('shade-linear-progress') as HTMLElement
        const themeService = injector.getInstance(ThemeProviderService)
        expect(el.style.getPropertyValue('--progress-color')).toBe(themeService.theme.palette.primary.main)
      })
    })

    it('should use custom color from color prop', async () => {
      await usingAsync(new Injector(), async (injector) => {
        const rootElement = document.getElementById('root') as HTMLDivElement

        initializeShadeRoot({
          injector,
          rootElement,
          jsxElement: <LinearProgress color="error" />,
        })

        await sleepAsync(50)

        const el = document.querySelector('shade-linear-progress') as HTMLElement
        const themeService = injector.getInstance(ThemeProviderService)
        expect(el.style.getPropertyValue('--progress-color')).toBe(themeService.theme.palette.error.main)
      })
    })
  })
})
