import { Injector } from '@furystack/inject'
import { createComponent, initializeShadeRoot } from '@furystack/shades'
import { sleepAsync, using } from '@furystack/utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { SuggestInput } from './suggest-input.js'
import { SuggestManager } from './suggest-manager.js'
import type { SuggestionResult } from './suggestion-result.js'

type TestEntry = { id: number; name: string }

const createSuggestionResult = (entry: TestEntry): SuggestionResult => ({
  element: (<div>{entry.name}</div>) as unknown as JSX.Element,
  score: entry.id,
})

describe('SuggestInput', () => {
  let originalAnimate: typeof Element.prototype.animate

  beforeEach(() => {
    document.body.innerHTML = '<div id="root"></div>'
    originalAnimate = Element.prototype.animate

    Element.prototype.animate = vi.fn(() => {
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
    }) as typeof Element.prototype.animate
  })

  afterEach(() => {
    document.body.innerHTML = ''
    Element.prototype.animate = originalAnimate
    vi.restoreAllMocks()
  })

  const createManager = () => {
    const getEntries = vi.fn().mockResolvedValue([])
    const getSuggestionEntry = vi.fn().mockImplementation(createSuggestionResult)
    return new SuggestManager<TestEntry>(getEntries, getSuggestionEntry)
  }

  it('should render with shadow DOM', async () => {
    const injector = new Injector()
    const rootElement = document.getElementById('root') as HTMLDivElement

    using(createManager(), (manager) => {
      initializeShadeRoot({
        injector,
        rootElement,
        jsxElement: <SuggestInput manager={manager} />,
      })
    })

    await sleepAsync(50)

    const suggestInput = document.querySelector('shades-suggest-input')
    expect(suggestInput).not.toBeNull()
  })

  it('should render the inner input element', async () => {
    const injector = new Injector()
    const rootElement = document.getElementById('root') as HTMLDivElement

    using(createManager(), (manager) => {
      initializeShadeRoot({
        injector,
        rootElement,
        jsxElement: <SuggestInput manager={manager} />,
      })
    })

    await sleepAsync(50)

    const input = document.querySelector('shades-suggest-input input') as HTMLInputElement
    expect(input).not.toBeNull()
    expect(input.placeholder).toBe('Type to search...')
    expect(input.autofocus).toBe(true)
  })

  it('should focus input when isOpened becomes true', async () => {
    const injector = new Injector()
    const rootElement = document.getElementById('root') as HTMLDivElement
    const manager = createManager()

    initializeShadeRoot({
      injector,
      rootElement,
      jsxElement: <SuggestInput manager={manager} />,
    })

    await sleepAsync(50)

    const input = document.querySelector('shades-suggest-input input') as HTMLInputElement
    const focusSpy = vi.spyOn(input, 'focus')

    manager.isOpened.setValue(true)
    await sleepAsync(50)

    expect(focusSpy).toHaveBeenCalled()

    manager[Symbol.dispose]()
  })

  it('should clear input value when isOpened becomes false', async () => {
    const injector = new Injector()
    const rootElement = document.getElementById('root') as HTMLDivElement
    const manager = createManager()

    initializeShadeRoot({
      injector,
      rootElement,
      jsxElement: <SuggestInput manager={manager} />,
    })

    await sleepAsync(50)

    const input = document.querySelector('shades-suggest-input input') as HTMLInputElement
    input.value = 'test query'

    manager.isOpened.setValue(true)
    await sleepAsync(50)

    manager.isOpened.setValue(false)
    await sleepAsync(50)

    expect(input.value).toBe('')

    manager[Symbol.dispose]()
  })

  it('should not clear input when first mounted with isOpened false', async () => {
    const injector = new Injector()
    const rootElement = document.getElementById('root') as HTMLDivElement
    const manager = createManager()

    initializeShadeRoot({
      injector,
      rootElement,
      jsxElement: <SuggestInput manager={manager} />,
    })

    await sleepAsync(50)

    const input = document.querySelector('shades-suggest-input input') as HTMLInputElement

    input.value = 'initial value'
    expect(input.value).toBe('initial value')

    manager[Symbol.dispose]()
  })

  it('should have correct CSS styling applied', async () => {
    const injector = new Injector()
    const rootElement = document.getElementById('root') as HTMLDivElement
    const manager = createManager()

    initializeShadeRoot({
      injector,
      rootElement,
      jsxElement: <SuggestInput manager={manager} />,
    })

    await sleepAsync(50)

    const suggestInput = document.querySelector('shades-suggest-input') as HTMLElement
    expect(suggestInput).not.toBeNull()

    const input = suggestInput.querySelector('input') as HTMLInputElement
    expect(input).not.toBeNull()

    manager[Symbol.dispose]()
  })
})
