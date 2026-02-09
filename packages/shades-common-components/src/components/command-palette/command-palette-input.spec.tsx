import { Injector } from '@furystack/inject'
import { createComponent, initializeShadeRoot } from '@furystack/shades'
import { sleepAsync, usingAsync } from '@furystack/utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { CommandPaletteInput } from './command-palette-input.js'
import { CommandPaletteManager } from './command-palette-manager.js'

describe('CommandPaletteInput', () => {
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

        setTimeout(() => {
          mockAnimation.onfinish?.({} as AnimationPlaybackEvent)
        }, 10)

        return mockAnimation as unknown as Animation
      },
    ) as typeof Element.prototype.animate
  })

  afterEach(() => {
    document.body.innerHTML = ''
    Element.prototype.animate = originalAnimate
    vi.restoreAllMocks()
  })

  const createManager = () => {
    return new CommandPaletteManager([])
  }

  it('should render as custom element', async () => {
    await usingAsync(new Injector(), async (injector) => {
      const manager = createManager()
      const rootElement = document.getElementById('root') as HTMLDivElement

      initializeShadeRoot({
        injector,
        rootElement,
        jsxElement: <CommandPaletteInput manager={manager} />,
      })

      await sleepAsync(50)

      const input = document.querySelector('shades-command-palette-input')
      expect(input).not.toBeNull()

      manager[Symbol.dispose]()
    })
  })

  it('should render an input element with placeholder', async () => {
    await usingAsync(new Injector(), async (injector) => {
      const manager = createManager()
      const rootElement = document.getElementById('root') as HTMLDivElement

      initializeShadeRoot({
        injector,
        rootElement,
        jsxElement: <CommandPaletteInput manager={manager} />,
      })

      await sleepAsync(50)

      const component = document.querySelector('shades-command-palette-input') as HTMLElement
      const inputElement = component?.querySelector('input')
      expect(inputElement).not.toBeNull()
      expect(inputElement?.placeholder).toBe('Type to search commands...')

      manager[Symbol.dispose]()
    })
  })

  it('should start with width 0% when closed', async () => {
    await usingAsync(new Injector(), async (injector) => {
      const manager = createManager()
      manager.isOpened.setValue(false)
      const rootElement = document.getElementById('root') as HTMLDivElement

      initializeShadeRoot({
        injector,
        rootElement,
        jsxElement: <CommandPaletteInput manager={manager} />,
      })

      await sleepAsync(50)

      const component = document.querySelector('shades-command-palette-input') as HTMLElement
      expect(component.hasAttribute('data-opened')).toBe(false)

      manager[Symbol.dispose]()
    })
  })

  it('should have width 100% when opened', async () => {
    await usingAsync(new Injector(), async (injector) => {
      const manager = createManager()
      manager.isOpened.setValue(true)
      const rootElement = document.getElementById('root') as HTMLDivElement

      initializeShadeRoot({
        injector,
        rootElement,
        jsxElement: <CommandPaletteInput manager={manager} />,
      })

      await sleepAsync(50)

      const component = document.querySelector('shades-command-palette-input') as HTMLElement
      expect(component.hasAttribute('data-opened')).toBe(true)

      manager[Symbol.dispose]()
    })
  })

  it('should animate width when opening', async () => {
    await usingAsync(new Injector(), async (injector) => {
      const manager = createManager()
      manager.isOpened.setValue(false)
      const rootElement = document.getElementById('root') as HTMLDivElement

      initializeShadeRoot({
        injector,
        rootElement,
        jsxElement: <CommandPaletteInput manager={manager} />,
      })

      await sleepAsync(50)
      animateCalls = []

      manager.isOpened.setValue(true)
      await sleepAsync(50)

      const widthAnimation = animateCalls.find(
        (call) =>
          Array.isArray(call.keyframes) &&
          call.keyframes.some((kf: Keyframe) => kf.width === '0%') &&
          call.keyframes.some((kf: Keyframe) => kf.width === '100%'),
      )

      expect(widthAnimation).toBeDefined()
      expect((widthAnimation?.options as KeyframeAnimationOptions)?.duration).toBe(300)

      manager[Symbol.dispose]()
    })
  })

  it('should animate width when closing', async () => {
    await usingAsync(new Injector(), async (injector) => {
      const manager = createManager()
      manager.isOpened.setValue(true)
      const rootElement = document.getElementById('root') as HTMLDivElement

      initializeShadeRoot({
        injector,
        rootElement,
        jsxElement: <CommandPaletteInput manager={manager} />,
      })

      await sleepAsync(50)
      animateCalls = []

      manager.isOpened.setValue(false)
      await sleepAsync(50)

      const widthAnimation = animateCalls.find(
        (call) =>
          Array.isArray(call.keyframes) &&
          call.keyframes.some((kf: Keyframe) => kf.width === '100%') &&
          call.keyframes.some((kf: Keyframe) => kf.width === '0%'),
      )

      expect(widthAnimation).toBeDefined()

      manager[Symbol.dispose]()
    })
  })

  it('should clear input value when opening', async () => {
    await usingAsync(new Injector(), async (injector) => {
      const manager = createManager()
      manager.isOpened.setValue(false)
      const rootElement = document.getElementById('root') as HTMLDivElement

      initializeShadeRoot({
        injector,
        rootElement,
        jsxElement: <CommandPaletteInput manager={manager} />,
      })

      await sleepAsync(50)

      const component = document.querySelector('shades-command-palette-input') as HTMLElement
      const inputElement = component?.querySelector('input') as HTMLInputElement
      inputElement.value = 'some text'

      manager.isOpened.setValue(true)
      await sleepAsync(50)

      expect(inputElement.value).toBe('')

      manager[Symbol.dispose]()
    })
  })

  it('should clear input value when closing', async () => {
    await usingAsync(new Injector(), async (injector) => {
      const manager = createManager()
      manager.isOpened.setValue(true)
      const rootElement = document.getElementById('root') as HTMLDivElement

      initializeShadeRoot({
        injector,
        rootElement,
        jsxElement: <CommandPaletteInput manager={manager} />,
      })

      await sleepAsync(50)

      const component = document.querySelector('shades-command-palette-input') as HTMLElement
      const inputElement = component?.querySelector('input') as HTMLInputElement
      inputElement.value = 'search term'

      manager.isOpened.setValue(false)
      await sleepAsync(50)

      expect(inputElement.value).toBe('')

      manager[Symbol.dispose]()
    })
  })

  it('should have overflow hidden style', async () => {
    await usingAsync(new Injector(), async (injector) => {
      const manager = createManager()
      const rootElement = document.getElementById('root') as HTMLDivElement

      initializeShadeRoot({
        injector,
        rootElement,
        jsxElement: <CommandPaletteInput manager={manager} />,
      })

      await sleepAsync(50)

      const component = document.querySelector('shades-command-palette-input') as HTMLElement
      const computedStyle = window.getComputedStyle(component)
      expect(computedStyle.overflow).toBe('hidden')

      manager[Symbol.dispose]()
    })
  })

  it('should use cubic-bezier easing for animations', async () => {
    await usingAsync(new Injector(), async (injector) => {
      const manager = createManager()
      manager.isOpened.setValue(false)
      const rootElement = document.getElementById('root') as HTMLDivElement

      initializeShadeRoot({
        injector,
        rootElement,
        jsxElement: <CommandPaletteInput manager={manager} />,
      })

      await sleepAsync(50)
      animateCalls = []

      manager.isOpened.setValue(true)
      await sleepAsync(50)

      const widthAnimation = animateCalls.find(
        (call) => Array.isArray(call.keyframes) && call.keyframes.some((kf: Keyframe) => 'width' in kf),
      )

      expect(widthAnimation).toBeDefined()
      expect((widthAnimation?.options as KeyframeAnimationOptions)?.easing).toBe(
        'cubic-bezier(0.595, 0.425, 0.415, 0.845)',
      )

      manager[Symbol.dispose]()
    })
  })

  it('should fill animation forwards', async () => {
    await usingAsync(new Injector(), async (injector) => {
      const manager = createManager()
      manager.isOpened.setValue(false)
      const rootElement = document.getElementById('root') as HTMLDivElement

      initializeShadeRoot({
        injector,
        rootElement,
        jsxElement: <CommandPaletteInput manager={manager} />,
      })

      await sleepAsync(50)
      animateCalls = []

      manager.isOpened.setValue(true)
      await sleepAsync(50)

      const widthAnimation = animateCalls.find(
        (call) => Array.isArray(call.keyframes) && call.keyframes.some((kf: Keyframe) => 'width' in kf),
      )

      expect(widthAnimation).toBeDefined()
      expect((widthAnimation?.options as KeyframeAnimationOptions)?.fill).toBe('forwards')

      manager[Symbol.dispose]()
    })
  })
})
