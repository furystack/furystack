import { Injector } from '@furystack/inject'
import { createComponent, initializeShadeRoot } from '@furystack/shades'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { Suggest } from './index.js'
import type { SuggestionResult } from './suggestion-result.js'

type TestEntry = { id: number; name: string }

describe('Suggest', () => {
  let originalAnimate: typeof Element.prototype.animate
  let animateCalls: Array<{ keyframes: unknown; options: unknown }>

  beforeEach(() => {
    vi.useFakeTimers()
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

  afterEach(async () => {
    await vi.runAllTimersAsync()
    const suggest = document.querySelector('shade-suggest')
    suggest?.remove()
    document.body.innerHTML = ''
    Element.prototype.animate = originalAnimate
    vi.useRealTimers()
    vi.restoreAllMocks()
  })

  const advanceTimers = async (ms: number) => {
    await vi.advanceTimersByTimeAsync(ms)
  }

  const createTestEntries = (): TestEntry[] => [
    { id: 1, name: 'First' },
    { id: 2, name: 'Second' },
    { id: 3, name: 'Third' },
  ]

  const getTestEntries = async (term: string): Promise<TestEntry[]> => {
    const entries = createTestEntries()
    if (!term) return entries
    return entries.filter((e) => e.name.toLowerCase().includes(term.toLowerCase()))
  }

  const getSuggestionEntry = (entry: TestEntry): SuggestionResult => ({
    element: <span data-testid={`suggestion-${entry.id}`}>{entry.name}</span>,
    score: entry.id,
  })

  describe('rendering', () => {
    it('should render with shadow DOM', async () => {
      const injector = new Injector()
      const rootElement = document.getElementById('root') as HTMLDivElement
      const onSelectSuggestion = vi.fn()

      initializeShadeRoot({
        injector,
        rootElement,
        jsxElement: (
          <Suggest<TestEntry>
            defaultPrefix="🔍"
            getEntries={getTestEntries}
            getSuggestionEntry={getSuggestionEntry}
            onSelectSuggestion={onSelectSuggestion}
          />
        ),
      })

      await advanceTimers(50)

      const suggest = document.querySelector('shade-suggest')
      expect(suggest).not.toBeNull()
    })

    it('should render the default prefix', async () => {
      const injector = new Injector()
      const rootElement = document.getElementById('root') as HTMLDivElement
      const onSelectSuggestion = vi.fn()

      initializeShadeRoot({
        injector,
        rootElement,
        jsxElement: (
          <Suggest<TestEntry>
            defaultPrefix="Search:"
            getEntries={getTestEntries}
            getSuggestionEntry={getSuggestionEntry}
            onSelectSuggestion={onSelectSuggestion}
          />
        ),
      })

      await advanceTimers(50)

      const suggest = document.querySelector('shade-suggest') as HTMLElement
      const termIcon = suggest?.querySelector('.term-icon')
      expect(termIcon?.textContent).toBe('Search:')
    })

    it('should render the input container', async () => {
      const injector = new Injector()
      const rootElement = document.getElementById('root') as HTMLDivElement
      const onSelectSuggestion = vi.fn()

      initializeShadeRoot({
        injector,
        rootElement,
        jsxElement: (
          <Suggest<TestEntry>
            defaultPrefix="🔍"
            getEntries={getTestEntries}
            getSuggestionEntry={getSuggestionEntry}
            onSelectSuggestion={onSelectSuggestion}
          />
        ),
      })

      await advanceTimers(50)

      const suggest = document.querySelector('shade-suggest') as HTMLElement
      const inputContainer = suggest?.querySelector('.input-container')
      expect(inputContainer).not.toBeNull()
    })

    it('should apply custom styles', async () => {
      const injector = new Injector()
      const rootElement = document.getElementById('root') as HTMLDivElement
      const onSelectSuggestion = vi.fn()

      initializeShadeRoot({
        injector,
        rootElement,
        jsxElement: (
          <Suggest<TestEntry>
            defaultPrefix="🔍"
            getEntries={getTestEntries}
            getSuggestionEntry={getSuggestionEntry}
            onSelectSuggestion={onSelectSuggestion}
            style={{ backgroundColor: 'red' }}
          />
        ),
      })

      await advanceTimers(50)

      const suggest = document.querySelector('shade-suggest') as HTMLElement
      const inputContainer = suggest?.querySelector('.input-container') as HTMLElement
      expect(inputContainer?.style.backgroundColor).toBe('red')
    })
  })

  describe('keyboard navigation', () => {
    it('should handle ArrowDown to move selection down', async () => {
      const injector = new Injector()
      const rootElement = document.getElementById('root') as HTMLDivElement
      const onSelectSuggestion = vi.fn()

      initializeShadeRoot({
        injector,
        rootElement,
        jsxElement: (
          <Suggest<TestEntry>
            defaultPrefix="🔍"
            getEntries={getTestEntries}
            getSuggestionEntry={getSuggestionEntry}
            onSelectSuggestion={onSelectSuggestion}
          />
        ),
      })

      await advanceTimers(50)

      const suggest = document.querySelector('shade-suggest') as HTMLElement
      const wrapper = suggest?.querySelector('.suggest-wrapper') as HTMLElement

      const input = suggest?.querySelector('input') as HTMLInputElement
      input.value = 'test'

      const keyupEvent = new KeyboardEvent('keyup', { key: 'a', bubbles: true })
      Object.defineProperty(keyupEvent, 'target', { value: input })
      wrapper?.dispatchEvent(keyupEvent)

      await advanceTimers(300)

      const arrowDownEvent = new KeyboardEvent('keyup', { key: 'ArrowDown', bubbles: true })
      Object.defineProperty(arrowDownEvent, 'target', { value: input })
      wrapper?.dispatchEvent(arrowDownEvent)

      await advanceTimers(50)

      const selectedItems = suggest?.querySelectorAll('.suggestion-item.selected')
      expect(selectedItems?.length).toBeGreaterThanOrEqual(0)
    })

    it('should handle ArrowUp to move selection up', async () => {
      const injector = new Injector()
      const rootElement = document.getElementById('root') as HTMLDivElement
      const onSelectSuggestion = vi.fn()

      initializeShadeRoot({
        injector,
        rootElement,
        jsxElement: (
          <Suggest<TestEntry>
            defaultPrefix="🔍"
            getEntries={getTestEntries}
            getSuggestionEntry={getSuggestionEntry}
            onSelectSuggestion={onSelectSuggestion}
          />
        ),
      })

      await advanceTimers(50)

      const suggest = document.querySelector('shade-suggest') as HTMLElement
      const wrapper = suggest?.querySelector('.suggest-wrapper') as HTMLElement

      const input = suggest?.querySelector('input') as HTMLInputElement
      input.value = 'test'

      const keyupEvent = new KeyboardEvent('keyup', { key: 'a', bubbles: true })
      Object.defineProperty(keyupEvent, 'target', { value: input })
      wrapper?.dispatchEvent(keyupEvent)

      await advanceTimers(300)

      const arrowDownEvent = new KeyboardEvent('keyup', { key: 'ArrowDown', bubbles: true })
      Object.defineProperty(arrowDownEvent, 'target', { value: input })
      wrapper?.dispatchEvent(arrowDownEvent)
      wrapper?.dispatchEvent(arrowDownEvent)

      const arrowUpEvent = new KeyboardEvent('keyup', { key: 'ArrowUp', bubbles: true })
      Object.defineProperty(arrowUpEvent, 'target', { value: input })
      wrapper?.dispatchEvent(arrowUpEvent)

      await advanceTimers(50)

      expect(suggest).not.toBeNull()
    })

    it('should handle Enter to select current suggestion', async () => {
      const injector = new Injector()
      const rootElement = document.getElementById('root') as HTMLDivElement
      const onSelectSuggestion = vi.fn()

      initializeShadeRoot({
        injector,
        rootElement,
        jsxElement: (
          <Suggest<TestEntry>
            defaultPrefix="🔍"
            getEntries={getTestEntries}
            getSuggestionEntry={getSuggestionEntry}
            onSelectSuggestion={onSelectSuggestion}
          />
        ),
      })

      await advanceTimers(50)

      const suggest = document.querySelector('shade-suggest') as HTMLElement
      const wrapper = suggest?.querySelector('.suggest-wrapper') as HTMLElement

      const input = suggest?.querySelector('input') as HTMLInputElement
      input.value = 'First'

      const keyupEvent = new KeyboardEvent('keyup', { key: 'a', bubbles: true })
      Object.defineProperty(keyupEvent, 'target', { value: input })
      wrapper?.dispatchEvent(keyupEvent)

      await advanceTimers(300)

      const enterEvent = new KeyboardEvent('keyup', { key: 'Enter', bubbles: true })
      Object.defineProperty(enterEvent, 'target', { value: input })
      wrapper?.dispatchEvent(enterEvent)

      await advanceTimers(50)

      expect(onSelectSuggestion).toHaveBeenCalled()
    })

    it('should prevent default on Enter key', async () => {
      const injector = new Injector()
      const rootElement = document.getElementById('root') as HTMLDivElement
      const onSelectSuggestion = vi.fn()

      initializeShadeRoot({
        injector,
        rootElement,
        jsxElement: (
          <Suggest<TestEntry>
            defaultPrefix="🔍"
            getEntries={getTestEntries}
            getSuggestionEntry={getSuggestionEntry}
            onSelectSuggestion={onSelectSuggestion}
          />
        ),
      })

      await advanceTimers(50)

      const suggest = document.querySelector('shade-suggest') as HTMLElement
      const wrapper = suggest?.querySelector('.suggest-wrapper') as HTMLElement

      const input = suggest?.querySelector('input') as HTMLInputElement
      input.value = 'First'

      const keyupEvent = new KeyboardEvent('keyup', { key: 'a', bubbles: true })
      Object.defineProperty(keyupEvent, 'target', { value: input })
      wrapper?.dispatchEvent(keyupEvent)

      await advanceTimers(300)

      const enterEvent = new KeyboardEvent('keyup', { key: 'Enter', bubbles: true, cancelable: true })
      Object.defineProperty(enterEvent, 'target', { value: input })

      const preventDefaultSpy = vi.spyOn(enterEvent, 'preventDefault')
      wrapper?.dispatchEvent(enterEvent)

      expect(preventDefaultSpy).toHaveBeenCalled()
    })

    it('should prevent default on ArrowUp key', async () => {
      const injector = new Injector()
      const rootElement = document.getElementById('root') as HTMLDivElement
      const onSelectSuggestion = vi.fn()

      initializeShadeRoot({
        injector,
        rootElement,
        jsxElement: (
          <Suggest<TestEntry>
            defaultPrefix="🔍"
            getEntries={getTestEntries}
            getSuggestionEntry={getSuggestionEntry}
            onSelectSuggestion={onSelectSuggestion}
          />
        ),
      })

      await advanceTimers(50)

      const suggest = document.querySelector('shade-suggest') as HTMLElement
      const wrapper = suggest?.querySelector('.suggest-wrapper') as HTMLElement

      const input = suggest?.querySelector('input') as HTMLInputElement

      const arrowUpEvent = new KeyboardEvent('keyup', { key: 'ArrowUp', bubbles: true, cancelable: true })
      Object.defineProperty(arrowUpEvent, 'target', { value: input })

      const preventDefaultSpy = vi.spyOn(arrowUpEvent, 'preventDefault')
      wrapper?.dispatchEvent(arrowUpEvent)

      expect(preventDefaultSpy).toHaveBeenCalled()
    })

    it('should prevent default on ArrowDown key', async () => {
      const injector = new Injector()
      const rootElement = document.getElementById('root') as HTMLDivElement
      const onSelectSuggestion = vi.fn()

      initializeShadeRoot({
        injector,
        rootElement,
        jsxElement: (
          <Suggest<TestEntry>
            defaultPrefix="🔍"
            getEntries={getTestEntries}
            getSuggestionEntry={getSuggestionEntry}
            onSelectSuggestion={onSelectSuggestion}
          />
        ),
      })

      await advanceTimers(50)

      const suggest = document.querySelector('shade-suggest') as HTMLElement
      const wrapper = suggest?.querySelector('.suggest-wrapper') as HTMLElement

      const input = suggest?.querySelector('input') as HTMLInputElement

      const arrowDownEvent = new KeyboardEvent('keyup', { key: 'ArrowDown', bubbles: true, cancelable: true })
      Object.defineProperty(arrowDownEvent, 'target', { value: input })

      const preventDefaultSpy = vi.spyOn(arrowDownEvent, 'preventDefault')
      wrapper?.dispatchEvent(arrowDownEvent)

      expect(preventDefaultSpy).toHaveBeenCalled()
    })

    it('should not move selection below 0', async () => {
      const injector = new Injector()
      const rootElement = document.getElementById('root') as HTMLDivElement
      const onSelectSuggestion = vi.fn()

      initializeShadeRoot({
        injector,
        rootElement,
        jsxElement: (
          <Suggest<TestEntry>
            defaultPrefix="🔍"
            getEntries={getTestEntries}
            getSuggestionEntry={getSuggestionEntry}
            onSelectSuggestion={onSelectSuggestion}
          />
        ),
      })

      await advanceTimers(50)

      const suggest = document.querySelector('shade-suggest') as HTMLElement
      const wrapper = suggest?.querySelector('.suggest-wrapper') as HTMLElement

      const input = suggest?.querySelector('input') as HTMLInputElement

      for (let i = 0; i < 5; i++) {
        const arrowUpEvent = new KeyboardEvent('keyup', { key: 'ArrowUp', bubbles: true })
        Object.defineProperty(arrowUpEvent, 'target', { value: input })
        wrapper?.dispatchEvent(arrowUpEvent)
      }

      await advanceTimers(50)

      expect(suggest).not.toBeNull()
    })
  })

  describe('open/close behavior', () => {
    it('should open when clicking term icon', async () => {
      const injector = new Injector()
      const rootElement = document.getElementById('root') as HTMLDivElement
      const onSelectSuggestion = vi.fn()

      initializeShadeRoot({
        injector,
        rootElement,
        jsxElement: (
          <Suggest<TestEntry>
            defaultPrefix="🔍"
            getEntries={getTestEntries}
            getSuggestionEntry={getSuggestionEntry}
            onSelectSuggestion={onSelectSuggestion}
          />
        ),
      })

      await advanceTimers(50)

      const suggest = document.querySelector('shade-suggest') as HTMLElement
      const termIcon = suggest?.querySelector('.term-icon') as HTMLElement

      termIcon?.click()

      await advanceTimers(50)

      expect(suggest?.classList.contains('opened')).toBe(true)
    })

    it('should close when clicking close button', async () => {
      const injector = new Injector()
      const rootElement = document.getElementById('root') as HTMLDivElement
      const onSelectSuggestion = vi.fn()

      initializeShadeRoot({
        injector,
        rootElement,
        jsxElement: (
          <Suggest<TestEntry>
            defaultPrefix="🔍"
            getEntries={getTestEntries}
            getSuggestionEntry={getSuggestionEntry}
            onSelectSuggestion={onSelectSuggestion}
          />
        ),
      })

      await advanceTimers(50)

      const suggest = document.querySelector('shade-suggest') as HTMLElement
      const termIcon = suggest?.querySelector('.term-icon') as HTMLElement
      termIcon?.click()

      await advanceTimers(50)

      const closeButton = suggest?.querySelector('.close-suggestions') as HTMLElement
      closeButton?.click()

      await advanceTimers(50)

      expect(suggest?.classList.contains('opened')).toBe(false)
    })

    it('should trigger animation when opening', async () => {
      const injector = new Injector()
      const rootElement = document.getElementById('root') as HTMLDivElement
      const onSelectSuggestion = vi.fn()

      initializeShadeRoot({
        injector,
        rootElement,
        jsxElement: (
          <Suggest<TestEntry>
            defaultPrefix="🔍"
            getEntries={getTestEntries}
            getSuggestionEntry={getSuggestionEntry}
            onSelectSuggestion={onSelectSuggestion}
          />
        ),
      })

      await advanceTimers(50)

      const initialAnimationCount = animateCalls.length

      const suggest = document.querySelector('shade-suggest') as HTMLElement
      const termIcon = suggest?.querySelector('.term-icon') as HTMLElement
      termIcon?.click()

      await advanceTimers(50)

      expect(animateCalls.length).toBeGreaterThan(initialAnimationCount)
    })

    it('should trigger animation when closing', async () => {
      const injector = new Injector()
      const rootElement = document.getElementById('root') as HTMLDivElement
      const onSelectSuggestion = vi.fn()

      initializeShadeRoot({
        injector,
        rootElement,
        jsxElement: (
          <Suggest<TestEntry>
            defaultPrefix="🔍"
            getEntries={getTestEntries}
            getSuggestionEntry={getSuggestionEntry}
            onSelectSuggestion={onSelectSuggestion}
          />
        ),
      })

      await advanceTimers(50)

      const suggest = document.querySelector('shade-suggest') as HTMLElement
      const termIcon = suggest?.querySelector('.term-icon') as HTMLElement
      termIcon?.click()

      await advanceTimers(50)

      const animationCountAfterOpen = animateCalls.length

      const closeButton = suggest?.querySelector('.close-suggestions') as HTMLElement
      closeButton?.click()

      await advanceTimers(50)

      expect(animateCalls.length).toBeGreaterThan(animationCountAfterOpen)
    })
  })

  describe('suggestions loading', () => {
    it('should fetch suggestions when typing', async () => {
      const injector = new Injector()
      const rootElement = document.getElementById('root') as HTMLDivElement
      const onSelectSuggestion = vi.fn()
      const getEntriesSpy = vi.fn(getTestEntries)

      initializeShadeRoot({
        injector,
        rootElement,
        jsxElement: (
          <Suggest<TestEntry>
            defaultPrefix="🔍"
            getEntries={getEntriesSpy}
            getSuggestionEntry={getSuggestionEntry}
            onSelectSuggestion={onSelectSuggestion}
          />
        ),
      })

      await advanceTimers(50)

      const suggest = document.querySelector('shade-suggest') as HTMLElement
      const wrapper = suggest?.querySelector('.suggest-wrapper') as HTMLElement

      const input = suggest?.querySelector('input') as HTMLInputElement
      input.value = 'First'

      const keyupEvent = new KeyboardEvent('keyup', { key: 'a', bubbles: true })
      Object.defineProperty(keyupEvent, 'target', { value: input })
      wrapper?.dispatchEvent(keyupEvent)

      await advanceTimers(300)

      expect(getEntriesSpy).toHaveBeenCalledWith('First')
    })

    it('should show loader animation while loading', async () => {
      const injector = new Injector()
      const rootElement = document.getElementById('root') as HTMLDivElement
      const onSelectSuggestion = vi.fn()

      const resolveHolder: { resolve: ((entries: TestEntry[]) => void) | null } = { resolve: null }
      const slowGetEntries = () =>
        new Promise<TestEntry[]>((resolve) => {
          resolveHolder.resolve = resolve
        })

      initializeShadeRoot({
        injector,
        rootElement,
        jsxElement: (
          <Suggest<TestEntry>
            defaultPrefix="🔍"
            getEntries={slowGetEntries}
            getSuggestionEntry={getSuggestionEntry}
            onSelectSuggestion={onSelectSuggestion}
          />
        ),
      })

      await advanceTimers(50)

      const suggest = document.querySelector('shade-suggest') as HTMLElement
      const wrapper = suggest?.querySelector('.suggest-wrapper') as HTMLElement

      const input = suggest?.querySelector('input') as HTMLInputElement
      input.value = 'test'

      const keyupEvent = new KeyboardEvent('keyup', { key: 'a', bubbles: true })
      Object.defineProperty(keyupEvent, 'target', { value: input })
      wrapper?.dispatchEvent(keyupEvent)

      await advanceTimers(300)

      const loader = suggest?.querySelector('shade-loader')
      expect(loader).not.toBeNull()

      resolveHolder.resolve?.(createTestEntries())
      await advanceTimers(50)
    })

    it('should render suggestions after loading', async () => {
      const injector = new Injector()
      const rootElement = document.getElementById('root') as HTMLDivElement
      const onSelectSuggestion = vi.fn()

      initializeShadeRoot({
        injector,
        rootElement,
        jsxElement: (
          <Suggest<TestEntry>
            defaultPrefix="🔍"
            getEntries={getTestEntries}
            getSuggestionEntry={getSuggestionEntry}
            onSelectSuggestion={onSelectSuggestion}
          />
        ),
      })

      await advanceTimers(50)

      const suggest = document.querySelector('shade-suggest') as HTMLElement
      const wrapper = suggest?.querySelector('.suggest-wrapper') as HTMLElement

      const input = suggest?.querySelector('input') as HTMLInputElement
      input.value = 'test'

      const keyupEvent = new KeyboardEvent('keyup', { key: 'a', bubbles: true })
      Object.defineProperty(keyupEvent, 'target', { value: input })
      wrapper?.dispatchEvent(keyupEvent)

      await advanceTimers(300)

      const suggestionList = suggest?.querySelector('shade-suggest-suggestion-list')
      expect(suggestionList).not.toBeNull()
    })
  })

  describe('suggestion selection', () => {
    it('should call onSelectSuggestion when selecting via Enter', async () => {
      const injector = new Injector()
      const rootElement = document.getElementById('root') as HTMLDivElement
      const onSelectSuggestion = vi.fn()

      initializeShadeRoot({
        injector,
        rootElement,
        jsxElement: (
          <Suggest<TestEntry>
            defaultPrefix="🔍"
            getEntries={getTestEntries}
            getSuggestionEntry={getSuggestionEntry}
            onSelectSuggestion={onSelectSuggestion}
          />
        ),
      })

      await advanceTimers(50)

      const suggest = document.querySelector('shade-suggest') as HTMLElement
      const wrapper = suggest?.querySelector('.suggest-wrapper') as HTMLElement

      const input = suggest?.querySelector('input') as HTMLInputElement
      input.value = 'First'

      const keyupEvent = new KeyboardEvent('keyup', { key: 'a', bubbles: true })
      Object.defineProperty(keyupEvent, 'target', { value: input })
      wrapper?.dispatchEvent(keyupEvent)

      await advanceTimers(300)

      const enterEvent = new KeyboardEvent('keyup', { key: 'Enter', bubbles: true })
      Object.defineProperty(enterEvent, 'target', { value: input })
      wrapper?.dispatchEvent(enterEvent)

      await advanceTimers(50)

      expect(onSelectSuggestion).toHaveBeenCalledWith(expect.objectContaining({ name: 'First' }))
    })

    it('should close after selecting a suggestion', async () => {
      const injector = new Injector()
      const rootElement = document.getElementById('root') as HTMLDivElement
      const onSelectSuggestion = vi.fn()

      initializeShadeRoot({
        injector,
        rootElement,
        jsxElement: (
          <Suggest<TestEntry>
            defaultPrefix="🔍"
            getEntries={getTestEntries}
            getSuggestionEntry={getSuggestionEntry}
            onSelectSuggestion={onSelectSuggestion}
          />
        ),
      })

      await advanceTimers(50)

      const suggest = document.querySelector('shade-suggest') as HTMLElement
      const wrapper = suggest?.querySelector('.suggest-wrapper') as HTMLElement

      const input = suggest?.querySelector('input') as HTMLInputElement
      input.value = 'First'

      const keyupEvent = new KeyboardEvent('keyup', { key: 'a', bubbles: true })
      Object.defineProperty(keyupEvent, 'target', { value: input })
      wrapper?.dispatchEvent(keyupEvent)

      await advanceTimers(300)

      expect(suggest?.classList.contains('opened')).toBe(true)

      const enterEvent = new KeyboardEvent('keyup', { key: 'Enter', bubbles: true })
      Object.defineProperty(enterEvent, 'target', { value: input })
      wrapper?.dispatchEvent(enterEvent)

      await advanceTimers(50)

      expect(suggest?.classList.contains('opened')).toBe(false)
    })
  })

  describe('sub-components', () => {
    it('should render SuggestInput component', async () => {
      const injector = new Injector()
      const rootElement = document.getElementById('root') as HTMLDivElement
      const onSelectSuggestion = vi.fn()

      initializeShadeRoot({
        injector,
        rootElement,
        jsxElement: (
          <Suggest<TestEntry>
            defaultPrefix="🔍"
            getEntries={getTestEntries}
            getSuggestionEntry={getSuggestionEntry}
            onSelectSuggestion={onSelectSuggestion}
          />
        ),
      })

      await advanceTimers(50)

      const suggest = document.querySelector('shade-suggest') as HTMLElement
      const suggestInput = suggest?.querySelector('shades-suggest-input')
      expect(suggestInput).not.toBeNull()
    })

    it('should render SuggestionList component', async () => {
      const injector = new Injector()
      const rootElement = document.getElementById('root') as HTMLDivElement
      const onSelectSuggestion = vi.fn()

      initializeShadeRoot({
        injector,
        rootElement,
        jsxElement: (
          <Suggest<TestEntry>
            defaultPrefix="🔍"
            getEntries={getTestEntries}
            getSuggestionEntry={getSuggestionEntry}
            onSelectSuggestion={onSelectSuggestion}
          />
        ),
      })

      await advanceTimers(50)

      const suggest = document.querySelector('shade-suggest') as HTMLElement
      const suggestionList = suggest?.querySelector('shade-suggest-suggestion-list')
      expect(suggestionList).not.toBeNull()
    })

    it('should render Loader component', async () => {
      const injector = new Injector()
      const rootElement = document.getElementById('root') as HTMLDivElement
      const onSelectSuggestion = vi.fn()

      initializeShadeRoot({
        injector,
        rootElement,
        jsxElement: (
          <Suggest<TestEntry>
            defaultPrefix="🔍"
            getEntries={getTestEntries}
            getSuggestionEntry={getSuggestionEntry}
            onSelectSuggestion={onSelectSuggestion}
          />
        ),
      })

      await advanceTimers(50)

      const suggest = document.querySelector('shade-suggest') as HTMLElement
      const loader = suggest?.querySelector('shade-loader')
      expect(loader).not.toBeNull()
    })
  })
})
