import { Injector } from '@furystack/inject'
import { using, usingAsync } from '@furystack/utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { CommandPaletteManager } from './command-palette-manager.js'
import type { CommandPaletteSuggestionResult, CommandProvider } from './command-provider.js'

const createMockSuggestion = (name: string, score: number): CommandPaletteSuggestionResult => ({
  element: { tagName: 'div', textContent: name } as unknown as JSX.Element,
  score,
  onSelected: vi.fn(),
})

const createCommandProvider = (suggestions: CommandPaletteSuggestionResult[]): CommandProvider => {
  return vi.fn().mockResolvedValue(suggestions)
}

describe('CommandPaletteManager', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe('Construction and disposal', () => {
    it('Should be constructed with command providers', () => {
      const providers: CommandProvider[] = []

      using(new CommandPaletteManager(providers), (manager) => {
        expect(manager.isOpened.getValue()).toBe(false)
        expect(manager.isLoading.getValue()).toBe(false)
        expect(manager.term.getValue()).toBe('')
        expect(manager.selectedIndex.getValue()).toBe(0)
        expect(manager.currentSuggestions.getValue()).toEqual([])
      })
    })

    it('Should register keyboard listener on construction', () => {
      const addEventListenerSpy = vi.spyOn(window, 'addEventListener')
      const providers: CommandProvider[] = []

      using(new CommandPaletteManager(providers), () => {
        expect(addEventListenerSpy).toHaveBeenCalledWith('keyup', expect.any(Function), true)
      })

      addEventListenerSpy.mockRestore()
    })

    it('Should dispose all observables and remove event listeners', () => {
      const removeEventListenerSpy = vi.spyOn(window, 'removeEventListener')
      const providers: CommandProvider[] = []

      const manager = new CommandPaletteManager(providers)

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

      expect(removeEventListenerSpy).toHaveBeenCalledWith('keyup', manager.keyPressListener)

      removeEventListenerSpy.mockRestore()
    })
  })

  describe('Keyboard shortcuts', () => {
    it('Should open command palette on Ctrl+P', () => {
      const providers: CommandProvider[] = []

      using(new CommandPaletteManager(providers), (manager) => {
        expect(manager.isOpened.getValue()).toBe(false)

        manager.keyPressListener({ key: 'p', ctrlKey: true } as KeyboardEvent)

        expect(manager.isOpened.getValue()).toBe(true)
      })
    })

    it('Should open command palette on Ctrl+P (uppercase P)', () => {
      const providers: CommandProvider[] = []

      using(new CommandPaletteManager(providers), (manager) => {
        expect(manager.isOpened.getValue()).toBe(false)

        manager.keyPressListener({ key: 'P', ctrlKey: true } as KeyboardEvent)

        expect(manager.isOpened.getValue()).toBe(true)
      })
    })

    it('Should clear suggestions when opening with Ctrl+P', () => {
      const suggestions = [createMockSuggestion('test', 1)]
      const providers: CommandProvider[] = []

      using(new CommandPaletteManager(providers), (manager) => {
        manager.currentSuggestions.setValue(suggestions)

        manager.keyPressListener({ key: 'p', ctrlKey: true } as KeyboardEvent)

        expect(manager.currentSuggestions.getValue()).toEqual([])
      })
    })

    it('Should not open command palette on P without Ctrl', () => {
      const providers: CommandProvider[] = []

      using(new CommandPaletteManager(providers), (manager) => {
        manager.keyPressListener({ key: 'p', ctrlKey: false } as KeyboardEvent)

        expect(manager.isOpened.getValue()).toBe(false)
      })
    })

    it('Should not open command palette on Ctrl without P', () => {
      const providers: CommandProvider[] = []

      using(new CommandPaletteManager(providers), (manager) => {
        manager.keyPressListener({ key: 'a', ctrlKey: true } as KeyboardEvent)

        expect(manager.isOpened.getValue()).toBe(false)
      })
    })

    it('Should close command palette on Escape', () => {
      const providers: CommandProvider[] = []

      using(new CommandPaletteManager(providers), (manager) => {
        manager.isOpened.setValue(true)
        expect(manager.isOpened.getValue()).toBe(true)

        manager.keyPressListener({ key: 'Escape' } as KeyboardEvent)

        expect(manager.isOpened.getValue()).toBe(false)
      })
    })

    it('Should not close command palette for other keys', () => {
      const providers: CommandProvider[] = []

      using(new CommandPaletteManager(providers), (manager) => {
        manager.isOpened.setValue(true)

        manager.keyPressListener({ key: 'Enter' } as KeyboardEvent)
        expect(manager.isOpened.getValue()).toBe(true)

        manager.keyPressListener({ key: 'ArrowDown' } as KeyboardEvent)
        expect(manager.isOpened.getValue()).toBe(true)
      })
    })

    it('Should handle undefined key gracefully', () => {
      const providers: CommandProvider[] = []

      using(new CommandPaletteManager(providers), (manager) => {
        manager.keyPressListener({ key: undefined, ctrlKey: true } as unknown as KeyboardEvent)

        expect(manager.isOpened.getValue()).toBe(false)
      })
    })
  })

  describe('getSuggestion (debounced search)', () => {
    it('Should load suggestions after debounce delay', async () => {
      const suggestions = [createMockSuggestion('test', 1)]
      const provider = createCommandProvider(suggestions)
      const injector = new Injector()

      await usingAsync(new CommandPaletteManager([provider]), async (manager) => {
        void manager.getSuggestion({ injector, term: 'test' })

        expect(provider).not.toHaveBeenCalled()
        expect(manager.isLoading.getValue()).toBe(false)

        await vi.advanceTimersByTimeAsync(250)

        expect(provider).toHaveBeenCalledWith({ injector, term: 'test' })
        expect(manager.currentSuggestions.getValue()).toHaveLength(1)
      })
    })

    it('Should set isLoading while fetching', async () => {
      let resolveProvider: (value: CommandPaletteSuggestionResult[]) => void
      const providerPromise = new Promise<CommandPaletteSuggestionResult[]>((resolve) => {
        resolveProvider = resolve
      })
      const provider = vi.fn().mockReturnValue(providerPromise)
      const injector = new Injector()

      await usingAsync(new CommandPaletteManager([provider]), async (manager) => {
        void manager.getSuggestion({ injector, term: 'test' })
        await vi.advanceTimersByTimeAsync(250)

        expect(manager.isLoading.getValue()).toBe(true)

        resolveProvider!([])
        await vi.advanceTimersByTimeAsync(0)

        expect(manager.isLoading.getValue()).toBe(false)
      })
    })

    it('Should debounce multiple rapid calls', async () => {
      const suggestions = [createMockSuggestion('test', 1)]
      const provider = createCommandProvider(suggestions)
      const injector = new Injector()

      await usingAsync(new CommandPaletteManager([provider]), async (manager) => {
        void manager.getSuggestion({ injector, term: 'a' })
        await vi.advanceTimersByTimeAsync(100)

        void manager.getSuggestion({ injector, term: 'ab' })
        await vi.advanceTimersByTimeAsync(100)

        void manager.getSuggestion({ injector, term: 'abc' })
        await vi.advanceTimersByTimeAsync(250)

        expect(provider).toHaveBeenCalledTimes(1)
        expect(provider).toHaveBeenCalledWith({ injector, term: 'abc' })
      })
    })

    it('Should not fetch again if term is unchanged', async () => {
      const suggestions = [createMockSuggestion('test', 1)]
      const provider = createCommandProvider(suggestions)
      const injector = new Injector()

      await usingAsync(new CommandPaletteManager([provider]), async (manager) => {
        void manager.getSuggestion({ injector, term: 'test' })
        await vi.advanceTimersByTimeAsync(250)

        expect(provider).toHaveBeenCalledTimes(1)

        void manager.getSuggestion({ injector, term: 'test' })
        await vi.advanceTimersByTimeAsync(250)

        expect(provider).toHaveBeenCalledTimes(1)
      })
    })

    it('Should reset selectedIndex when fetching new suggestions', async () => {
      const suggestions = [createMockSuggestion('test', 1)]
      const provider = createCommandProvider(suggestions)
      const injector = new Injector()

      await usingAsync(new CommandPaletteManager([provider]), async (manager) => {
        manager.selectedIndex.setValue(5)

        void manager.getSuggestion({ injector, term: 'test' })
        await vi.advanceTimersByTimeAsync(250)

        expect(manager.selectedIndex.getValue()).toBe(0)
      })
    })

    it('Should clear suggestions when starting new search', async () => {
      const suggestions = [createMockSuggestion('test', 1)]
      const provider = createCommandProvider(suggestions)
      const injector = new Injector()

      await usingAsync(new CommandPaletteManager([provider]), async (manager) => {
        void manager.getSuggestion({ injector, term: 'test' })
        await vi.advanceTimersByTimeAsync(250)

        expect(manager.currentSuggestions.getValue()).toHaveLength(1)

        void manager.getSuggestion({ injector, term: 'test2' })
        await vi.advanceTimersByTimeAsync(250)

        expect(manager.currentSuggestions.getValue()).toHaveLength(1)
      })
    })

    it('Should set isLoading to false even when error occurs', async () => {
      const provider = vi.fn().mockImplementation(async () => {
        throw new Error('Network error')
      })
      const injector = new Injector()

      // Suppress expected unhandled rejection from debounced async error
      const errorHandler = (reason: unknown) => {
        if ((reason as Error)?.message === 'Network error') {
          return
        }
        throw reason
      }
      process.on('unhandledRejection', errorHandler)

      try {
        await usingAsync(new CommandPaletteManager([provider]), async (manager) => {
          manager.getSuggestion({ injector, term: 'test' })
          await vi.advanceTimersByTimeAsync(250)
          // Wait for promise rejection to be handled
          await vi.advanceTimersByTimeAsync(0)

          expect(manager.isLoading.getValue()).toBe(false)
        })
      } finally {
        process.removeListener('unhandledRejection', errorHandler)
      }
    })
  })

  describe('Multiple command providers', () => {
    it('Should call all providers when getting suggestions', async () => {
      const provider1 = createCommandProvider([createMockSuggestion('cmd1', 1)])
      const provider2 = createCommandProvider([createMockSuggestion('cmd2', 2)])
      const provider3 = createCommandProvider([createMockSuggestion('cmd3', 3)])
      const injector = new Injector()

      await usingAsync(new CommandPaletteManager([provider1, provider2, provider3]), async (manager) => {
        void manager.getSuggestion({ injector, term: 'test' })
        await vi.advanceTimersByTimeAsync(250)

        expect(provider1).toHaveBeenCalledWith({ injector, term: 'test' })
        expect(provider2).toHaveBeenCalledWith({ injector, term: 'test' })
        expect(provider3).toHaveBeenCalledWith({ injector, term: 'test' })
      })
    })

    it('Should aggregate suggestions from all providers', async () => {
      const provider1 = createCommandProvider([createMockSuggestion('cmd1', 1)])
      const provider2 = createCommandProvider([createMockSuggestion('cmd2', 2), createMockSuggestion('cmd3', 3)])
      const injector = new Injector()

      await usingAsync(new CommandPaletteManager([provider1, provider2]), async (manager) => {
        void manager.getSuggestion({ injector, term: 'test' })
        await vi.advanceTimersByTimeAsync(250)

        expect(manager.currentSuggestions.getValue()).toHaveLength(3)
      })
    })

    it('Should sort suggestions by score', async () => {
      const provider1 = createCommandProvider([createMockSuggestion('low', 1)])
      const provider2 = createCommandProvider([createMockSuggestion('high', 10)])
      const provider3 = createCommandProvider([createMockSuggestion('medium', 5)])
      const injector = new Injector()

      await usingAsync(new CommandPaletteManager([provider1, provider2, provider3]), async (manager) => {
        void manager.getSuggestion({ injector, term: 'test' })
        await vi.advanceTimersByTimeAsync(250)

        const suggestions = manager.currentSuggestions.getValue()
        expect(suggestions[0].score).toBe(1)
        expect(suggestions[1].score).toBe(5)
        expect(suggestions[2].score).toBe(10)
      })
    })

    it('Should handle providers returning empty arrays', async () => {
      const provider1 = createCommandProvider([createMockSuggestion('cmd1', 1)])
      const provider2 = createCommandProvider([])
      const injector = new Injector()

      await usingAsync(new CommandPaletteManager([provider1, provider2]), async (manager) => {
        void manager.getSuggestion({ injector, term: 'test' })
        await vi.advanceTimersByTimeAsync(250)

        expect(manager.currentSuggestions.getValue()).toHaveLength(1)
      })
    })

    it('Should work with no providers', async () => {
      const injector = new Injector()

      await usingAsync(new CommandPaletteManager([]), async (manager) => {
        void manager.getSuggestion({ injector, term: 'test' })
        await vi.advanceTimersByTimeAsync(250)

        expect(manager.currentSuggestions.getValue()).toHaveLength(0)
        expect(manager.isLoading.getValue()).toBe(false)
      })
    })

    it('Should handle provider errors gracefully', async () => {
      const provider1 = createCommandProvider([createMockSuggestion('cmd1', 1)])
      const provider2 = vi.fn().mockImplementation(async () => {
        throw new Error('Provider failed')
      })
      const injector = new Injector()

      // Suppress expected unhandled rejection from debounced async error
      const errorHandler = (reason: unknown) => {
        if ((reason as Error)?.message === 'Provider failed') {
          return
        }
        throw reason
      }
      process.on('unhandledRejection', errorHandler)

      try {
        await usingAsync(new CommandPaletteManager([provider1, provider2]), async (manager) => {
          manager.getSuggestion({ injector, term: 'test' })
          await vi.advanceTimersByTimeAsync(250)
          // Wait for promise rejection to be handled
          await vi.advanceTimersByTimeAsync(0)

          expect(manager.isLoading.getValue()).toBe(false)
        })
      } finally {
        process.removeListener('unhandledRejection', errorHandler)
      }
    })
  })

  describe('selectSuggestion', () => {
    it('Should call onSelected callback with injector', async () => {
      const suggestion = createMockSuggestion('cmd', 1)
      const provider = createCommandProvider([suggestion])
      const injector = new Injector()

      await usingAsync(new CommandPaletteManager([provider]), async (manager) => {
        void manager.getSuggestion({ injector, term: 'test' })
        await vi.advanceTimersByTimeAsync(250)

        manager.selectSuggestion(injector, 0)

        expect(suggestion.onSelected).toHaveBeenCalledWith({ injector })
      })
    })

    it('Should use current selectedIndex when no index provided', async () => {
      const suggestions = [
        createMockSuggestion('cmd1', 1),
        createMockSuggestion('cmd2', 2),
        createMockSuggestion('cmd3', 3),
      ]
      const provider = createCommandProvider(suggestions)
      const injector = new Injector()

      await usingAsync(new CommandPaletteManager([provider]), async (manager) => {
        void manager.getSuggestion({ injector, term: 'test' })
        await vi.advanceTimersByTimeAsync(250)

        manager.selectedIndex.setValue(2)
        manager.selectSuggestion(injector)

        expect(suggestions[2].onSelected).toHaveBeenCalledWith({ injector })
      })
    })

    it('Should close the command palette after selection', async () => {
      const suggestion = createMockSuggestion('cmd', 1)
      const provider = createCommandProvider([suggestion])
      const injector = new Injector()

      await usingAsync(new CommandPaletteManager([provider]), async (manager) => {
        void manager.getSuggestion({ injector, term: 'test' })
        await vi.advanceTimersByTimeAsync(250)

        manager.isOpened.setValue(true)
        expect(manager.isOpened.getValue()).toBe(true)

        manager.selectSuggestion(injector, 0)

        expect(manager.isOpened.getValue()).toBe(false)
      })
    })
  })
})
