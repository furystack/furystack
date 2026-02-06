import { Injector } from '@furystack/inject'
import { createComponent, initializeShadeRoot } from '@furystack/shades'
import { sleepAsync, usingAsync } from '@furystack/utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { Skeleton } from './skeleton.js'

describe('Skeleton', () => {
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

        if (Array.isArray(keyframes) && keyframes.some((kf: Keyframe) => 'opacity' in kf)) {
          setTimeout(() => {
            if (mockAnimation.onfinish) {
              mockAnimation.onfinish({} as AnimationPlaybackEvent)
            }
          }, 10)
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
        jsxElement: <Skeleton />,
      })

      await sleepAsync(50)

      const skeleton = document.querySelector('shade-skeleton')
      expect(skeleton).not.toBeNull()
    })
  })

  it('should have initial opacity of 0', async () => {
    await usingAsync(new Injector(), async (injector) => {
      const rootElement = document.getElementById('root') as HTMLDivElement

      initializeShadeRoot({
        injector,
        rootElement,
        jsxElement: <Skeleton />,
      })

      await sleepAsync(50)

      const skeleton = document.querySelector('shade-skeleton') as HTMLElement
      expect(skeleton).not.toBeNull()

      const computedStyle = window.getComputedStyle(skeleton)
      expect(computedStyle.opacity).toBe('0')
    })
  })

  it('should use default delay of 1500ms', async () => {
    await usingAsync(new Injector(), async (injector) => {
      const rootElement = document.getElementById('root') as HTMLDivElement

      initializeShadeRoot({
        injector,
        rootElement,
        jsxElement: <Skeleton />,
      })

      await sleepAsync(50)

      const fadeInCall = animateCalls.find(
        (call) => Array.isArray(call.keyframes) && call.keyframes.some((kf: Keyframe) => 'opacity' in kf),
      )

      expect(fadeInCall).toBeDefined()
      expect((fadeInCall?.options as KeyframeAnimationOptions)?.delay).toBe(1500)
    })
  })

  it('should use custom delay when provided', async () => {
    await usingAsync(new Injector(), async (injector) => {
      const rootElement = document.getElementById('root') as HTMLDivElement

      initializeShadeRoot({
        injector,
        rootElement,
        jsxElement: <Skeleton delay={500} />,
      })

      await sleepAsync(50)

      const fadeInCall = animateCalls.find(
        (call) => Array.isArray(call.keyframes) && call.keyframes.some((kf: Keyframe) => 'opacity' in kf),
      )

      expect(fadeInCall).toBeDefined()
      expect((fadeInCall?.options as KeyframeAnimationOptions)?.delay).toBe(500)
    })
  })

  it('should have correct css styles applied', async () => {
    await usingAsync(new Injector(), async (injector) => {
      const rootElement = document.getElementById('root') as HTMLDivElement

      initializeShadeRoot({
        injector,
        rootElement,
        jsxElement: <Skeleton />,
      })

      await sleepAsync(50)

      const skeleton = document.querySelector('shade-skeleton') as HTMLElement
      expect(skeleton).not.toBeNull()

      const computedStyle = window.getComputedStyle(skeleton)
      expect(computedStyle.display).toBe('inline-block')
    })
  })

  it('should start fade-in animation with correct parameters', async () => {
    await usingAsync(new Injector(), async (injector) => {
      const rootElement = document.getElementById('root') as HTMLDivElement

      initializeShadeRoot({
        injector,
        rootElement,
        jsxElement: <Skeleton delay={100} />,
      })

      await sleepAsync(50)

      const fadeInCall = animateCalls.find(
        (call) =>
          Array.isArray(call.keyframes) &&
          call.keyframes.length === 2 &&
          (call.keyframes[0] as Keyframe).opacity === 0 &&
          (call.keyframes[1] as Keyframe).opacity === 1,
      )

      expect(fadeInCall).toBeDefined()

      const options = fadeInCall?.options as KeyframeAnimationOptions
      expect(options.fill).toBe('forwards')
      expect(options.duration).toBe(300)
      expect(options.easing).toBe('ease-out')
      expect(options.delay).toBe(100)
    })
  })

  it('should start background animation after fade-in completes', async () => {
    await usingAsync(new Injector(), async (injector) => {
      const rootElement = document.getElementById('root') as HTMLDivElement

      initializeShadeRoot({
        injector,
        rootElement,
        jsxElement: <Skeleton delay={0} />,
      })

      await sleepAsync(100)

      const backgroundAnimation = animateCalls.find(
        (call) => Array.isArray(call.keyframes) && call.keyframes.some((kf: Keyframe) => 'backgroundPosition' in kf),
      )

      expect(backgroundAnimation).toBeDefined()

      const options = backgroundAnimation?.options as KeyframeAnimationOptions
      expect(options.duration).toBe(10000)
      expect(options.iterations).toBe(Infinity)
    })
  })

  it('should have gradient background animation keyframes', async () => {
    await usingAsync(new Injector(), async (injector) => {
      const rootElement = document.getElementById('root') as HTMLDivElement

      initializeShadeRoot({
        injector,
        rootElement,
        jsxElement: <Skeleton delay={0} />,
      })

      await sleepAsync(100)

      const backgroundAnimation = animateCalls.find(
        (call) => Array.isArray(call.keyframes) && call.keyframes.some((kf: Keyframe) => 'backgroundPosition' in kf),
      )

      expect(backgroundAnimation).toBeDefined()

      const keyframes = backgroundAnimation?.keyframes as Keyframe[]
      expect(keyframes).toHaveLength(3)
      expect(keyframes[0].backgroundPosition).toBe('0% 50%')
      expect(keyframes[1].backgroundPosition).toBe('100% 50%')
      expect(keyframes[2].backgroundPosition).toBe('0% 50%')
    })
  })
})
