import { Injector } from '@furystack/inject'
import { createComponent, initializeShadeRoot } from '@furystack/shades'
import { sleepAsync } from '@furystack/utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { CommandPaletteSuggestionList } from './command-palette-suggestion-list.js'
import { CommandPaletteManager } from './command-palette-manager.js'
import type { CommandPaletteSuggestionResult } from './command-provider.js'

describe('CommandPaletteSuggestionList', () => {
  let originalAnimate: typeof Element.prototype.animate
  let animateCalls: Array<{ keyframes: unknown; options: unknown }>

  beforeEach(() => {
    document.body.innerHTML = '<div id="root" style="width: 500px;"></div>'
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

  const createSuggestion = (text: string, score: number): CommandPaletteSuggestionResult => ({
    element: <span>{text}</span>,
    score,
    onSelected: vi.fn(),
  })

  it('should render with shadow DOM', async () => {
    const injector = new Injector()
    const manager = createManager()
    const rootElement = document.getElementById('root') as HTMLDivElement

    initializeShadeRoot({
      injector,
      rootElement,
      jsxElement: <CommandPaletteSuggestionList manager={manager} />,
    })

    await sleepAsync(50)

    const component = document.querySelector('shade-command-palette-suggestion-list')
    expect(component).not.toBeNull()

    manager[Symbol.dispose]()
  })

  it('should render suggestion items container', async () => {
    const injector = new Injector()
    const manager = createManager()
    const rootElement = document.getElementById('root') as HTMLDivElement

    initializeShadeRoot({
      injector,
      rootElement,
      jsxElement: <CommandPaletteSuggestionList manager={manager} />,
    })

    await sleepAsync(50)

    const component = document.querySelector('shade-command-palette-suggestion-list') as HTMLElement
    const container = component?.querySelector('.suggestion-items-container')
    expect(container).not.toBeNull()

    manager[Symbol.dispose]()
  })

  it('should render suggestions from manager', async () => {
    const injector = new Injector()
    const manager = createManager()
    manager.currentSuggestions.setValue([createSuggestion('Command 1', 100), createSuggestion('Command 2', 90)])
    const rootElement = document.getElementById('root') as HTMLDivElement

    initializeShadeRoot({
      injector,
      rootElement,
      jsxElement: <CommandPaletteSuggestionList manager={manager} />,
    })

    await sleepAsync(50)

    const component = document.querySelector('shade-command-palette-suggestion-list') as HTMLElement
    const items = component?.querySelectorAll('.suggestion-item')
    expect(items?.length).toBe(2)

    manager[Symbol.dispose]()
  })

  it('should render suggestion content', async () => {
    const injector = new Injector()
    const manager = createManager()
    manager.currentSuggestions.setValue([createSuggestion('Test Command', 100)])
    const rootElement = document.getElementById('root') as HTMLDivElement

    initializeShadeRoot({
      injector,
      rootElement,
      jsxElement: <CommandPaletteSuggestionList manager={manager} />,
    })

    await sleepAsync(50)

    const component = document.querySelector('shade-command-palette-suggestion-list') as HTMLElement
    const item = component?.querySelector('.suggestion-item')
    expect(item?.textContent).toContain('Test Command')

    manager[Symbol.dispose]()
  })

  it('should mark first item as selected by default', async () => {
    const injector = new Injector()
    const manager = createManager()
    manager.currentSuggestions.setValue([createSuggestion('Command 1', 100), createSuggestion('Command 2', 90)])
    manager.selectedIndex.setValue(0)
    const rootElement = document.getElementById('root') as HTMLDivElement

    initializeShadeRoot({
      injector,
      rootElement,
      jsxElement: <CommandPaletteSuggestionList manager={manager} />,
    })

    await sleepAsync(50)

    const component = document.querySelector('shade-command-palette-suggestion-list') as HTMLElement
    const items = component?.querySelectorAll('.suggestion-item')
    expect(items?.[0]?.classList.contains('selected')).toBe(true)
    expect(items?.[1]?.classList.contains('selected')).toBe(false)

    manager[Symbol.dispose]()
  })

  it('should update selected class when selectedIndex changes', async () => {
    const injector = new Injector()
    const manager = createManager()
    manager.currentSuggestions.setValue([createSuggestion('Command 1', 100), createSuggestion('Command 2', 90)])
    manager.selectedIndex.setValue(0)
    const rootElement = document.getElementById('root') as HTMLDivElement

    initializeShadeRoot({
      injector,
      rootElement,
      jsxElement: <CommandPaletteSuggestionList manager={manager} />,
    })

    await sleepAsync(50)

    manager.selectedIndex.setValue(1)
    await sleepAsync(50)

    const component = document.querySelector('shade-command-palette-suggestion-list') as HTMLElement
    const items = component?.querySelectorAll('.suggestion-item')
    expect(items?.[0]?.classList.contains('selected')).toBe(false)
    expect(items?.[1]?.classList.contains('selected')).toBe(true)

    manager[Symbol.dispose]()
  })

  it('should call selectSuggestion when item is clicked while opened', async () => {
    const injector = new Injector()
    const manager = createManager()
    const suggestion = createSuggestion('Click Me', 100)
    manager.currentSuggestions.setValue([suggestion])
    manager.isOpened.setValue(true)
    const rootElement = document.getElementById('root') as HTMLDivElement

    initializeShadeRoot({
      injector,
      rootElement,
      jsxElement: <CommandPaletteSuggestionList manager={manager} />,
    })

    await sleepAsync(50)

    const selectSpy = vi.spyOn(manager, 'selectSuggestion')

    const component = document.querySelector('shade-command-palette-suggestion-list') as HTMLElement
    const item = component?.querySelector('.suggestion-item') as HTMLElement
    item?.click()

    expect(selectSpy).toHaveBeenCalledWith(injector, 0)

    manager[Symbol.dispose]()
  })

  it('should not call selectSuggestion when item is clicked while closed', async () => {
    const injector = new Injector()
    const manager = createManager()
    const suggestion = createSuggestion('Click Me', 100)
    manager.currentSuggestions.setValue([suggestion])
    manager.isOpened.setValue(false)
    const rootElement = document.getElementById('root') as HTMLDivElement

    initializeShadeRoot({
      injector,
      rootElement,
      jsxElement: <CommandPaletteSuggestionList manager={manager} />,
    })

    await sleepAsync(50)

    const selectSpy = vi.spyOn(manager, 'selectSuggestion')

    const component = document.querySelector('shade-command-palette-suggestion-list') as HTMLElement
    const item = component?.querySelector('.suggestion-item') as HTMLElement
    item?.click()

    expect(selectSpy).not.toHaveBeenCalled()

    manager[Symbol.dispose]()
  })

  it('should animate slide-in when opening', async () => {
    const injector = new Injector()
    const manager = createManager()
    manager.isOpened.setValue(false)
    const rootElement = document.getElementById('root') as HTMLDivElement

    initializeShadeRoot({
      injector,
      rootElement,
      jsxElement: <CommandPaletteSuggestionList manager={manager} />,
    })

    await sleepAsync(50)
    animateCalls = []

    manager.isOpened.setValue(true)
    await sleepAsync(50)

    const slideAnimation = animateCalls.find(
      (call) =>
        Array.isArray(call.keyframes) &&
        call.keyframes.some((kf: Keyframe) => kf.transform === 'translate(0, -50px)') &&
        call.keyframes.some((kf: Keyframe) => kf.transform === 'translate(0, 0)'),
    )

    expect(slideAnimation).toBeDefined()
    expect((slideAnimation?.options as KeyframeAnimationOptions)?.duration).toBe(500)
    expect((slideAnimation?.options as KeyframeAnimationOptions)?.fill).toBe('forwards')

    manager[Symbol.dispose]()
  })

  it('should animate slide-out when closing', async () => {
    const injector = new Injector()
    const manager = createManager()
    manager.isOpened.setValue(true)
    const rootElement = document.getElementById('root') as HTMLDivElement

    initializeShadeRoot({
      injector,
      rootElement,
      jsxElement: <CommandPaletteSuggestionList manager={manager} />,
    })

    await sleepAsync(50)
    animateCalls = []

    manager.isOpened.setValue(false)
    await sleepAsync(50)

    const slideAnimation = animateCalls.find(
      (call) =>
        Array.isArray(call.keyframes) &&
        call.keyframes.some((kf: Keyframe) => kf.transform === 'translate(0, 0)') &&
        call.keyframes.some((kf: Keyframe) => kf.transform === 'translate(0, -50px)'),
    )

    expect(slideAnimation).toBeDefined()
    expect((slideAnimation?.options as KeyframeAnimationOptions)?.duration).toBe(200)

    manager[Symbol.dispose]()
  })

  it('should set container display to initial when opening', async () => {
    const injector = new Injector()
    const manager = createManager()
    manager.isOpened.setValue(false)
    const rootElement = document.getElementById('root') as HTMLDivElement

    initializeShadeRoot({
      injector,
      rootElement,
      jsxElement: <CommandPaletteSuggestionList manager={manager} />,
    })

    await sleepAsync(50)

    manager.isOpened.setValue(true)
    await sleepAsync(50)

    const component = document.querySelector('shade-command-palette-suggestion-list') as HTMLElement
    const container = component?.querySelector('.suggestion-items-container') as HTMLElement
    expect(container?.style.display).toBe('initial')

    manager[Symbol.dispose]()
  })

  it('should set container display to none when closing', async () => {
    const injector = new Injector()
    const manager = createManager()
    manager.isOpened.setValue(true)
    const rootElement = document.getElementById('root') as HTMLDivElement

    initializeShadeRoot({
      injector,
      rootElement,
      jsxElement: <CommandPaletteSuggestionList manager={manager} />,
    })

    await sleepAsync(50)

    manager.isOpened.setValue(false)
    await sleepAsync(50)

    const component = document.querySelector('shade-command-palette-suggestion-list') as HTMLElement
    const container = component?.querySelector('.suggestion-items-container') as HTMLElement
    expect(container?.style.display).toBe('none')

    manager[Symbol.dispose]()
  })

  it('should render empty list when no suggestions', async () => {
    const injector = new Injector()
    const manager = createManager()
    manager.currentSuggestions.setValue([])
    const rootElement = document.getElementById('root') as HTMLDivElement

    initializeShadeRoot({
      injector,
      rootElement,
      jsxElement: <CommandPaletteSuggestionList manager={manager} />,
    })

    await sleepAsync(50)

    const component = document.querySelector('shade-command-palette-suggestion-list') as HTMLElement
    const items = component?.querySelectorAll('.suggestion-item')
    expect(items?.length).toBe(0)

    manager[Symbol.dispose]()
  })

  it('should support fullScreenSuggestions prop', async () => {
    const injector = new Injector()
    const manager = createManager()
    manager.isOpened.setValue(true)
    const rootElement = document.getElementById('root') as HTMLDivElement

    initializeShadeRoot({
      injector,
      rootElement,
      jsxElement: <CommandPaletteSuggestionList manager={manager} fullScreenSuggestions />,
    })

    await sleepAsync(50)

    const component = document.querySelector('shade-command-palette-suggestion-list') as HTMLElement
    const container = component?.querySelector('.suggestion-items-container') as HTMLElement
    expect(container?.style.left).toBe('0px')
    expect(container?.style.width).toBe('calc(100% - 42px)')

    manager[Symbol.dispose]()
  })

  it('should set max height based on window height', async () => {
    const injector = new Injector()
    const manager = createManager()
    manager.isOpened.setValue(true)
    const rootElement = document.getElementById('root') as HTMLDivElement

    initializeShadeRoot({
      injector,
      rootElement,
      jsxElement: <CommandPaletteSuggestionList manager={manager} />,
    })

    await sleepAsync(50)

    const component = document.querySelector('shade-command-palette-suggestion-list') as HTMLElement
    const container = component?.querySelector('.suggestion-items-container') as HTMLElement
    const expectedMaxHeight = `${window.innerHeight * 0.8}px`
    expect(container?.style.maxHeight).toBe(expectedMaxHeight)

    manager[Symbol.dispose]()
  })

  it('should have correct CSS styles for suggestion items container', async () => {
    const injector = new Injector()
    const manager = createManager()
    const rootElement = document.getElementById('root') as HTMLDivElement

    initializeShadeRoot({
      injector,
      rootElement,
      jsxElement: <CommandPaletteSuggestionList manager={manager} />,
    })

    await sleepAsync(50)

    const component = document.querySelector('shade-command-palette-suggestion-list') as HTMLElement
    const container = component?.querySelector('.suggestion-items-container') as HTMLElement
    const computedStyle = window.getComputedStyle(container)

    expect(computedStyle.position).toBe('absolute')
    expect(computedStyle.overflow).toBe('hidden')
    expect(computedStyle.zIndex).toBe('1')

    manager[Symbol.dispose]()
  })

  it('should call selectSuggestion with correct index for second item', async () => {
    const injector = new Injector()
    const manager = createManager()
    manager.currentSuggestions.setValue([
      createSuggestion('First', 100),
      createSuggestion('Second', 90),
      createSuggestion('Third', 80),
    ])
    manager.isOpened.setValue(true)
    const rootElement = document.getElementById('root') as HTMLDivElement

    initializeShadeRoot({
      injector,
      rootElement,
      jsxElement: <CommandPaletteSuggestionList manager={manager} />,
    })

    await sleepAsync(50)

    const selectSpy = vi.spyOn(manager, 'selectSuggestion')

    const component = document.querySelector('shade-command-palette-suggestion-list') as HTMLElement
    const items = component?.querySelectorAll('.suggestion-item')
    ;(items[1] as HTMLElement)?.click()

    expect(selectSpy).toHaveBeenCalledWith(injector, 1)

    manager[Symbol.dispose]()
  })

  it('should update container z-index when opening and closing', async () => {
    const injector = new Injector()
    const manager = createManager()
    manager.isOpened.setValue(false)
    const rootElement = document.getElementById('root') as HTMLDivElement

    initializeShadeRoot({
      injector,
      rootElement,
      jsxElement: <CommandPaletteSuggestionList manager={manager} />,
    })

    await sleepAsync(50)

    manager.isOpened.setValue(true)
    await sleepAsync(50)

    const component = document.querySelector('shade-command-palette-suggestion-list') as HTMLElement
    const container = component?.querySelector('.suggestion-items-container') as HTMLElement
    expect(container?.style.zIndex).toBe('1')

    manager.isOpened.setValue(false)
    await sleepAsync(50)

    expect(container?.style.zIndex).toBe('-1')

    manager[Symbol.dispose]()
  })
})
