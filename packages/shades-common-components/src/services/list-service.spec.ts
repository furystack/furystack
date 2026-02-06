import { describe, expect, it, vi } from 'vitest'
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
      service.selection.setValue([items[0]])

      expect(service.isSelected(items[0])).toBe(true)
      expect(service.isSelected(items[1])).toBe(false)

      service[Symbol.dispose]()
    })

    it('should add item to selection', () => {
      const { service, items } = createTestService()
      service.addToSelection(items[0])

      expect(service.selection.getValue()).toContain(items[0])

      service[Symbol.dispose]()
    })

    it('should remove item from selection', () => {
      const { service, items } = createTestService()
      service.selection.setValue([items[0], items[1]])
      service.removeFromSelection(items[0])

      expect(service.selection.getValue()).not.toContain(items[0])
      expect(service.selection.getValue()).toContain(items[1])

      service[Symbol.dispose]()
    })

    it('should toggle selection on', () => {
      const { service, items } = createTestService()
      service.toggleSelection(items[0])

      expect(service.isSelected(items[0])).toBe(true)

      service[Symbol.dispose]()
    })

    it('should toggle selection off', () => {
      const { service, items } = createTestService()
      service.selection.setValue([items[0]])
      service.toggleSelection(items[0])

      expect(service.isSelected(items[0])).toBe(false)

      service[Symbol.dispose]()
    })
  })

  describe('handleKeyDown', () => {
    it('should not handle keyboard when not focused', () => {
      const { service, items } = createTestService()
      service.hasFocus.setValue(false)
      service.focusedItem.setValue(items[0])

      service.handleKeyDown(new KeyboardEvent('keydown', { key: 'ArrowDown' }))

      expect(service.focusedItem.getValue()).toBe(items[0])

      service[Symbol.dispose]()
    })

    it('should handle ArrowDown to move focus to next item', () => {
      const { service, items } = createTestService()
      service.hasFocus.setValue(true)
      service.focusedItem.setValue(items[0])

      service.handleKeyDown(new KeyboardEvent('keydown', { key: 'ArrowDown' }))

      expect(service.focusedItem.getValue()).toBe(items[1])

      service[Symbol.dispose]()
    })

    it('should not move past last item on ArrowDown', () => {
      const { service, items } = createTestService()
      service.hasFocus.setValue(true)
      service.focusedItem.setValue(items[2])

      service.handleKeyDown(new KeyboardEvent('keydown', { key: 'ArrowDown' }))

      expect(service.focusedItem.getValue()).toBe(items[2])

      service[Symbol.dispose]()
    })

    it('should handle ArrowUp to move focus to previous item', () => {
      const { service, items } = createTestService()
      service.hasFocus.setValue(true)
      service.focusedItem.setValue(items[1])

      service.handleKeyDown(new KeyboardEvent('keydown', { key: 'ArrowUp' }))

      expect(service.focusedItem.getValue()).toBe(items[0])

      service[Symbol.dispose]()
    })

    it('should not move past first item on ArrowUp', () => {
      const { service, items } = createTestService()
      service.hasFocus.setValue(true)
      service.focusedItem.setValue(items[0])

      service.handleKeyDown(new KeyboardEvent('keydown', { key: 'ArrowUp' }))

      expect(service.focusedItem.getValue()).toBe(items[0])

      service[Symbol.dispose]()
    })

    it('should handle Home to move focus to first item', () => {
      const { service, items } = createTestService()
      service.hasFocus.setValue(true)
      service.focusedItem.setValue(items[2])

      service.handleKeyDown(new KeyboardEvent('keydown', { key: 'Home' }))

      expect(service.focusedItem.getValue()).toBe(items[0])

      service[Symbol.dispose]()
    })

    it('should handle End to move focus to last item', () => {
      const { service, items } = createTestService()
      service.hasFocus.setValue(true)
      service.focusedItem.setValue(items[0])

      service.handleKeyDown(new KeyboardEvent('keydown', { key: 'End' }))

      expect(service.focusedItem.getValue()).toBe(items[2])

      service[Symbol.dispose]()
    })

    it('should handle Space to toggle selection of focused item', () => {
      const { service, items } = createTestService()
      service.hasFocus.setValue(true)
      service.focusedItem.setValue(items[0])

      service.handleKeyDown(new KeyboardEvent('keydown', { key: ' ' }))
      expect(service.selection.getValue()).toContain(items[0])

      service.handleKeyDown(new KeyboardEvent('keydown', { key: ' ' }))
      expect(service.selection.getValue()).not.toContain(items[0])

      service[Symbol.dispose]()
    })

    it('should handle + to select all items', () => {
      const { service, items } = createTestService()
      service.hasFocus.setValue(true)

      service.handleKeyDown(new KeyboardEvent('keydown', { key: '+' }))

      expect(service.selection.getValue().length).toBe(3)
      expect(service.selection.getValue()).toEqual(items)

      service[Symbol.dispose]()
    })

    it('should handle - to deselect all items', () => {
      const { service, items } = createTestService()
      service.hasFocus.setValue(true)
      service.selection.setValue([...items])

      service.handleKeyDown(new KeyboardEvent('keydown', { key: '-' }))

      expect(service.selection.getValue().length).toBe(0)

      service[Symbol.dispose]()
    })

    it('should handle * to invert selection', () => {
      const { service, items } = createTestService()
      service.hasFocus.setValue(true)
      service.selection.setValue([items[0]])

      service.handleKeyDown(new KeyboardEvent('keydown', { key: '*' }))

      const selection = service.selection.getValue()
      expect(selection).not.toContain(items[0])
      expect(selection).toContain(items[1])
      expect(selection).toContain(items[2])

      service[Symbol.dispose]()
    })

    it('should handle Insert to toggle selection and move to next item', () => {
      const { service, items } = createTestService()
      service.hasFocus.setValue(true)
      service.focusedItem.setValue(items[0])

      service.handleKeyDown(new KeyboardEvent('keydown', { key: 'Insert' }))

      expect(service.selection.getValue()).toContain(items[0])
      expect(service.focusedItem.getValue()).toBe(items[1])

      service[Symbol.dispose]()
    })

    it('should handle Insert to deselect already selected item', () => {
      const { service, items } = createTestService()
      service.hasFocus.setValue(true)
      service.focusedItem.setValue(items[0])
      service.selection.setValue([items[0]])

      service.handleKeyDown(new KeyboardEvent('keydown', { key: 'Insert' }))

      expect(service.selection.getValue()).not.toContain(items[0])
      expect(service.focusedItem.getValue()).toBe(items[1])

      service[Symbol.dispose]()
    })

    it('should handle Tab to toggle focus', () => {
      const { service } = createTestService()
      service.hasFocus.setValue(true)

      service.handleKeyDown(new KeyboardEvent('keydown', { key: 'Tab' }))

      expect(service.hasFocus.getValue()).toBe(false)

      service[Symbol.dispose]()
    })

    it('should handle Escape to clear selection and search term', () => {
      const { service, items } = createTestService()
      service.hasFocus.setValue(true)
      service.selection.setValue([items[0], items[1]])
      service.searchTerm.setValue('test')

      service.handleKeyDown(new KeyboardEvent('keydown', { key: 'Escape' }))

      expect(service.selection.getValue()).toEqual([])
      expect(service.searchTerm.getValue()).toBe('')

      service[Symbol.dispose]()
    })

    it('should handle Enter to activate focused item', () => {
      const onItemActivate = vi.fn()
      const { service, items } = createTestService({ onItemActivate })
      service.hasFocus.setValue(true)
      service.focusedItem.setValue(items[1])

      service.handleKeyDown(new KeyboardEvent('keydown', { key: 'Enter' }))

      expect(onItemActivate).toHaveBeenCalledWith(items[1])

      service[Symbol.dispose]()
    })

    it('should not activate when no item is focused on Enter', () => {
      const onItemActivate = vi.fn()
      const { service } = createTestService({ onItemActivate })
      service.hasFocus.setValue(true)

      service.handleKeyDown(new KeyboardEvent('keydown', { key: 'Enter' }))

      expect(onItemActivate).not.toHaveBeenCalled()

      service[Symbol.dispose]()
    })

    it('should handle type-ahead search when searchField is set', () => {
      const { service, items } = createTestService({ searchField: 'name' })
      service.hasFocus.setValue(true)

      service.handleKeyDown(new KeyboardEvent('keydown', { key: 'S' }))

      expect(service.searchTerm.getValue()).toBe('S')
      expect(service.focusedItem.getValue()).toBe(items[1])

      service[Symbol.dispose]()
    })

    it('should accumulate type-ahead search characters', () => {
      const { service, items } = createTestService({ searchField: 'name' })
      service.hasFocus.setValue(true)

      service.handleKeyDown(new KeyboardEvent('keydown', { key: 'T' }))
      service.handleKeyDown(new KeyboardEvent('keydown', { key: 'h' }))
      service.handleKeyDown(new KeyboardEvent('keydown', { key: 'i' }))

      expect(service.searchTerm.getValue()).toBe('Thi')
      expect(service.focusedItem.getValue()).toBe(items[2])

      service[Symbol.dispose]()
    })
  })

  describe('handleItemClick', () => {
    it('should set focused item on click', () => {
      const { service, items } = createTestService()

      service.handleItemClick(items[1], new MouseEvent('click'))

      expect(service.focusedItem.getValue()).toBe(items[1])

      service[Symbol.dispose]()
    })

    it('should add to selection on Ctrl+Click', () => {
      const { service, items } = createTestService()

      service.handleItemClick(items[0], new MouseEvent('click', { ctrlKey: true }))

      expect(service.selection.getValue()).toContain(items[0])

      service[Symbol.dispose]()
    })

    it('should remove from selection on Ctrl+Click when already selected', () => {
      const { service, items } = createTestService()
      service.selection.setValue([items[0]])

      service.handleItemClick(items[0], new MouseEvent('click', { ctrlKey: true }))

      expect(service.selection.getValue()).not.toContain(items[0])

      service[Symbol.dispose]()
    })

    it('should select range on Shift+Click', () => {
      const { service, items } = createTestService()
      service.focusedItem.setValue(items[0])

      service.handleItemClick(items[2], new MouseEvent('click', { shiftKey: true }))

      const selection = service.selection.getValue()
      expect(selection).toContain(items[0])
      expect(selection).toContain(items[1])
      expect(selection).toContain(items[2])

      service[Symbol.dispose]()
    })

    it('should select range backwards on Shift+Click', () => {
      const { service, items } = createTestService()
      service.focusedItem.setValue(items[2])

      service.handleItemClick(items[0], new MouseEvent('click', { shiftKey: true }))

      const selection = service.selection.getValue()
      expect(selection).toContain(items[0])
      expect(selection).toContain(items[1])
      expect(selection).toContain(items[2])

      service[Symbol.dispose]()
    })
  })

  describe('handleItemDoubleClick', () => {
    it('should call onItemActivate on double-click', () => {
      const onItemActivate = vi.fn()
      const { service, items } = createTestService({ onItemActivate })

      service.handleItemDoubleClick(items[0])

      expect(onItemActivate).toHaveBeenCalledWith(items[0])

      service[Symbol.dispose]()
    })

    it('should not throw when onItemActivate is not set', () => {
      const { service, items } = createTestService()

      expect(() => service.handleItemDoubleClick(items[0])).not.toThrow()

      service[Symbol.dispose]()
    })
  })

  describe('dispose', () => {
    it('should dispose all observables', () => {
      const { service } = createTestService()

      expect(() => service[Symbol.dispose]()).not.toThrow()
    })
  })
})
