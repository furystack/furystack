import { using } from '@furystack/utils'
import { describe, expect, it } from 'vitest'
import { ListService } from './list-service.js'

type TestItem = { id: number; name: string }

describe('ListService', () => {
  const createTestService = (options?: ConstructorParameters<typeof ListService<TestItem>>[0]) => {
    const service = new ListService<TestItem>(options)
    const items: TestItem[] = [
      { id: 1, name: 'First' },
      { id: 2, name: 'Second' },
      { id: 3, name: 'Third' },
    ]
    service.items.setValue(items)
    return { service, items }
  }

  describe('selection helpers', () => {
    it('should check if item is selected', () => {
      const { service, items } = createTestService()
      using(service, () => {
        service.selection.setValue([items[0]])

        expect(service.isSelected(items[0])).toBe(true)
        expect(service.isSelected(items[1])).toBe(false)
      })
    })

    it('should add item to selection', () => {
      const { service, items } = createTestService()
      using(service, () => {
        service.addToSelection(items[0])

        expect(service.selection.getValue()).toContain(items[0])
      })
    })

    it('should remove item from selection', () => {
      const { service, items } = createTestService()
      using(service, () => {
        service.selection.setValue([items[0], items[1]])
        service.removeFromSelection(items[0])

        expect(service.selection.getValue()).not.toContain(items[0])
        expect(service.selection.getValue()).toContain(items[1])
      })
    })

    it('should toggle selection on', () => {
      const { service, items } = createTestService()
      using(service, () => {
        service.toggleSelection(items[0])

        expect(service.isSelected(items[0])).toBe(true)
      })
    })

    it('should toggle selection off', () => {
      const { service, items } = createTestService()
      using(service, () => {
        service.selection.setValue([items[0]])
        service.toggleSelection(items[0])

        expect(service.isSelected(items[0])).toBe(false)
      })
    })
  })

  describe('handleKeyDown', () => {
    it('should not handle keyboard when not focused', () => {
      const { service, items } = createTestService()
      using(service, () => {
        service.hasFocus.setValue(false)
        service.focusedItem.setValue(items[0])

        service.handleKeyDown(new KeyboardEvent('keydown', { key: 'ArrowDown' }))

        expect(service.focusedItem.getValue()).toBe(items[0])
      })
    })

    it('should handle ArrowDown to move focus to next item', () => {
      const { service, items } = createTestService()
      using(service, () => {
        service.hasFocus.setValue(true)
        service.focusedItem.setValue(items[0])

        service.handleKeyDown(new KeyboardEvent('keydown', { key: 'ArrowDown' }))

        expect(service.focusedItem.getValue()).toBe(items[1])
      })
    })

    it('should not move past last item on ArrowDown', () => {
      const { service, items } = createTestService()
      using(service, () => {
        service.hasFocus.setValue(true)
        service.focusedItem.setValue(items[2])

        service.handleKeyDown(new KeyboardEvent('keydown', { key: 'ArrowDown' }))

        expect(service.focusedItem.getValue()).toBe(items[2])
      })
    })

    it('should handle ArrowUp to move focus to previous item', () => {
      const { service, items } = createTestService()
      using(service, () => {
        service.hasFocus.setValue(true)
        service.focusedItem.setValue(items[1])

        service.handleKeyDown(new KeyboardEvent('keydown', { key: 'ArrowUp' }))

        expect(service.focusedItem.getValue()).toBe(items[0])
      })
    })

    it('should not move past first item on ArrowUp', () => {
      const { service, items } = createTestService()
      using(service, () => {
        service.hasFocus.setValue(true)
        service.focusedItem.setValue(items[0])

        service.handleKeyDown(new KeyboardEvent('keydown', { key: 'ArrowUp' }))

        expect(service.focusedItem.getValue()).toBe(items[0])
      })
    })

    it('should handle Home to move focus to first item', () => {
      const { service, items } = createTestService()
      using(service, () => {
        service.hasFocus.setValue(true)
        service.focusedItem.setValue(items[2])

        service.handleKeyDown(new KeyboardEvent('keydown', { key: 'Home' }))

        expect(service.focusedItem.getValue()).toBe(items[0])
      })
    })

    it('should handle End to move focus to last item', () => {
      const { service, items } = createTestService()
      using(service, () => {
        service.hasFocus.setValue(true)
        service.focusedItem.setValue(items[0])

        service.handleKeyDown(new KeyboardEvent('keydown', { key: 'End' }))

        expect(service.focusedItem.getValue()).toBe(items[2])
      })
    })

    it('should handle Space to toggle selection of focused item', () => {
      const { service, items } = createTestService()
      using(service, () => {
        service.hasFocus.setValue(true)
        service.focusedItem.setValue(items[0])

        service.handleKeyDown(new KeyboardEvent('keydown', { key: ' ' }))
        expect(service.selection.getValue()).toContain(items[0])

        service.handleKeyDown(new KeyboardEvent('keydown', { key: ' ' }))
        expect(service.selection.getValue()).not.toContain(items[0])
      })
    })

    it('should handle + to select all items', () => {
      const { service, items } = createTestService()
      using(service, () => {
        service.hasFocus.setValue(true)

        service.handleKeyDown(new KeyboardEvent('keydown', { key: '+' }))

        expect(service.selection.getValue().length).toBe(3)
        expect(service.selection.getValue()).toEqual(items)
      })
    })

    it('should handle - to deselect all items', () => {
      const { service, items } = createTestService()
      using(service, () => {
        service.hasFocus.setValue(true)
        service.selection.setValue([...items])

        service.handleKeyDown(new KeyboardEvent('keydown', { key: '-' }))

        expect(service.selection.getValue().length).toBe(0)
      })
    })

    it('should handle * to invert selection', () => {
      const { service, items } = createTestService()
      using(service, () => {
        service.hasFocus.setValue(true)
        service.selection.setValue([items[0]])

        service.handleKeyDown(new KeyboardEvent('keydown', { key: '*' }))

        const selection = service.selection.getValue()
        expect(selection).not.toContain(items[0])
        expect(selection).toContain(items[1])
        expect(selection).toContain(items[2])
      })
    })

    it('should handle Insert to toggle selection and move to next item', () => {
      const { service, items } = createTestService()
      using(service, () => {
        service.hasFocus.setValue(true)
        service.focusedItem.setValue(items[0])

        service.handleKeyDown(new KeyboardEvent('keydown', { key: 'Insert' }))

        expect(service.selection.getValue()).toContain(items[0])
        expect(service.focusedItem.getValue()).toBe(items[1])
      })
    })

    it('should handle Insert to deselect already selected item', () => {
      const { service, items } = createTestService()
      using(service, () => {
        service.hasFocus.setValue(true)
        service.focusedItem.setValue(items[0])
        service.selection.setValue([items[0]])

        service.handleKeyDown(new KeyboardEvent('keydown', { key: 'Insert' }))

        expect(service.selection.getValue()).not.toContain(items[0])
        expect(service.focusedItem.getValue()).toBe(items[1])
      })
    })

    it('should handle Tab to toggle focus', () => {
      const { service } = createTestService()
      using(service, () => {
        service.hasFocus.setValue(true)

        service.handleKeyDown(new KeyboardEvent('keydown', { key: 'Tab' }))

        expect(service.hasFocus.getValue()).toBe(false)
      })
    })

    it('should handle Escape to clear selection and search term', () => {
      const { service, items } = createTestService()
      using(service, () => {
        service.hasFocus.setValue(true)
        service.selection.setValue([items[0], items[1]])
        service.searchTerm.setValue('test')

        service.handleKeyDown(new KeyboardEvent('keydown', { key: 'Escape' }))

        expect(service.selection.getValue()).toEqual([])
        expect(service.searchTerm.getValue()).toBe('')
      })
    })

    it('should handle type-ahead search when searchField is set', () => {
      const { service, items } = createTestService({ searchField: 'name' })
      using(service, () => {
        service.hasFocus.setValue(true)

        service.handleKeyDown(new KeyboardEvent('keydown', { key: 'S' }))

        expect(service.searchTerm.getValue()).toBe('S')
        expect(service.focusedItem.getValue()).toBe(items[1])
      })
    })

    it('should accumulate type-ahead search characters', () => {
      const { service, items } = createTestService({ searchField: 'name' })
      using(service, () => {
        service.hasFocus.setValue(true)

        service.handleKeyDown(new KeyboardEvent('keydown', { key: 'T' }))
        service.handleKeyDown(new KeyboardEvent('keydown', { key: 'h' }))
        service.handleKeyDown(new KeyboardEvent('keydown', { key: 'i' }))

        expect(service.searchTerm.getValue()).toBe('Thi')
        expect(service.focusedItem.getValue()).toBe(items[2])
      })
    })
  })

  describe('handleItemClick', () => {
    it('should set focused item on click', () => {
      const { service, items } = createTestService()
      using(service, () => {
        service.handleItemClick(items[1], new MouseEvent('click'))

        expect(service.focusedItem.getValue()).toBe(items[1])
      })
    })

    it('should add to selection on Ctrl+Click', () => {
      const { service, items } = createTestService()
      using(service, () => {
        service.handleItemClick(items[0], new MouseEvent('click', { ctrlKey: true }))

        expect(service.selection.getValue()).toContain(items[0])
      })
    })

    it('should remove from selection on Ctrl+Click when already selected', () => {
      const { service, items } = createTestService()
      using(service, () => {
        service.selection.setValue([items[0]])

        service.handleItemClick(items[0], new MouseEvent('click', { ctrlKey: true }))

        expect(service.selection.getValue()).not.toContain(items[0])
      })
    })

    it('should select range on Shift+Click', () => {
      const { service, items } = createTestService()
      using(service, () => {
        service.focusedItem.setValue(items[0])

        service.handleItemClick(items[2], new MouseEvent('click', { shiftKey: true }))

        const selection = service.selection.getValue()
        expect(selection).toContain(items[0])
        expect(selection).toContain(items[1])
        expect(selection).toContain(items[2])
      })
    })

    it('should select range backwards on Shift+Click', () => {
      const { service, items } = createTestService()
      using(service, () => {
        service.focusedItem.setValue(items[2])

        service.handleItemClick(items[0], new MouseEvent('click', { shiftKey: true }))

        const selection = service.selection.getValue()
        expect(selection).toContain(items[0])
        expect(selection).toContain(items[1])
        expect(selection).toContain(items[2])
      })
    })
  })

  describe('handleItemDoubleClick', () => {
    it('should not throw on double-click', () => {
      const { service, items } = createTestService()
      using(service, () => {
        expect(() => service.handleItemDoubleClick(items[0])).not.toThrow()
      })
    })
  })

  describe('dispose', () => {
    it('should dispose all observables', () => {
      const { service } = createTestService()

      expect(() => service[Symbol.dispose]()).not.toThrow()
    })
  })
})
