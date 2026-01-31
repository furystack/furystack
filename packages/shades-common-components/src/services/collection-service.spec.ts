import { using } from '@furystack/utils'
import { describe, expect, it, vi } from 'vitest'
import { CollectionService } from './collection-service.js'

type TestEntry = { foo: number; name?: string }

const createTestEntries = (): TestEntry[] => [
  { foo: 1, name: 'alpha' },
  { foo: 2, name: 'beta' },
  { foo: 3, name: 'gamma' },
]

const createKeyboardEvent = (key: string, options: Partial<KeyboardEvent> = {}): KeyboardEvent => {
  return {
    key,
    preventDefault: vi.fn(),
    ...options,
  } as unknown as KeyboardEvent
}

const createMouseEvent = (options: Partial<MouseEvent> = {}): MouseEvent => {
  return {
    ctrlKey: false,
    shiftKey: false,
    ...options,
  } as unknown as MouseEvent
}

describe('CollectionService', () => {
  describe('Selection', () => {
    it('Should add and remove selection', () => {
      const testEntries = createTestEntries()
      using(new CollectionService<TestEntry>({}), (collectionService) => {
        collectionService.data.setValue({ count: 3, entries: testEntries })
        testEntries.forEach((entry) => {
          expect(collectionService.isSelected(entry)).toBe(false)
        })

        collectionService.addToSelection(testEntries[0])

        expect(collectionService.isSelected(testEntries[0])).toBe(true)
        expect(collectionService.isSelected(testEntries[1])).toBe(false)
        expect(collectionService.isSelected(testEntries[2])).toBe(false)

        collectionService.removeFromSelection(testEntries[0])

        expect(collectionService.isSelected(testEntries[0])).toBe(false)

        collectionService.toggleSelection(testEntries[1])
        expect(collectionService.isSelected(testEntries[1])).toBe(true)
      })
    })
  })

  describe('Disposal', () => {
    it('Should dispose all observables', () => {
      const service = new CollectionService<TestEntry>({})
      const dataSpy = vi.spyOn(service.data, Symbol.dispose)
      const selectionSpy = vi.spyOn(service.selection, Symbol.dispose)
      const searchTermSpy = vi.spyOn(service.searchTerm, Symbol.dispose)
      const hasFocusSpy = vi.spyOn(service.hasFocus, Symbol.dispose)
      const focusedEntrySpy = vi.spyOn(service.focusedEntry, Symbol.dispose)

      service[Symbol.dispose]()

      expect(dataSpy).toHaveBeenCalled()
      expect(selectionSpy).toHaveBeenCalled()
      expect(searchTermSpy).toHaveBeenCalled()
      expect(hasFocusSpy).toHaveBeenCalled()
      expect(focusedEntrySpy).toHaveBeenCalled()
    })
  })

  describe('handleKeyDown', () => {
    it('Should do nothing when hasFocus is false', () => {
      const testEntries = createTestEntries()
      using(new CollectionService<TestEntry>({}), (service) => {
        service.data.setValue({ count: 3, entries: testEntries })
        service.hasFocus.setValue(false)
        service.focusedEntry.setValue(testEntries[0])

        service.handleKeyDown(createKeyboardEvent(' '))

        expect(service.selection.getValue()).toEqual([])
      })
    })

    describe('Space key', () => {
      it('Should toggle selection on focused entry', () => {
        const testEntries = createTestEntries()
        using(new CollectionService<TestEntry>({}), (service) => {
          service.data.setValue({ count: 3, entries: testEntries })
          service.hasFocus.setValue(true)
          service.focusedEntry.setValue(testEntries[1])

          const ev = createKeyboardEvent(' ')
          service.handleKeyDown(ev)

          expect(ev.preventDefault).toHaveBeenCalled()
          expect(service.selection.getValue()).toEqual([testEntries[1]])

          service.handleKeyDown(createKeyboardEvent(' '))
          expect(service.selection.getValue()).toEqual([])
        })
      })

      it('Should do nothing when no entry is focused', () => {
        const testEntries = createTestEntries()
        using(new CollectionService<TestEntry>({}), (service) => {
          service.data.setValue({ count: 3, entries: testEntries })
          service.hasFocus.setValue(true)
          service.focusedEntry.setValue(undefined)

          service.handleKeyDown(createKeyboardEvent(' '))

          expect(service.selection.getValue()).toEqual([])
        })
      })
    })

    describe('* key (invert selection)', () => {
      it('Should invert selection', () => {
        const testEntries = createTestEntries()
        using(new CollectionService<TestEntry>({}), (service) => {
          service.data.setValue({ count: 3, entries: testEntries })
          service.hasFocus.setValue(true)
          service.selection.setValue([testEntries[0], testEntries[2]])

          service.handleKeyDown(createKeyboardEvent('*'))

          expect(service.selection.getValue()).toEqual([testEntries[1]])
        })
      })
    })

    describe('+ key (select all)', () => {
      it('Should select all entries', () => {
        const testEntries = createTestEntries()
        using(new CollectionService<TestEntry>({}), (service) => {
          service.data.setValue({ count: 3, entries: testEntries })
          service.hasFocus.setValue(true)

          service.handleKeyDown(createKeyboardEvent('+'))

          expect(service.selection.getValue()).toEqual(testEntries)
        })
      })
    })

    describe('- key (deselect all)', () => {
      it('Should deselect all entries', () => {
        const testEntries = createTestEntries()
        using(new CollectionService<TestEntry>({}), (service) => {
          service.data.setValue({ count: 3, entries: testEntries })
          service.hasFocus.setValue(true)
          service.selection.setValue([testEntries[0], testEntries[1]])

          service.handleKeyDown(createKeyboardEvent('-'))

          expect(service.selection.getValue()).toEqual([])
        })
      })
    })

    describe('Insert key', () => {
      it('Should toggle selection and move focus to next entry', () => {
        const testEntries = createTestEntries()
        using(new CollectionService<TestEntry>({}), (service) => {
          service.data.setValue({ count: 3, entries: testEntries })
          service.hasFocus.setValue(true)
          service.focusedEntry.setValue(testEntries[0])

          service.handleKeyDown(createKeyboardEvent('Insert'))

          expect(service.selection.getValue()).toEqual([testEntries[0]])
          expect(service.focusedEntry.getValue()).toBe(testEntries[1])
        })
      })

      it('Should deselect if already selected and move focus', () => {
        const testEntries = createTestEntries()
        using(new CollectionService<TestEntry>({}), (service) => {
          service.data.setValue({ count: 3, entries: testEntries })
          service.hasFocus.setValue(true)
          service.focusedEntry.setValue(testEntries[1])
          service.selection.setValue([testEntries[1]])

          service.handleKeyDown(createKeyboardEvent('Insert'))

          expect(service.selection.getValue()).toEqual([])
          expect(service.focusedEntry.getValue()).toBe(testEntries[2])
        })
      })

      it('Should do nothing when no entry is focused', () => {
        const testEntries = createTestEntries()
        using(new CollectionService<TestEntry>({}), (service) => {
          service.data.setValue({ count: 3, entries: testEntries })
          service.hasFocus.setValue(true)
          service.focusedEntry.setValue(undefined)

          service.handleKeyDown(createKeyboardEvent('Insert'))

          expect(service.selection.getValue()).toEqual([])
        })
      })
    })

    describe('ArrowUp key', () => {
      it('Should move focus to previous entry', () => {
        const testEntries = createTestEntries()
        using(new CollectionService<TestEntry>({}), (service) => {
          service.data.setValue({ count: 3, entries: testEntries })
          service.hasFocus.setValue(true)
          service.focusedEntry.setValue(testEntries[2])

          const ev = createKeyboardEvent('ArrowUp')
          service.handleKeyDown(ev)

          expect(ev.preventDefault).toHaveBeenCalled()
          expect(service.focusedEntry.getValue()).toBe(testEntries[1])
        })
      })

      it('Should not go below index 0', () => {
        const testEntries = createTestEntries()
        using(new CollectionService<TestEntry>({}), (service) => {
          service.data.setValue({ count: 3, entries: testEntries })
          service.hasFocus.setValue(true)
          service.focusedEntry.setValue(testEntries[0])

          service.handleKeyDown(createKeyboardEvent('ArrowUp'))

          expect(service.focusedEntry.getValue()).toBe(testEntries[0])
        })
      })
    })

    describe('ArrowDown key', () => {
      it('Should move focus to next entry', () => {
        const testEntries = createTestEntries()
        using(new CollectionService<TestEntry>({}), (service) => {
          service.data.setValue({ count: 3, entries: testEntries })
          service.hasFocus.setValue(true)
          service.focusedEntry.setValue(testEntries[0])

          const ev = createKeyboardEvent('ArrowDown')
          service.handleKeyDown(ev)

          expect(ev.preventDefault).toHaveBeenCalled()
          expect(service.focusedEntry.getValue()).toBe(testEntries[1])
        })
      })

      it('Should not exceed the last entry', () => {
        const testEntries = createTestEntries()
        using(new CollectionService<TestEntry>({}), (service) => {
          service.data.setValue({ count: 3, entries: testEntries })
          service.hasFocus.setValue(true)
          service.focusedEntry.setValue(testEntries[2])

          service.handleKeyDown(createKeyboardEvent('ArrowDown'))

          expect(service.focusedEntry.getValue()).toBe(testEntries[2])
        })
      })
    })

    describe('Home key', () => {
      it('Should focus the first entry', () => {
        const testEntries = createTestEntries()
        using(new CollectionService<TestEntry>({}), (service) => {
          service.data.setValue({ count: 3, entries: testEntries })
          service.hasFocus.setValue(true)
          service.focusedEntry.setValue(testEntries[2])

          service.handleKeyDown(createKeyboardEvent('Home'))

          expect(service.focusedEntry.getValue()).toBe(testEntries[0])
        })
      })
    })

    describe('End key', () => {
      it('Should focus the last entry', () => {
        const testEntries = createTestEntries()
        using(new CollectionService<TestEntry>({}), (service) => {
          service.data.setValue({ count: 3, entries: testEntries })
          service.hasFocus.setValue(true)
          service.focusedEntry.setValue(testEntries[0])

          service.handleKeyDown(createKeyboardEvent('End'))

          expect(service.focusedEntry.getValue()).toBe(testEntries[2])
        })
      })
    })

    describe('Tab key', () => {
      it('Should toggle hasFocus', () => {
        const testEntries = createTestEntries()
        using(new CollectionService<TestEntry>({}), (service) => {
          service.data.setValue({ count: 3, entries: testEntries })
          service.hasFocus.setValue(true)

          service.handleKeyDown(createKeyboardEvent('Tab'))

          expect(service.hasFocus.getValue()).toBe(false)
        })
      })
    })

    describe('Escape key', () => {
      it('Should clear search term and selection', () => {
        const testEntries = createTestEntries()
        using(new CollectionService<TestEntry>({}), (service) => {
          service.data.setValue({ count: 3, entries: testEntries })
          service.hasFocus.setValue(true)
          service.selection.setValue([testEntries[0], testEntries[1]])
          service.searchTerm.setValue('test')

          service.handleKeyDown(createKeyboardEvent('Escape'))

          expect(service.searchTerm.getValue()).toBe('')
          expect(service.selection.getValue()).toEqual([])
        })
      })
    })

    describe('Character search', () => {
      it('Should search by character when searchField is configured', () => {
        const testEntries = createTestEntries()
        using(new CollectionService<TestEntry>({ searchField: 'name' }), (service) => {
          service.data.setValue({ count: 3, entries: testEntries })
          service.hasFocus.setValue(true)

          service.handleKeyDown(createKeyboardEvent('b'))

          expect(service.searchTerm.getValue()).toBe('b')
          expect(service.focusedEntry.getValue()).toBe(testEntries[1]) // 'beta'
        })
      })

      it('Should accumulate search characters', () => {
        const testEntries = createTestEntries()
        using(new CollectionService<TestEntry>({ searchField: 'name' }), (service) => {
          service.data.setValue({ count: 3, entries: testEntries })
          service.hasFocus.setValue(true)

          service.handleKeyDown(createKeyboardEvent('a'))
          expect(service.focusedEntry.getValue()).toBe(testEntries[0]) // 'alpha'

          service.handleKeyDown(createKeyboardEvent('l'))
          expect(service.searchTerm.getValue()).toBe('al')
          expect(service.focusedEntry.getValue()).toBe(testEntries[0]) // still 'alpha'
        })
      })

      it('Should not search when searchField is not configured', () => {
        const testEntries = createTestEntries()
        using(new CollectionService<TestEntry>({}), (service) => {
          service.data.setValue({ count: 3, entries: testEntries })
          service.hasFocus.setValue(true)

          service.handleKeyDown(createKeyboardEvent('b'))

          expect(service.searchTerm.getValue()).toBe('')
          expect(service.focusedEntry.getValue()).toBeUndefined()
        })
      })

      it('Should set focusedEntry to undefined when no match found', () => {
        const testEntries = createTestEntries()
        using(new CollectionService<TestEntry>({ searchField: 'name' }), (service) => {
          service.data.setValue({ count: 3, entries: testEntries })
          service.hasFocus.setValue(true)
          service.focusedEntry.setValue(testEntries[0])

          service.handleKeyDown(createKeyboardEvent('z'))

          expect(service.searchTerm.getValue()).toBe('z')
          expect(service.focusedEntry.getValue()).toBeUndefined()
        })
      })

      it('Should ignore multi-character keys', () => {
        const testEntries = createTestEntries()
        using(new CollectionService<TestEntry>({ searchField: 'name' }), (service) => {
          service.data.setValue({ count: 3, entries: testEntries })
          service.hasFocus.setValue(true)

          service.handleKeyDown(createKeyboardEvent('Shift'))

          expect(service.searchTerm.getValue()).toBe('')
        })
      })
    })
  })

  describe('handleRowClick', () => {
    it('Should call onRowClick callback', () => {
      const testEntries = createTestEntries()
      const onRowClick = vi.fn()
      using(new CollectionService<TestEntry>({ onRowClick }), (service) => {
        service.data.setValue({ count: 3, entries: testEntries })

        service.handleRowClick(testEntries[0], createMouseEvent())

        expect(onRowClick).toHaveBeenCalledWith(testEntries[0])
      })
    })

    it('Should update focusedEntry on click', () => {
      const testEntries = createTestEntries()
      using(new CollectionService<TestEntry>({}), (service) => {
        service.data.setValue({ count: 3, entries: testEntries })

        service.handleRowClick(testEntries[1], createMouseEvent())

        expect(service.focusedEntry.getValue()).toBe(testEntries[1])
      })
    })

    describe('Ctrl+click', () => {
      it('Should add entry to selection with Ctrl+click', () => {
        const testEntries = createTestEntries()
        using(new CollectionService<TestEntry>({}), (service) => {
          service.data.setValue({ count: 3, entries: testEntries })
          service.selection.setValue([testEntries[0]])

          service.handleRowClick(testEntries[1], createMouseEvent({ ctrlKey: true }))

          expect(service.selection.getValue()).toEqual([testEntries[0], testEntries[1]])
        })
      })

      it('Should remove entry from selection with Ctrl+click if already selected', () => {
        const testEntries = createTestEntries()
        using(new CollectionService<TestEntry>({}), (service) => {
          service.data.setValue({ count: 3, entries: testEntries })
          service.selection.setValue([testEntries[0], testEntries[1]])

          service.handleRowClick(testEntries[0], createMouseEvent({ ctrlKey: true }))

          expect(service.selection.getValue()).toEqual([testEntries[1]])
        })
      })
    })

    describe('Shift+click', () => {
      it('Should select range from last focused to clicked entry (forward)', () => {
        const testEntries = createTestEntries()
        using(new CollectionService<TestEntry>({}), (service) => {
          service.data.setValue({ count: 3, entries: testEntries })
          service.focusedEntry.setValue(testEntries[0])

          service.handleRowClick(testEntries[2], createMouseEvent({ shiftKey: true }))

          expect(service.selection.getValue()).toContain(testEntries[0])
          expect(service.selection.getValue()).toContain(testEntries[1])
          expect(service.selection.getValue()).toContain(testEntries[2])
        })
      })

      it('Should select range from last focused to clicked entry (backward)', () => {
        const testEntries = createTestEntries()
        using(new CollectionService<TestEntry>({}), (service) => {
          service.data.setValue({ count: 3, entries: testEntries })
          service.focusedEntry.setValue(testEntries[2])

          service.handleRowClick(testEntries[0], createMouseEvent({ shiftKey: true }))

          expect(service.selection.getValue()).toContain(testEntries[0])
          expect(service.selection.getValue()).toContain(testEntries[1])
          expect(service.selection.getValue()).toContain(testEntries[2])
        })
      })

      it('Should append to existing selection with Shift+click', () => {
        const testEntries = createTestEntries()
        const extraEntry = { foo: 4, name: 'delta' }
        const allEntries = [...testEntries, extraEntry]
        using(new CollectionService<TestEntry>({}), (service) => {
          service.data.setValue({ count: 4, entries: allEntries })
          service.selection.setValue([extraEntry])
          service.focusedEntry.setValue(testEntries[0])

          service.handleRowClick(testEntries[1], createMouseEvent({ shiftKey: true }))

          expect(service.selection.getValue()).toContain(extraEntry)
          expect(service.selection.getValue()).toContain(testEntries[0])
          expect(service.selection.getValue()).toContain(testEntries[1])
        })
      })
    })
  })

  describe('handleRowDoubleClick', () => {
    it('Should call onRowDoubleClick callback', () => {
      const testEntries = createTestEntries()
      const onRowDoubleClick = vi.fn()
      using(new CollectionService<TestEntry>({ onRowDoubleClick }), (service) => {
        service.data.setValue({ count: 3, entries: testEntries })

        service.handleRowDoubleClick(testEntries[0])

        expect(onRowDoubleClick).toHaveBeenCalledWith(testEntries[0])
      })
    })

    it('Should not throw when onRowDoubleClick is not configured', () => {
      const testEntries = createTestEntries()
      using(new CollectionService<TestEntry>({}), (service) => {
        service.data.setValue({ count: 3, entries: testEntries })

        expect(() => service.handleRowDoubleClick(testEntries[0])).not.toThrow()
      })
    })
  })
})
