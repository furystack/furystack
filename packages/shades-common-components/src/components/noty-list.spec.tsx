import { Injector } from '@furystack/inject'
import { createComponent, initializeShadeRoot } from '@furystack/shades'
import { sleepAsync, usingAsync } from '@furystack/utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { defaultDarkTheme } from '../services/default-dark-theme.js'
import type { NotyModel } from '../services/noty-service.js'
import { NotyService } from '../services/noty-service.js'
import { ThemeProviderService } from '../services/theme-provider-service.js'
import { getDefaultNotyTimeouts, NotyComponent, NotyList } from './noty-list.js'

describe('getDefaultNotyTimeouts', () => {
  it('should return 0 for error type', () => {
    expect(getDefaultNotyTimeouts('error')).toBe(0)
  })

  it('should return 0 for warning type', () => {
    expect(getDefaultNotyTimeouts('warning')).toBe(0)
  })

  it('should return 5000 for success type', () => {
    expect(getDefaultNotyTimeouts('success')).toBe(5000)
  })

  it('should return 20000 for info type', () => {
    expect(getDefaultNotyTimeouts('info')).toBe(20000)
  })

  it('should return 0 for unknown type', () => {
    expect(getDefaultNotyTimeouts('unknown' as NotyModel['type'])).toBe(0)
  })
})

describe('NotyComponent', () => {
  let originalAnimate: typeof Element.prototype.animate
  let animateCalls: Array<{ keyframes: unknown; options: unknown }>

  const setupTheme = (injector: Injector) => {
    const themeProvider = injector.getInstance(ThemeProviderService)
    themeProvider.setAssignedTheme(defaultDarkTheme)
  }

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

  it('should render the shade-noty custom element', async () => {
    await usingAsync(new Injector(), async (injector) => {
      setupTheme(injector)
      const rootElement = document.getElementById('root') as HTMLDivElement
      const model: NotyModel = { type: 'info', title: 'Test', body: 'Test body' }

      initializeShadeRoot({
        injector,
        rootElement,
        jsxElement: <NotyComponent model={model} onDismiss={() => {}} />,
      })

      await sleepAsync(50)

      const noty = document.querySelector('shade-noty')
      expect(noty).not.toBeNull()
      expect(noty?.tagName.toLowerCase()).toBe('shade-noty')
    })
  })

  it('should render title and body content', async () => {
    await usingAsync(new Injector(), async (injector) => {
      setupTheme(injector)
      const rootElement = document.getElementById('root') as HTMLDivElement
      const model: NotyModel = { type: 'success', title: 'Success Title', body: 'Success message body' }

      initializeShadeRoot({
        injector,
        rootElement,
        jsxElement: <NotyComponent model={model} onDismiss={() => {}} />,
      })

      await sleepAsync(50)

      expect(document.body.innerHTML).toContain('Success Title')
      expect(document.body.innerHTML).toContain('Success message body')
    })
  })

  it('should apply noty class with type on the element', async () => {
    await usingAsync(new Injector(), async (injector) => {
      setupTheme(injector)
      const rootElement = document.getElementById('root') as HTMLDivElement
      const model: NotyModel = { type: 'error', title: 'Error', body: 'Error occurred' }

      initializeShadeRoot({
        injector,
        rootElement,
        jsxElement: <NotyComponent model={model} onDismiss={() => {}} />,
      })

      await sleepAsync(50)

      const noty = document.querySelector('shade-noty') as HTMLElement
      expect(noty).not.toBeNull()
      expect(noty.getAttribute('data-noty-type')).toBe('error')
    })
  })

  it('should render dismiss button', async () => {
    await usingAsync(new Injector(), async (injector) => {
      setupTheme(injector)
      const rootElement = document.getElementById('root') as HTMLDivElement
      const model: NotyModel = { type: 'warning', title: 'Warning', body: 'Warning message' }

      initializeShadeRoot({
        injector,
        rootElement,
        jsxElement: <NotyComponent model={model} onDismiss={() => {}} />,
      })

      await sleepAsync(50)

      const dismissButton = document.querySelector('.dismiss-button')
      expect(dismissButton).not.toBeNull()
      expect(dismissButton?.querySelector('shade-icon')).not.toBeNull()
    })
  })

  it('should call onDismiss when dismiss button is clicked', async () => {
    const onDismiss = vi.fn()

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
        setTimeout(() => {
          mockAnimation.onfinish?.({} as AnimationPlaybackEvent)
        }, 10)
        return mockAnimation as unknown as Animation
      },
    ) as typeof Element.prototype.animate

    await usingAsync(new Injector(), async (injector) => {
      setupTheme(injector)
      const rootElement = document.getElementById('root') as HTMLDivElement
      const model: NotyModel = { type: 'info', title: 'Info', body: 'Info message' }

      initializeShadeRoot({
        injector,
        rootElement,
        jsxElement: <NotyComponent model={model} onDismiss={onDismiss} />,
      })

      await sleepAsync(50)

      const dismissButton = document.querySelector('.dismiss-button') as HTMLButtonElement
      expect(dismissButton).not.toBeNull()
      dismissButton.click()

      await sleepAsync(50)

      expect(onDismiss).toHaveBeenCalled()
    })
  })

  it('should start fade-in animation on mount', async () => {
    vi.useFakeTimers()

    await usingAsync(new Injector(), async (injector) => {
      setupTheme(injector)
      const rootElement = document.getElementById('root') as HTMLDivElement
      const model: NotyModel = { type: 'success', title: 'Success', body: 'Success message' }

      initializeShadeRoot({
        injector,
        rootElement,
        jsxElement: <NotyComponent model={model} onDismiss={() => {}} />,
      })

      // Wait for render
      await vi.advanceTimersByTimeAsync(50)

      // The useDisposable hook schedules the animation via setTimeout
      await vi.advanceTimersByTimeAsync(10)

      const fadeInCall = animateCalls.find(
        (call) =>
          Array.isArray(call.keyframes) && call.keyframes.some((kf: Keyframe) => 'opacity' in kf && 'height' in kf),
      )

      expect(fadeInCall).toBeDefined()
      expect((fadeInCall?.options as KeyframeAnimationOptions)?.duration).toBe(500)
      expect((fadeInCall?.options as KeyframeAnimationOptions)?.fill).toBe('forwards')

      vi.useRealTimers()
    })
  })

  it('should auto-dismiss after timeout for success type', async () => {
    vi.useFakeTimers()
    const onDismiss = vi.fn()

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
        setTimeout(() => {
          mockAnimation.onfinish?.({} as AnimationPlaybackEvent)
        }, 10)
        return mockAnimation as unknown as Animation
      },
    ) as typeof Element.prototype.animate

    await usingAsync(new Injector(), async (injector) => {
      setupTheme(injector)
      const rootElement = document.getElementById('root') as HTMLDivElement
      const model: NotyModel = { type: 'success', title: 'Success', body: 'Success message' }

      initializeShadeRoot({
        injector,
        rootElement,
        jsxElement: <NotyComponent model={model} onDismiss={onDismiss} />,
      })

      await vi.advanceTimersByTimeAsync(50)
      expect(onDismiss).not.toHaveBeenCalled()

      // Success timeout is 5000ms
      await vi.advanceTimersByTimeAsync(5000)
      await vi.advanceTimersByTimeAsync(50)

      expect(onDismiss).toHaveBeenCalled()

      vi.useRealTimers()
    })
  })

  it('should use custom timeout when provided', async () => {
    vi.useFakeTimers()
    const onDismiss = vi.fn()

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
        setTimeout(() => {
          mockAnimation.onfinish?.({} as AnimationPlaybackEvent)
        }, 10)
        return mockAnimation as unknown as Animation
      },
    ) as typeof Element.prototype.animate

    await usingAsync(new Injector(), async (injector) => {
      setupTheme(injector)
      const rootElement = document.getElementById('root') as HTMLDivElement
      // Info default timeout is 20000, but we set custom 1000
      const model: NotyModel = { type: 'info', title: 'Info', body: 'Info message', timeout: 1000 }

      initializeShadeRoot({
        injector,
        rootElement,
        jsxElement: <NotyComponent model={model} onDismiss={onDismiss} />,
      })

      await vi.advanceTimersByTimeAsync(50)
      expect(onDismiss).not.toHaveBeenCalled()

      await vi.advanceTimersByTimeAsync(1000)
      await vi.advanceTimersByTimeAsync(50)

      expect(onDismiss).toHaveBeenCalled()

      vi.useRealTimers()
    })
  })

  it('should not auto-dismiss for error type (timeout 0)', async () => {
    vi.useFakeTimers()
    const onDismiss = vi.fn()

    await usingAsync(new Injector(), async (injector) => {
      setupTheme(injector)
      const rootElement = document.getElementById('root') as HTMLDivElement
      const model: NotyModel = { type: 'error', title: 'Error', body: 'Error message' }

      initializeShadeRoot({
        injector,
        rootElement,
        jsxElement: <NotyComponent model={model} onDismiss={onDismiss} />,
      })

      await vi.advanceTimersByTimeAsync(50)
      await vi.advanceTimersByTimeAsync(30000)

      expect(onDismiss).not.toHaveBeenCalled()

      vi.useRealTimers()
    })
  })

  it('should render all noty types with appropriate styling', async () => {
    const types: Array<NotyModel['type']> = ['error', 'warning', 'info', 'success']

    for (const type of types) {
      document.body.innerHTML = '<div id="root"></div>'

      await usingAsync(new Injector(), async (injector) => {
        setupTheme(injector)
        const rootElement = document.getElementById('root') as HTMLDivElement
        const model: NotyModel = { type, title: `${type} Title`, body: `${type} body` }

        initializeShadeRoot({
          injector,
          rootElement,
          jsxElement: <NotyComponent model={model} onDismiss={() => {}} />,
        })

        await sleepAsync(50)

        const noty = document.querySelector('shade-noty') as HTMLElement
        expect(noty).not.toBeNull()
        expect(noty.getAttribute('data-noty-type')).toBe(type)
      })
    }
  })

  it('should apply background color from theme', async () => {
    await usingAsync(new Injector(), async (injector) => {
      setupTheme(injector)
      const rootElement = document.getElementById('root') as HTMLDivElement
      const model: NotyModel = { type: 'success', title: 'Success', body: 'Message' }

      initializeShadeRoot({
        injector,
        rootElement,
        jsxElement: <NotyComponent model={model} onDismiss={() => {}} />,
      })

      await sleepAsync(50)

      const noty = document.querySelector('shade-noty') as HTMLElement
      expect(noty).not.toBeNull()
      // The component sets backgroundColor via style
      expect(noty.style.backgroundColor).toBeTruthy()
    })
  })
})

describe('NotyList', () => {
  let originalAnimate: typeof Element.prototype.animate
  let animateCalls: Array<{ keyframes: unknown; options: unknown }>

  const setupTheme = (injector: Injector) => {
    const themeProvider = injector.getInstance(ThemeProviderService)
    themeProvider.setAssignedTheme(defaultDarkTheme)
  }

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

  it('should render the shade-noty-list custom element', async () => {
    await usingAsync(new Injector(), async (injector) => {
      const rootElement = document.getElementById('root') as HTMLDivElement

      initializeShadeRoot({
        injector,
        rootElement,
        jsxElement: <NotyList />,
      })

      await sleepAsync(50)

      const notyList = document.querySelector('shade-noty-list')
      expect(notyList).not.toBeNull()
      expect(notyList?.tagName.toLowerCase()).toBe('shade-noty-list')
    })
  })

  it('should have fixed positioning styles', async () => {
    await usingAsync(new Injector(), async (injector) => {
      const rootElement = document.getElementById('root') as HTMLDivElement

      initializeShadeRoot({
        injector,
        rootElement,
        jsxElement: <NotyList />,
      })

      await sleepAsync(50)

      const notyList = document.querySelector('shade-noty-list') as HTMLElement
      expect(notyList).not.toBeNull()

      const computedStyle = window.getComputedStyle(notyList)
      expect(computedStyle.position).toBe('fixed')
      expect(computedStyle.display).toBe('flex')
      expect(computedStyle.flexDirection).toBe('column')
    })
  })

  it('should render existing notys from NotyService', async () => {
    await usingAsync(new Injector(), async (injector) => {
      setupTheme(injector)
      const notyService = injector.getInstance(NotyService)
      const noty1: NotyModel = { type: 'info', title: 'Info 1', body: 'Info body 1' }
      const noty2: NotyModel = { type: 'success', title: 'Success 1', body: 'Success body 1' }

      notyService.emit('onNotyAdded', noty1)
      notyService.emit('onNotyAdded', noty2)

      const rootElement = document.getElementById('root') as HTMLDivElement

      initializeShadeRoot({
        injector,
        rootElement,
        jsxElement: <NotyList />,
      })

      await sleepAsync(50)

      const notys = document.querySelectorAll('shade-noty')
      expect(notys.length).toBe(2)
    })
  })

  it('should add new noty when NotyService emits onNotyAdded', async () => {
    await usingAsync(new Injector(), async (injector) => {
      setupTheme(injector)
      const notyService = injector.getInstance(NotyService)
      const rootElement = document.getElementById('root') as HTMLDivElement

      initializeShadeRoot({
        injector,
        rootElement,
        jsxElement: <NotyList />,
      })

      await sleepAsync(50)

      let notys = document.querySelectorAll('shade-noty')
      expect(notys.length).toBe(0)

      const newNoty: NotyModel = { type: 'warning', title: 'Warning', body: 'Warning message' }
      notyService.emit('onNotyAdded', newNoty)

      await sleepAsync(50)

      notys = document.querySelectorAll('shade-noty')
      expect(notys.length).toBe(1)
    })
  })

  it('should remove noty when NotyService emits onNotyRemoved', async () => {
    await usingAsync(new Injector(), async (injector) => {
      setupTheme(injector)
      const notyService = injector.getInstance(NotyService)
      const noty: NotyModel = { type: 'error', title: 'Error', body: 'Error message' }

      notyService.emit('onNotyAdded', noty)

      const rootElement = document.getElementById('root') as HTMLDivElement

      initializeShadeRoot({
        injector,
        rootElement,
        jsxElement: <NotyList />,
      })

      await sleepAsync(50)

      let notys = document.querySelectorAll('shade-noty')
      expect(notys.length).toBe(1)

      notyService.emit('onNotyRemoved', noty)

      await sleepAsync(50)

      notys = document.querySelectorAll('shade-noty')
      expect(notys.length).toBe(0)
    })
  })

  it('should handle multiple notys being added and removed', async () => {
    await usingAsync(new Injector(), async (injector) => {
      setupTheme(injector)
      const notyService = injector.getInstance(NotyService)
      const rootElement = document.getElementById('root') as HTMLDivElement

      initializeShadeRoot({
        injector,
        rootElement,
        jsxElement: <NotyList />,
      })

      await sleepAsync(50)

      const noty1: NotyModel = { type: 'info', title: 'Info 1', body: 'Body 1' }
      const noty2: NotyModel = { type: 'success', title: 'Success 1', body: 'Body 2' }
      const noty3: NotyModel = { type: 'warning', title: 'Warning 1', body: 'Body 3' }

      notyService.emit('onNotyAdded', noty1)
      notyService.emit('onNotyAdded', noty2)
      notyService.emit('onNotyAdded', noty3)

      await sleepAsync(50)

      let notys = document.querySelectorAll('shade-noty')
      expect(notys.length).toBe(3)

      notyService.emit('onNotyRemoved', noty2)

      await sleepAsync(50)

      notys = document.querySelectorAll('shade-noty')
      expect(notys.length).toBe(2)

      notyService.emit('onNotyRemoved', noty1)
      notyService.emit('onNotyRemoved', noty3)

      await sleepAsync(50)

      notys = document.querySelectorAll('shade-noty')
      expect(notys.length).toBe(0)
    })
  })

  it('should only remove the specific noty that was requested', async () => {
    await usingAsync(new Injector(), async (injector) => {
      setupTheme(injector)
      const notyService = injector.getInstance(NotyService)
      const rootElement = document.getElementById('root') as HTMLDivElement

      const noty1: NotyModel = { type: 'info', title: 'Keep this', body: 'Body 1' }
      const noty2: NotyModel = { type: 'error', title: 'Remove this', body: 'Body 2' }

      notyService.emit('onNotyAdded', noty1)
      notyService.emit('onNotyAdded', noty2)

      initializeShadeRoot({
        injector,
        rootElement,
        jsxElement: <NotyList />,
      })

      await sleepAsync(50)

      notyService.emit('onNotyRemoved', noty2)

      await sleepAsync(50)

      const notys = document.querySelectorAll('shade-noty')
      expect(notys.length).toBe(1)

      // Check that the remaining noty is the correct one
      expect(document.body.innerHTML).toContain('Keep this')
      expect(document.body.innerHTML).not.toContain('Remove this')
    })
  })
})
