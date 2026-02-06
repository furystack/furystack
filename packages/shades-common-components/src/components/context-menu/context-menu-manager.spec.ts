import { describe, expect, it, vi } from 'vitest'
import type { ContextMenuItem } from './context-menu-manager.js'
import { ContextMenuManager } from './context-menu-manager.js'

type TestData = { id: number; name: string }

describe('ContextMenuManager', () => {
  const createTestItems = (): Array<ContextMenuItem<TestData>> => [
    { type: 'item', data: { id: 1, name: 'Cut' }, label: 'Cut' },
    { type: 'item', data: { id: 2, name: 'Copy' }, label: 'Copy' },
    { type: 'separator' },
    { type: 'item', data: { id: 3, name: 'Paste' }, label: 'Paste' },
    { type: 'item', data: { id: 4, name: 'Delete' }, label: 'Delete', disabled: true },
  ]

  describe('getNavigableIndices', () => {
    it('should return indices of non-separator, non-disabled items', () => {
      const manager = new ContextMenuManager<TestData>()
      manager.items.setValue(createTestItems())

      const indices = manager.getNavigableIndices()

      expect(indices).toEqual([0, 1, 3])

      manager[Symbol.dispose]()
    })

    it('should return empty array when there are no navigable items', () => {
      const manager = new ContextMenuManager<TestData>()
      manager.items.setValue([
        { type: 'separator' },
        { type: 'item', data: { id: 1, name: 'Disabled' }, label: 'Disabled', disabled: true },
      ])

      const indices = manager.getNavigableIndices()

      expect(indices).toEqual([])

      manager[Symbol.dispose]()
    })

    it('should return empty array for empty items', () => {
      const manager = new ContextMenuManager<TestData>()

      const indices = manager.getNavigableIndices()

      expect(indices).toEqual([])

      manager[Symbol.dispose]()
    })
  })

  describe('open', () => {
    it('should set isOpened to true', () => {
      const manager = new ContextMenuManager<TestData>()

      manager.open({ items: createTestItems(), position: { x: 100, y: 200 } })

      expect(manager.isOpened.getValue()).toBe(true)

      manager[Symbol.dispose]()
    })

    it('should set items when provided', () => {
      const manager = new ContextMenuManager<TestData>()
      const items = createTestItems()

      manager.open({ items, position: { x: 0, y: 0 } })

      expect(manager.items.getValue()).toEqual(items)

      manager[Symbol.dispose]()
    })

    it('should set position when provided', () => {
      const manager = new ContextMenuManager<TestData>()

      manager.open({ items: createTestItems(), position: { x: 150, y: 250 } })

      expect(manager.position.getValue()).toEqual({ x: 150, y: 250 })

      manager[Symbol.dispose]()
    })

    it('should focus the first navigable item', () => {
      const manager = new ContextMenuManager<TestData>()

      manager.open({ items: createTestItems(), position: { x: 0, y: 0 } })

      expect(manager.focusedIndex.getValue()).toBe(0)

      manager[Symbol.dispose]()
    })

    it('should focus the first navigable item when first items are separators', () => {
      const manager = new ContextMenuManager<TestData>()

      manager.open({
        items: [{ type: 'separator' }, { type: 'item', data: { id: 1, name: 'First' }, label: 'First' }],
        position: { x: 0, y: 0 },
      })

      expect(manager.focusedIndex.getValue()).toBe(1)

      manager[Symbol.dispose]()
    })

    it('should set focusedIndex to -1 when no navigable items exist', () => {
      const manager = new ContextMenuManager<TestData>()

      manager.open({
        items: [{ type: 'separator' }],
        position: { x: 0, y: 0 },
      })

      expect(manager.focusedIndex.getValue()).toBe(-1)

      manager[Symbol.dispose]()
    })

    it('should keep existing items when items option is not provided', () => {
      const manager = new ContextMenuManager<TestData>()
      const items = createTestItems()
      manager.items.setValue(items)

      manager.open({ position: { x: 50, y: 50 } })

      expect(manager.items.getValue()).toEqual(items)
      expect(manager.isOpened.getValue()).toBe(true)

      manager[Symbol.dispose]()
    })

    it('should keep existing position when position option is not provided', () => {
      const manager = new ContextMenuManager<TestData>()
      manager.position.setValue({ x: 100, y: 200 })
      manager.items.setValue(createTestItems())

      manager.open()

      expect(manager.position.getValue()).toEqual({ x: 100, y: 200 })
      expect(manager.isOpened.getValue()).toBe(true)

      manager[Symbol.dispose]()
    })
  })

  describe('close', () => {
    it('should set isOpened to false', () => {
      const manager = new ContextMenuManager<TestData>()
      manager.open({ items: createTestItems(), position: { x: 0, y: 0 } })

      manager.close()

      expect(manager.isOpened.getValue()).toBe(false)

      manager[Symbol.dispose]()
    })

    it('should reset focusedIndex to -1', () => {
      const manager = new ContextMenuManager<TestData>()
      manager.open({ items: createTestItems(), position: { x: 0, y: 0 } })

      manager.close()

      expect(manager.focusedIndex.getValue()).toBe(-1)

      manager[Symbol.dispose]()
    })
  })

  describe('selectItem', () => {
    it('should emit onSelectItem event with the item data', () => {
      const manager = new ContextMenuManager<TestData>()
      const items = createTestItems()
      manager.open({ items, position: { x: 0, y: 0 } })

      const onSelect = vi.fn()
      const subscription = manager.subscribe('onSelectItem', onSelect)

      manager.selectItem(1)

      expect(onSelect).toHaveBeenCalledWith({ id: 2, name: 'Copy' })

      subscription[Symbol.dispose]()
      manager[Symbol.dispose]()
    })

    it('should close the menu after selection', () => {
      const manager = new ContextMenuManager<TestData>()
      manager.open({ items: createTestItems(), position: { x: 0, y: 0 } })

      manager.selectItem(0)

      expect(manager.isOpened.getValue()).toBe(false)

      manager[Symbol.dispose]()
    })

    it('should use the focused index when no index is provided', () => {
      const manager = new ContextMenuManager<TestData>()
      const items = createTestItems()
      manager.open({ items, position: { x: 0, y: 0 } })
      manager.focusedIndex.setValue(3)

      const onSelect = vi.fn()
      const subscription = manager.subscribe('onSelectItem', onSelect)

      manager.selectItem()

      expect(onSelect).toHaveBeenCalledWith({ id: 3, name: 'Paste' })

      subscription[Symbol.dispose]()
      manager[Symbol.dispose]()
    })

    it('should not emit when selecting a separator', () => {
      const manager = new ContextMenuManager<TestData>()
      manager.open({ items: createTestItems(), position: { x: 0, y: 0 } })

      const onSelect = vi.fn()
      const subscription = manager.subscribe('onSelectItem', onSelect)

      manager.selectItem(2)

      expect(onSelect).not.toHaveBeenCalled()

      subscription[Symbol.dispose]()
      manager[Symbol.dispose]()
    })

    it('should not emit when selecting a disabled item', () => {
      const manager = new ContextMenuManager<TestData>()
      manager.open({ items: createTestItems(), position: { x: 0, y: 0 } })

      const onSelect = vi.fn()
      const subscription = manager.subscribe('onSelectItem', onSelect)

      manager.selectItem(4)

      expect(onSelect).not.toHaveBeenCalled()

      subscription[Symbol.dispose]()
      manager[Symbol.dispose]()
    })

    it('should not emit when item has no data', () => {
      const manager = new ContextMenuManager<TestData>()
      manager.open({
        items: [{ type: 'item', label: 'No data' }],
        position: { x: 0, y: 0 },
      })

      const onSelect = vi.fn()
      const subscription = manager.subscribe('onSelectItem', onSelect)

      manager.selectItem(0)

      expect(onSelect).not.toHaveBeenCalled()

      subscription[Symbol.dispose]()
      manager[Symbol.dispose]()
    })
  })

  describe('handleKeyDown', () => {
    it('should not handle keyboard events when menu is closed', () => {
      const manager = new ContextMenuManager<TestData>()
      manager.items.setValue(createTestItems())
      manager.focusedIndex.setValue(0)

      manager.handleKeyDown(new KeyboardEvent('keydown', { key: 'ArrowDown' }))

      expect(manager.focusedIndex.getValue()).toBe(0)

      manager[Symbol.dispose]()
    })

    describe('ArrowDown', () => {
      it('should move focus to the next navigable item', () => {
        const manager = new ContextMenuManager<TestData>()
        manager.open({ items: createTestItems(), position: { x: 0, y: 0 } })
        manager.focusedIndex.setValue(0)

        manager.handleKeyDown(new KeyboardEvent('keydown', { key: 'ArrowDown' }))

        expect(manager.focusedIndex.getValue()).toBe(1)

        manager[Symbol.dispose]()
      })

      it('should skip separators', () => {
        const manager = new ContextMenuManager<TestData>()
        manager.open({ items: createTestItems(), position: { x: 0, y: 0 } })
        manager.focusedIndex.setValue(1)

        manager.handleKeyDown(new KeyboardEvent('keydown', { key: 'ArrowDown' }))

        expect(manager.focusedIndex.getValue()).toBe(3)

        manager[Symbol.dispose]()
      })

      it('should skip disabled items', () => {
        const manager = new ContextMenuManager<TestData>()
        manager.open({
          items: [
            { type: 'item', data: { id: 1, name: 'A' }, label: 'A' },
            { type: 'item', data: { id: 2, name: 'B' }, label: 'B', disabled: true },
            { type: 'item', data: { id: 3, name: 'C' }, label: 'C' },
          ],
          position: { x: 0, y: 0 },
        })
        manager.focusedIndex.setValue(0)

        manager.handleKeyDown(new KeyboardEvent('keydown', { key: 'ArrowDown' }))

        expect(manager.focusedIndex.getValue()).toBe(2)

        manager[Symbol.dispose]()
      })

      it('should wrap to first item when at the end', () => {
        const manager = new ContextMenuManager<TestData>()
        manager.open({ items: createTestItems(), position: { x: 0, y: 0 } })
        manager.focusedIndex.setValue(3)

        manager.handleKeyDown(new KeyboardEvent('keydown', { key: 'ArrowDown' }))

        expect(manager.focusedIndex.getValue()).toBe(0)

        manager[Symbol.dispose]()
      })
    })

    describe('ArrowUp', () => {
      it('should move focus to the previous navigable item', () => {
        const manager = new ContextMenuManager<TestData>()
        manager.open({ items: createTestItems(), position: { x: 0, y: 0 } })
        manager.focusedIndex.setValue(1)

        manager.handleKeyDown(new KeyboardEvent('keydown', { key: 'ArrowUp' }))

        expect(manager.focusedIndex.getValue()).toBe(0)

        manager[Symbol.dispose]()
      })

      it('should skip separators', () => {
        const manager = new ContextMenuManager<TestData>()
        manager.open({ items: createTestItems(), position: { x: 0, y: 0 } })
        manager.focusedIndex.setValue(3)

        manager.handleKeyDown(new KeyboardEvent('keydown', { key: 'ArrowUp' }))

        expect(manager.focusedIndex.getValue()).toBe(1)

        manager[Symbol.dispose]()
      })

      it('should wrap to last navigable item when at the beginning', () => {
        const manager = new ContextMenuManager<TestData>()
        manager.open({ items: createTestItems(), position: { x: 0, y: 0 } })
        manager.focusedIndex.setValue(0)

        manager.handleKeyDown(new KeyboardEvent('keydown', { key: 'ArrowUp' }))

        expect(manager.focusedIndex.getValue()).toBe(3)

        manager[Symbol.dispose]()
      })
    })

    describe('Home', () => {
      it('should move focus to the first navigable item', () => {
        const manager = new ContextMenuManager<TestData>()
        manager.open({ items: createTestItems(), position: { x: 0, y: 0 } })
        manager.focusedIndex.setValue(3)

        manager.handleKeyDown(new KeyboardEvent('keydown', { key: 'Home' }))

        expect(manager.focusedIndex.getValue()).toBe(0)

        manager[Symbol.dispose]()
      })
    })

    describe('End', () => {
      it('should move focus to the last navigable item', () => {
        const manager = new ContextMenuManager<TestData>()
        manager.open({ items: createTestItems(), position: { x: 0, y: 0 } })
        manager.focusedIndex.setValue(0)

        manager.handleKeyDown(new KeyboardEvent('keydown', { key: 'End' }))

        expect(manager.focusedIndex.getValue()).toBe(3)

        manager[Symbol.dispose]()
      })
    })

    describe('Enter', () => {
      it('should select the focused item', () => {
        const manager = new ContextMenuManager<TestData>()
        manager.open({ items: createTestItems(), position: { x: 0, y: 0 } })

        const onSelect = vi.fn()
        const subscription = manager.subscribe('onSelectItem', onSelect)

        manager.focusedIndex.setValue(1)
        manager.handleKeyDown(new KeyboardEvent('keydown', { key: 'Enter' }))

        expect(onSelect).toHaveBeenCalledWith({ id: 2, name: 'Copy' })

        subscription[Symbol.dispose]()
        manager[Symbol.dispose]()
      })

      it('should not select when no item is focused', () => {
        const manager = new ContextMenuManager<TestData>()
        manager.open({ items: createTestItems(), position: { x: 0, y: 0 } })
        manager.focusedIndex.setValue(-1)

        const onSelect = vi.fn()
        const subscription = manager.subscribe('onSelectItem', onSelect)

        manager.handleKeyDown(new KeyboardEvent('keydown', { key: 'Enter' }))

        expect(onSelect).not.toHaveBeenCalled()

        subscription[Symbol.dispose]()
        manager[Symbol.dispose]()
      })

      it('should close the menu after selection', () => {
        const manager = new ContextMenuManager<TestData>()
        manager.open({ items: createTestItems(), position: { x: 0, y: 0 } })
        manager.focusedIndex.setValue(0)

        manager.handleKeyDown(new KeyboardEvent('keydown', { key: 'Enter' }))

        expect(manager.isOpened.getValue()).toBe(false)

        manager[Symbol.dispose]()
      })
    })

    describe('Escape', () => {
      it('should close the menu', () => {
        const manager = new ContextMenuManager<TestData>()
        manager.open({ items: createTestItems(), position: { x: 0, y: 0 } })

        manager.handleKeyDown(new KeyboardEvent('keydown', { key: 'Escape' }))

        expect(manager.isOpened.getValue()).toBe(false)
        expect(manager.focusedIndex.getValue()).toBe(-1)

        manager[Symbol.dispose]()
      })
    })
  })

  describe('dispose', () => {
    it('should dispose all observables without throwing', () => {
      const manager = new ContextMenuManager<TestData>()

      expect(() => manager[Symbol.dispose]()).not.toThrow()
    })

    it('should dispose after open/close cycle', () => {
      const manager = new ContextMenuManager<TestData>()
      manager.open({ items: createTestItems(), position: { x: 0, y: 0 } })
      manager.close()

      expect(() => manager[Symbol.dispose]()).not.toThrow()
    })
  })
})
