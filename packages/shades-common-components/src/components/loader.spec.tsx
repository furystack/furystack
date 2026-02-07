import { Injector } from '@furystack/inject'
import { createComponent, initializeShadeRoot } from '@furystack/shades'
import { sleepAsync, usingAsync } from '@furystack/utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cssVariableTheme } from '../services/css-variable-theme.js'
import { ThemeProviderService } from '../services/theme-provider-service.js'
import { Loader } from './loader.js'

describe('Loader', () => {
  let originalAnimate: typeof Element.prototype.animate
  let animateCalls: Array<{ keyframes: unknown; options: unknown }>

  beforeEach(() => {
    document.body.innerHTML = '<div id="root"></div>'
    animateCalls = []
    originalAnimate = Element.prototype.animate

    Element.prototype.animate = vi.fn(
      (keyframes: Keyframe[] | PropertyIndexedKeyframes | null, options?: number | KeyframeAnimationOptions) => {
        animateCalls.push({ keyframes, options })
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
        jsxElement: <Loader />,
      })

      await sleepAsync(50)

      const loader = document.querySelector('shade-loader')
      expect(loader).not.toBeNull()
    })
  })

  it('should have initial opacity of 0', async () => {
    await usingAsync(new Injector(), async (injector) => {
      const rootElement = document.getElementById('root') as HTMLDivElement

      initializeShadeRoot({
        injector,
        rootElement,
        jsxElement: <Loader />,
      })

      await sleepAsync(50)

      const loader = document.querySelector('shade-loader') as HTMLElement
      expect(loader).not.toBeNull()

      const computedStyle = window.getComputedStyle(loader)
      expect(computedStyle.opacity).toBe('0')
    })
  })

  it('should have correct css styles applied', async () => {
    await usingAsync(new Injector(), async (injector) => {
      const rootElement = document.getElementById('root') as HTMLDivElement

      initializeShadeRoot({
        injector,
        rootElement,
        jsxElement: <Loader />,
      })

      await sleepAsync(50)

      const loader = document.querySelector('shade-loader') as HTMLElement
      expect(loader).not.toBeNull()

      const computedStyle = window.getComputedStyle(loader)
      expect(computedStyle.display).toBe('inline-block')
      expect(computedStyle.transformOrigin).toBe('center')
    })
  })

  it('should use default delay of 500ms', async () => {
    await usingAsync(new Injector(), async (injector) => {
      const rootElement = document.getElementById('root') as HTMLDivElement

      initializeShadeRoot({
        injector,
        rootElement,
        jsxElement: <Loader />,
      })

      await sleepAsync(50)

      const fadeInCall = animateCalls.find(
        (call) => Array.isArray(call.keyframes) && call.keyframes.some((kf: Keyframe) => 'opacity' in kf),
      )

      expect(fadeInCall).toBeDefined()
      expect((fadeInCall?.options as KeyframeAnimationOptions)?.delay).toBe(500)
    })
  })

  it('should use custom delay when provided', async () => {
    await usingAsync(new Injector(), async (injector) => {
      const rootElement = document.getElementById('root') as HTMLDivElement

      initializeShadeRoot({
        injector,
        rootElement,
        jsxElement: <Loader delay={200} />,
      })

      await sleepAsync(50)

      const fadeInCall = animateCalls.find(
        (call) => Array.isArray(call.keyframes) && call.keyframes.some((kf: Keyframe) => 'opacity' in kf),
      )

      expect(fadeInCall).toBeDefined()
      expect((fadeInCall?.options as KeyframeAnimationOptions)?.delay).toBe(200)
    })
  })

  it('should start fade-in animation with correct parameters', async () => {
    await usingAsync(new Injector(), async (injector) => {
      const rootElement = document.getElementById('root') as HTMLDivElement

      initializeShadeRoot({
        injector,
        rootElement,
        jsxElement: <Loader delay={100} />,
      })

      await sleepAsync(50)

      const fadeInCall = animateCalls.find(
        (call) =>
          Array.isArray(call.keyframes) &&
          call.keyframes.length === 2 &&
          (call.keyframes[0] as Keyframe).opacity === '0' &&
          (call.keyframes[1] as Keyframe).opacity === '1',
      )

      expect(fadeInCall).toBeDefined()

      const options = fadeInCall?.options as KeyframeAnimationOptions
      expect(options.fill).toBe('forwards')
      expect(options.duration).toBe(500)
      expect(options.delay).toBe(100)
    })
  })

  it('should start rotation animation', async () => {
    await usingAsync(new Injector(), async (injector) => {
      const rootElement = document.getElementById('root') as HTMLDivElement

      initializeShadeRoot({
        injector,
        rootElement,
        jsxElement: <Loader />,
      })

      await sleepAsync(50)

      const rotationCall = animateCalls.find(
        (call) => Array.isArray(call.keyframes) && call.keyframes.some((kf: Keyframe) => 'transform' in kf),
      )

      expect(rotationCall).toBeDefined()

      const options = rotationCall?.options as KeyframeAnimationOptions
      expect(options.duration).toBe(1500)
      expect(options.easing).toBe('ease-in-out')
      expect(options.iterations).toBe(Infinity)
    })
  })

  it('should have rotation keyframes from 0 to 360 degrees', async () => {
    await usingAsync(new Injector(), async (injector) => {
      const rootElement = document.getElementById('root') as HTMLDivElement

      initializeShadeRoot({
        injector,
        rootElement,
        jsxElement: <Loader />,
      })

      await sleepAsync(50)

      const rotationCall = animateCalls.find(
        (call) => Array.isArray(call.keyframes) && call.keyframes.some((kf: Keyframe) => 'transform' in kf),
      )

      expect(rotationCall).toBeDefined()

      const keyframes = rotationCall?.keyframes as Keyframe[]
      expect(keyframes).toHaveLength(3)
      expect(keyframes[0].transform).toBe('rotate(0deg)')
      expect(keyframes[1].transform).toBe('rotate(180deg)')
      expect(keyframes[2].transform).toBe('rotate(360deg)')
    })
  })

  it('should use default borderWidth of 15px', async () => {
    await usingAsync(new Injector(), async (injector) => {
      const rootElement = document.getElementById('root') as HTMLDivElement

      initializeShadeRoot({
        injector,
        rootElement,
        jsxElement: <Loader />,
      })

      await sleepAsync(50)

      const loader = document.querySelector('shade-loader') as HTMLElement
      expect(loader).not.toBeNull()

      const innerDiv = loader.querySelector('div') as HTMLElement
      expect(innerDiv).not.toBeNull()

      expect(innerDiv.style.width).toBe('calc(100% - 30px)')
      expect(innerDiv.style.height).toBe('calc(100% - 30px)')
      const styleAttr = innerDiv.getAttribute('style') || ''
      expect(styleAttr).toContain('15px solid')
    })
  })

  it('should use custom borderWidth when provided', async () => {
    await usingAsync(new Injector(), async (injector) => {
      const rootElement = document.getElementById('root') as HTMLDivElement

      initializeShadeRoot({
        injector,
        rootElement,
        jsxElement: <Loader borderWidth={10} />,
      })

      await sleepAsync(50)

      const loader = document.querySelector('shade-loader') as HTMLElement
      expect(loader).not.toBeNull()

      const innerDiv = loader.querySelector('div') as HTMLElement
      expect(innerDiv).not.toBeNull()

      expect(innerDiv.style.width).toBe('calc(100% - 20px)')
      expect(innerDiv.style.height).toBe('calc(100% - 20px)')
      const styleAttr = innerDiv.getAttribute('style') || ''
      expect(styleAttr).toContain('10px solid')
    })
  })

  it('should use custom borderColor when provided', async () => {
    await usingAsync(new Injector(), async (injector) => {
      const rootElement = document.getElementById('root') as HTMLDivElement

      initializeShadeRoot({
        injector,
        rootElement,
        jsxElement: <Loader borderColor="#ff0000" />,
      })

      await sleepAsync(50)

      const loader = document.querySelector('shade-loader') as HTMLElement
      expect(loader).not.toBeNull()

      const innerDiv = loader.querySelector('div') as HTMLElement
      expect(innerDiv).not.toBeNull()

      expect(innerDiv.style.borderBottomColor).toBe('rgb(255, 0, 0)')
    })
  })

  it('should use theme primary color as default borderColor', async () => {
    await usingAsync(new Injector(), async (injector) => {
      const rootElement = document.getElementById('root') as HTMLDivElement

      initializeShadeRoot({
        injector,
        rootElement,
        jsxElement: <Loader />,
      })

      await sleepAsync(50)

      const loader = document.querySelector('shade-loader') as HTMLElement
      expect(loader).not.toBeNull()

      const innerDiv = loader.querySelector('div') as HTMLElement
      expect(innerDiv).not.toBeNull()

      const themeService = injector.getInstance(ThemeProviderService)
      expect(innerDiv.style.borderBottom).toContain(themeService.theme.palette.primary.main)
    })
  })

  it('should render with circular shape', async () => {
    await usingAsync(new Injector(), async (injector) => {
      const rootElement = document.getElementById('root') as HTMLDivElement

      initializeShadeRoot({
        injector,
        rootElement,
        jsxElement: <Loader />,
      })

      await sleepAsync(50)

      const loader = document.querySelector('shade-loader') as HTMLElement
      expect(loader).not.toBeNull()

      const innerDiv = loader.querySelector('div') as HTMLElement
      expect(innerDiv).not.toBeNull()

      expect(innerDiv.style.borderRadius).toBe(cssVariableTheme.shape.borderRadius.full)
      expect(innerDiv.style.position).toBe('relative')
    })
  })

  it('should have a semi-transparent main border and colored bottom border', async () => {
    await usingAsync(new Injector(), async (injector) => {
      const rootElement = document.getElementById('root') as HTMLDivElement

      initializeShadeRoot({
        injector,
        rootElement,
        jsxElement: <Loader borderColor="#00ff00" />,
      })

      await sleepAsync(50)

      const loader = document.querySelector('shade-loader') as HTMLElement
      expect(loader).not.toBeNull()

      const innerDiv = loader.querySelector('div') as HTMLElement
      expect(innerDiv).not.toBeNull()

      expect(innerDiv.style.borderBottom).toContain('rgb(0, 255, 0)')
    })
  })
})
