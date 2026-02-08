import { Injector } from '@furystack/inject'
import { createComponent, flushUpdates, initializeShadeRoot } from '@furystack/shades'
import { usingAsync } from '@furystack/utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { SuggestManager } from './suggest-manager.js'
import { SuggestionList } from './suggestion-list.js'
import type { SuggestionResult } from './suggestion-result.js'

type TestEntry = { id: number; name: string }

const createTestEntries = (): TestEntry[] => [
  { id: 1, name: 'alpha' },
  { id: 2, name: 'beta' },
  { id: 3, name: 'gamma' },
]

const createSuggestionResult = (entry: TestEntry): SuggestionResult => ({
  element: (<span>{entry.name}</span>) as unknown as JSX.Element,
  score: entry.id,
})

describe('SuggestionList', () => {
  let originalAnimate: typeof Element.prototype.animate

  beforeEach(() => {
    document.body.innerHTML = '<div id="root"></div>'
    vi.useFakeTimers()
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
    vi.useRealTimers()
    vi.restoreAllMocks()
  })

  const createManager = () => {
    const getEntries = vi.fn().mockResolvedValue(createTestEntries())
    const getSuggestionEntry = vi.fn().mockImplementation(createSuggestionResult)
    return new SuggestManager<TestEntry>(getEntries, getSuggestionEntry)
  }

  it('should render with shadow DOM', async () => {
    await usingAsync(new Injector(), async (injector) => {
      const rootElement = document.getElementById('root') as HTMLDivElement
      const manager = createManager()

      initializeShadeRoot({
        injector,
        rootElement,
        jsxElement: <SuggestionList manager={manager} />,
      })

      await flushUpdates()
      await vi.advanceTimersByTimeAsync(50)

      const suggestionList = document.querySelector('shade-suggest-suggestion-list')
      expect(suggestionList).not.toBeNull()

      manager[Symbol.dispose]()
    })
  })

  it('should render the suggestions container', async () => {
    await usingAsync(new Injector(), async (injector) => {
      const rootElement = document.getElementById('root') as HTMLDivElement
      const manager = createManager()

      initializeShadeRoot({
        injector,
        rootElement,
        jsxElement: <SuggestionList manager={manager} />,
      })

      await flushUpdates()
      await vi.advanceTimersByTimeAsync(50)

      const container = document.querySelector('.suggestion-items-container')
      expect(container).not.toBeNull()

      manager[Symbol.dispose]()
    })
  })

  it('should render suggestion items when suggestions are present', async () => {
    await usingAsync(new Injector(), async (injector) => {
      const rootElement = document.getElementById('root') as HTMLDivElement
      const manager = createManager()

      initializeShadeRoot({
        injector,
        rootElement,
        jsxElement: <SuggestionList manager={manager} />,
      })

      await flushUpdates()
      await vi.advanceTimersByTimeAsync(50)

      void manager.getSuggestion({ injector, term: 'test' })
      await vi.advanceTimersByTimeAsync(250)
      await vi.advanceTimersByTimeAsync(50)

      const suggestionItems = document.querySelectorAll('.suggestion-item')
      expect(suggestionItems.length).toBe(3)

      expect(suggestionItems[0].textContent).toContain('alpha')
      expect(suggestionItems[1].textContent).toContain('beta')
      expect(suggestionItems[2].textContent).toContain('gamma')

      manager[Symbol.dispose]()
    })
  })

  it('should apply selected class to the correct suggestion item', async () => {
    await usingAsync(new Injector(), async (injector) => {
      const rootElement = document.getElementById('root') as HTMLDivElement
      const manager = createManager()

      initializeShadeRoot({
        injector,
        rootElement,
        jsxElement: <SuggestionList manager={manager} />,
      })

      await flushUpdates()
      await vi.advanceTimersByTimeAsync(50)

      void manager.getSuggestion({ injector, term: 'test' })
      await vi.advanceTimersByTimeAsync(250)
      await vi.advanceTimersByTimeAsync(50)

      const suggestionItems = document.querySelectorAll('.suggestion-item')
      expect(suggestionItems[0].classList.contains('selected')).toBe(true)
      expect(suggestionItems[1].classList.contains('selected')).toBe(false)
      expect(suggestionItems[2].classList.contains('selected')).toBe(false)

      manager[Symbol.dispose]()
    })
  })

  it('should update selected class when selectedIndex changes', async () => {
    await usingAsync(new Injector(), async (injector) => {
      const rootElement = document.getElementById('root') as HTMLDivElement
      const manager = createManager()

      initializeShadeRoot({
        injector,
        rootElement,
        jsxElement: <SuggestionList manager={manager} />,
      })

      await flushUpdates()
      await vi.advanceTimersByTimeAsync(50)

      void manager.getSuggestion({ injector, term: 'test' })
      await vi.advanceTimersByTimeAsync(250)
      await vi.advanceTimersByTimeAsync(50)

      manager.selectedIndex.setValue(1)
      await vi.advanceTimersByTimeAsync(50)

      const suggestionItems = document.querySelectorAll('.suggestion-item')
      expect(suggestionItems[0].classList.contains('selected')).toBe(false)
      expect(suggestionItems[1].classList.contains('selected')).toBe(true)
      expect(suggestionItems[2].classList.contains('selected')).toBe(false)

      manager.selectedIndex.setValue(2)
      await vi.advanceTimersByTimeAsync(50)

      expect(suggestionItems[0].classList.contains('selected')).toBe(false)
      expect(suggestionItems[1].classList.contains('selected')).toBe(false)
      expect(suggestionItems[2].classList.contains('selected')).toBe(true)

      manager[Symbol.dispose]()
    })
  })

  it('should call selectSuggestion when a suggestion item is clicked', async () => {
    await usingAsync(new Injector(), async (injector) => {
      const rootElement = document.getElementById('root') as HTMLDivElement
      const manager = createManager()
      const selectSpy = vi.spyOn(manager, 'selectSuggestion')

      initializeShadeRoot({
        injector,
        rootElement,
        jsxElement: <SuggestionList manager={manager} />,
      })

      await flushUpdates()
      await vi.advanceTimersByTimeAsync(50)

      void manager.getSuggestion({ injector, term: 'test' })
      await vi.advanceTimersByTimeAsync(250)
      await vi.advanceTimersByTimeAsync(50)

      manager.isOpened.setValue(true)
      await vi.advanceTimersByTimeAsync(50)

      const suggestionItems = document.querySelectorAll('.suggestion-item')
      ;(suggestionItems[1] as HTMLElement).click()

      expect(selectSpy).toHaveBeenCalledWith(1)

      manager[Symbol.dispose]()
    })
  })

  it('should not call selectSuggestion when list is not opened', async () => {
    await usingAsync(new Injector(), async (injector) => {
      const rootElement = document.getElementById('root') as HTMLDivElement
      const manager = createManager()

      initializeShadeRoot({
        injector,
        rootElement,
        jsxElement: <SuggestionList manager={manager} />,
      })

      await flushUpdates()
      await vi.advanceTimersByTimeAsync(50)

      manager.currentSuggestions.setValue([
        { entry: { id: 1, name: 'alpha' }, suggestion: createSuggestionResult({ id: 1, name: 'alpha' }) },
        { entry: { id: 2, name: 'beta' }, suggestion: createSuggestionResult({ id: 2, name: 'beta' }) },
      ])
      await vi.advanceTimersByTimeAsync(50)

      const selectSpy = vi.spyOn(manager, 'selectSuggestion')

      const suggestionItems = document.querySelectorAll('.suggestion-item')
      ;(suggestionItems[1] as HTMLElement).click()

      expect(selectSpy).not.toHaveBeenCalled()

      manager[Symbol.dispose]()
    })
  })

  it('should render empty container when no suggestions', async () => {
    await usingAsync(new Injector(), async (injector) => {
      const rootElement = document.getElementById('root') as HTMLDivElement

      const getEntries = vi.fn().mockResolvedValue([])
      const getSuggestionEntry = vi.fn().mockImplementation(createSuggestionResult)
      const manager = new SuggestManager<TestEntry>(getEntries, getSuggestionEntry)

      initializeShadeRoot({
        injector,
        rootElement,
        jsxElement: <SuggestionList manager={manager} />,
      })

      await flushUpdates()
      await vi.advanceTimersByTimeAsync(50)

      const suggestionItems = document.querySelectorAll('.suggestion-item')
      expect(suggestionItems.length).toBe(0)

      manager[Symbol.dispose]()
    })
  })

  describe('animations', () => {
    it('should animate container when isOpened changes to true', async () => {
      await usingAsync(new Injector(), async (injector) => {
        const rootElement = document.getElementById('root') as HTMLDivElement
        const manager = createManager()

        initializeShadeRoot({
          injector,
          rootElement,
          jsxElement: <SuggestionList manager={manager} />,
        })

        await vi.advanceTimersByTimeAsync(50)

        const container = document.querySelector('.suggestion-items-container') as HTMLDivElement

        manager.isOpened.setValue(true)
        await vi.advanceTimersByTimeAsync(50)

        expect(container.style.zIndex).toBe('1')

        manager[Symbol.dispose]()
      })
    })

    it('should animate container when isOpened changes to false', async () => {
      await usingAsync(new Injector(), async (injector) => {
        const rootElement = document.getElementById('root') as HTMLDivElement
        const manager = createManager()

        initializeShadeRoot({
          injector,
          rootElement,
          jsxElement: <SuggestionList manager={manager} />,
        })

        await vi.advanceTimersByTimeAsync(50)

        manager.isOpened.setValue(true)
        await vi.advanceTimersByTimeAsync(50)

        const container = document.querySelector('.suggestion-items-container') as HTMLDivElement

        manager.isOpened.setValue(false)
        await vi.advanceTimersByTimeAsync(50)

        expect(container.style.zIndex).toBe('-1')

        manager[Symbol.dispose]()
      })
    })
  })

  describe('container width', () => {
    it('should set container width based on parent element', async () => {
      await usingAsync(new Injector(), async (injector) => {
        const rootElement = document.getElementById('root') as HTMLDivElement
        rootElement.style.width = '400px'

        const manager = createManager()

        initializeShadeRoot({
          injector,
          rootElement,
          jsxElement: <SuggestionList manager={manager} />,
        })

        await vi.advanceTimersByTimeAsync(50)

        const container = document.querySelector('.suggestion-items-container') as HTMLDivElement
        expect(container.style.width).toBeDefined()

        manager[Symbol.dispose]()
      })
    })
  })
})
