import { Injector } from '@furystack/inject'
import { using, usingAsync } from '@furystack/utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { SuggestionResult } from './suggestion-result.js'
import { SuggestManager } from './suggest-manager.js'

type TestEntry = { id: number; name: string }

const createTestEntries = (): TestEntry[] => [
  { id: 1, name: 'alpha' },
  { id: 2, name: 'beta' },
  { id: 3, name: 'gamma' },
]

const createSuggestionResult = (entry: TestEntry): SuggestionResult => ({
  element: { tagName: 'div', textContent: entry.name } as unknown as JSX.Element,
  score: entry.id,
})

describe('SuggestManager', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe('Construction and disposal', () => {
    it('Should be constructed with getEntries and getSuggestionEntry functions', () => {
      const getEntries = vi.fn().mockResolvedValue([])
      const getSuggestionEntry = vi.fn()

      using(new SuggestManager(getEntries, getSuggestionEntry), (manager) => {
        expect(manager.isOpened.getValue()).toBe(false)
        expect(manager.isLoading.getValue()).toBe(false)
        expect(manager.term.getValue()).toBe('')
        expect(manager.selectedIndex.getValue()).toBe(0)
        expect(manager.currentSuggestions.getValue()).toEqual([])
      })
    })

    it('Should register keyboard and click listeners on construction', () => {
      const addEventListenerSpy = vi.spyOn(window, 'addEventListener')
      const getEntries = vi.fn().mockResolvedValue([])
      const getSuggestionEntry = vi.fn()

      using(new SuggestManager(getEntries, getSuggestionEntry), () => {
        expect(addEventListenerSpy).toHaveBeenCalledWith('keyup', expect.any(Function), true)
        expect(addEventListenerSpy).toHaveBeenCalledWith('click', expect.any(Function), true)
      })

      addEventListenerSpy.mockRestore()
    })

    it('Should dispose all observables and remove event listeners', () => {
      const removeEventListenerSpy = vi.spyOn(window, 'removeEventListener')
      const getEntries = vi.fn().mockResolvedValue([])
      const getSuggestionEntry = vi.fn()

      const manager = new SuggestManager(getEntries, getSuggestionEntry)

      const isOpenedDisposeSpy = vi.spyOn(manager.isOpened, Symbol.dispose)
      const isLoadingDisposeSpy = vi.spyOn(manager.isLoading, Symbol.dispose)
      const termDisposeSpy = vi.spyOn(manager.term, Symbol.dispose)
      const selectedIndexDisposeSpy = vi.spyOn(manager.selectedIndex, Symbol.dispose)
      const currentSuggestionsDisposeSpy = vi.spyOn(manager.currentSuggestions, Symbol.dispose)

      manager[Symbol.dispose]()

      expect(isOpenedDisposeSpy).toHaveBeenCalled()
      expect(isLoadingDisposeSpy).toHaveBeenCalled()
      expect(termDisposeSpy).toHaveBeenCalled()
      expect(selectedIndexDisposeSpy).toHaveBeenCalled()
      expect(currentSuggestionsDisposeSpy).toHaveBeenCalled()

      expect(removeEventListenerSpy).toHaveBeenCalledWith('keyup', manager.keyPressListener, true)
      expect(removeEventListenerSpy).toHaveBeenCalledWith('click', manager.clickOutsideListener, true)

      removeEventListenerSpy.mockRestore()
    })
  })

  describe('Keyboard listener', () => {
    it('Should close suggestions when Escape is pressed', () => {
      const getEntries = vi.fn().mockResolvedValue([])
      const getSuggestionEntry = vi.fn()

      using(new SuggestManager(getEntries, getSuggestionEntry), (manager) => {
        manager.isOpened.setValue(true)
        expect(manager.isOpened.getValue()).toBe(true)

        manager.keyPressListener({ key: 'Escape' } as KeyboardEvent)

        expect(manager.isOpened.getValue()).toBe(false)
      })
    })

    it('Should not close suggestions for other keys', () => {
      const getEntries = vi.fn().mockResolvedValue([])
      const getSuggestionEntry = vi.fn()

      using(new SuggestManager(getEntries, getSuggestionEntry), (manager) => {
        manager.isOpened.setValue(true)

        manager.keyPressListener({ key: 'Enter' } as KeyboardEvent)
        expect(manager.isOpened.getValue()).toBe(true)

        manager.keyPressListener({ key: 'ArrowDown' } as KeyboardEvent)
        expect(manager.isOpened.getValue()).toBe(true)
      })
    })
  })

  describe('Click-outside listener', () => {
    it('Should close suggestions when clicking outside the element', () => {
      const getEntries = vi.fn().mockResolvedValue([])
      const getSuggestionEntry = vi.fn()

      using(new SuggestManager(getEntries, getSuggestionEntry), (manager) => {
        const element = document.createElement('div')
        element.setAttribute('data-testid', 'suggest')
        document.body.appendChild(element)

        manager.element = element
        manager.isOpened.setValue(true)

        const outsideElement = document.createElement('span')
        document.body.appendChild(outsideElement)

        manager.clickOutsideListener({ target: outsideElement } as unknown as MouseEvent)

        expect(manager.isOpened.getValue()).toBe(false)

        document.body.removeChild(element)
        document.body.removeChild(outsideElement)
      })
    })

    it('Should not close suggestions when clicking inside the element', () => {
      const getEntries = vi.fn().mockResolvedValue([])
      const getSuggestionEntry = vi.fn()

      using(new SuggestManager(getEntries, getSuggestionEntry), (manager) => {
        const element = document.createElement('div')
        const childElement = document.createElement('span')
        element.appendChild(childElement)
        document.body.appendChild(element)

        manager.element = element
        manager.isOpened.setValue(true)

        manager.clickOutsideListener({ target: childElement } as unknown as MouseEvent)

        expect(manager.isOpened.getValue()).toBe(true)

        document.body.removeChild(element)
      })
    })

    it('Should not close when element is not set', () => {
      const getEntries = vi.fn().mockResolvedValue([])
      const getSuggestionEntry = vi.fn()

      using(new SuggestManager(getEntries, getSuggestionEntry), (manager) => {
        manager.isOpened.setValue(true)

        const outsideElement = document.createElement('span')
        manager.clickOutsideListener({ target: outsideElement } as unknown as MouseEvent)

        expect(manager.isOpened.getValue()).toBe(true)
      })
    })

    it('Should not close when already closed', () => {
      const getEntries = vi.fn().mockResolvedValue([])
      const getSuggestionEntry = vi.fn()

      using(new SuggestManager(getEntries, getSuggestionEntry), (manager) => {
        const element = document.createElement('div')
        document.body.appendChild(element)
        manager.element = element
        manager.isOpened.setValue(false)

        const outsideElement = document.createElement('span')
        document.body.appendChild(outsideElement)

        manager.clickOutsideListener({ target: outsideElement } as unknown as MouseEvent)

        expect(manager.isOpened.getValue()).toBe(false)

        document.body.removeChild(element)
        document.body.removeChild(outsideElement)
      })
    })
  })

  describe('getSuggestion (debounced search)', () => {
    it('Should load suggestions after debounce delay', async () => {
      const testEntries = createTestEntries()
      const getEntries = vi.fn().mockResolvedValue(testEntries)
      const getSuggestionEntry = vi.fn().mockImplementation(createSuggestionResult)
      const injector = new Injector()

      await usingAsync(new SuggestManager(getEntries, getSuggestionEntry), async (manager) => {
        void manager.getSuggestion({ injector, term: 'test' })

        expect(getEntries).not.toHaveBeenCalled()
        expect(manager.isLoading.getValue()).toBe(false)

        await vi.advanceTimersByTimeAsync(250)

        expect(getEntries).toHaveBeenCalledWith('test')
        expect(manager.isOpened.getValue()).toBe(true)
        expect(manager.currentSuggestions.getValue()).toHaveLength(3)
      })
    })

    it('Should set isLoading while fetching', async () => {
      const testEntries = createTestEntries()
      let resolveEntries: (value: TestEntry[]) => void
      const entriesPromise = new Promise<TestEntry[]>((resolve) => {
        resolveEntries = resolve
      })
      const getEntries = vi.fn().mockReturnValue(entriesPromise)
      const getSuggestionEntry = vi.fn().mockImplementation(createSuggestionResult)
      const injector = new Injector()

      await usingAsync(new SuggestManager(getEntries, getSuggestionEntry), async (manager) => {
        void manager.getSuggestion({ injector, term: 'test' })
        await vi.advanceTimersByTimeAsync(250)

        expect(manager.isLoading.getValue()).toBe(true)

        resolveEntries!(testEntries)
        await vi.advanceTimersByTimeAsync(0)

        expect(manager.isLoading.getValue()).toBe(false)
      })
    })

    it('Should debounce multiple rapid calls', async () => {
      const testEntries = createTestEntries()
      const getEntries = vi.fn().mockResolvedValue(testEntries)
      const getSuggestionEntry = vi.fn().mockImplementation(createSuggestionResult)
      const injector = new Injector()

      await usingAsync(new SuggestManager(getEntries, getSuggestionEntry), async (manager) => {
        void manager.getSuggestion({ injector, term: 'a' })
        await vi.advanceTimersByTimeAsync(100)

        void manager.getSuggestion({ injector, term: 'ab' })
        await vi.advanceTimersByTimeAsync(100)

        void manager.getSuggestion({ injector, term: 'abc' })
        await vi.advanceTimersByTimeAsync(250)

        expect(getEntries).toHaveBeenCalledTimes(1)
        expect(getEntries).toHaveBeenCalledWith('abc')
      })
    })

    it('Should not fetch again if term is unchanged', async () => {
      const testEntries = createTestEntries()
      const getEntries = vi.fn().mockResolvedValue(testEntries)
      const getSuggestionEntry = vi.fn().mockImplementation(createSuggestionResult)
      const injector = new Injector()

      await usingAsync(new SuggestManager(getEntries, getSuggestionEntry), async (manager) => {
        void manager.getSuggestion({ injector, term: 'test' })
        await vi.advanceTimersByTimeAsync(250)

        expect(getEntries).toHaveBeenCalledTimes(1)

        void manager.getSuggestion({ injector, term: 'test' })
        await vi.advanceTimersByTimeAsync(250)

        expect(getEntries).toHaveBeenCalledTimes(1)
      })
    })

    it('Should map entries to suggestions with getSuggestionEntry', async () => {
      const testEntries = createTestEntries()
      const getEntries = vi.fn().mockResolvedValue(testEntries)
      const getSuggestionEntry = vi.fn().mockImplementation(createSuggestionResult)
      const injector = new Injector()

      await usingAsync(new SuggestManager(getEntries, getSuggestionEntry), async (manager) => {
        void manager.getSuggestion({ injector, term: 'test' })
        await vi.advanceTimersByTimeAsync(250)

        expect(getSuggestionEntry).toHaveBeenCalledTimes(3)
        expect(getSuggestionEntry).toHaveBeenCalledWith(testEntries[0])
        expect(getSuggestionEntry).toHaveBeenCalledWith(testEntries[1])
        expect(getSuggestionEntry).toHaveBeenCalledWith(testEntries[2])

        const suggestions = manager.currentSuggestions.getValue()
        expect(suggestions[0].entry).toBe(testEntries[0])
        expect(suggestions[0].suggestion.score).toBe(1)
      })
    })

    it('Should preserve selected index when suggestion exists in new results', async () => {
      const testEntries = createTestEntries()
      const getEntries = vi.fn().mockResolvedValue(testEntries)
      const getSuggestionEntry = vi.fn().mockImplementation(createSuggestionResult)
      const injector = new Injector()

      await usingAsync(new SuggestManager(getEntries, getSuggestionEntry), async (manager) => {
        void manager.getSuggestion({ injector, term: 'test' })
        await vi.advanceTimersByTimeAsync(250)

        manager.selectedIndex.setValue(1)

        const newEntries = [testEntries[1], testEntries[2]]
        getEntries.mockResolvedValue(newEntries)
        getSuggestionEntry.mockImplementation(createSuggestionResult)

        void manager.getSuggestion({ injector, term: 'test2' })
        await vi.advanceTimersByTimeAsync(250)

        expect(manager.selectedIndex.getValue()).toBe(0)
      })
    })

    it('Should reset selected index to 0 when selection not found in new results', async () => {
      const testEntries = createTestEntries()
      const getEntries = vi.fn().mockResolvedValue(testEntries)
      const getSuggestionEntry = vi.fn().mockImplementation(createSuggestionResult)
      const injector = new Injector()

      await usingAsync(new SuggestManager(getEntries, getSuggestionEntry), async (manager) => {
        void manager.getSuggestion({ injector, term: 'test' })
        await vi.advanceTimersByTimeAsync(250)

        manager.selectedIndex.setValue(2)

        const newEntries = [{ id: 4, name: 'delta' }]
        getEntries.mockResolvedValue(newEntries)

        void manager.getSuggestion({ injector, term: 'test2' })
        await vi.advanceTimersByTimeAsync(250)

        expect(manager.selectedIndex.getValue()).toBe(0)
      })
    })
  })

  describe('selectSuggestion', () => {
    it('Should emit onSelectSuggestion event with selected entry', async () => {
      const testEntries = createTestEntries()
      const getEntries = vi.fn().mockResolvedValue(testEntries)
      const getSuggestionEntry = vi.fn().mockImplementation(createSuggestionResult)
      const injector = new Injector()

      await usingAsync(new SuggestManager(getEntries, getSuggestionEntry), async (manager) => {
        void manager.getSuggestion({ injector, term: 'test' })
        await vi.advanceTimersByTimeAsync(250)

        const onSelect = vi.fn()
        manager.subscribe('onSelectSuggestion', onSelect)

        manager.selectSuggestion(1)

        expect(onSelect).toHaveBeenCalledWith(testEntries[1])
        expect(manager.isOpened.getValue()).toBe(false)
      })
    })

    it('Should use current selectedIndex when no index provided', async () => {
      const testEntries = createTestEntries()
      const getEntries = vi.fn().mockResolvedValue(testEntries)
      const getSuggestionEntry = vi.fn().mockImplementation(createSuggestionResult)
      const injector = new Injector()

      await usingAsync(new SuggestManager(getEntries, getSuggestionEntry), async (manager) => {
        void manager.getSuggestion({ injector, term: 'test' })
        await vi.advanceTimersByTimeAsync(250)

        manager.selectedIndex.setValue(2)

        const onSelect = vi.fn()
        manager.subscribe('onSelectSuggestion', onSelect)

        manager.selectSuggestion()

        expect(onSelect).toHaveBeenCalledWith(testEntries[2])
      })
    })

    it('Should close the suggestion list after selection', async () => {
      const testEntries = createTestEntries()
      const getEntries = vi.fn().mockResolvedValue(testEntries)
      const getSuggestionEntry = vi.fn().mockImplementation(createSuggestionResult)
      const injector = new Injector()

      await usingAsync(new SuggestManager(getEntries, getSuggestionEntry), async (manager) => {
        void manager.getSuggestion({ injector, term: 'test' })
        await vi.advanceTimersByTimeAsync(250)

        expect(manager.isOpened.getValue()).toBe(true)

        manager.selectSuggestion(0)

        expect(manager.isOpened.getValue()).toBe(false)
      })
    })
  })
})
