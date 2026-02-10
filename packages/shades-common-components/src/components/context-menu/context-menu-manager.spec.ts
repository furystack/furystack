import { using } from '@furystack/utils'
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
      using(new ContextMenuManager<TestData>(), (manager) => {
        manager.items.setValue(createTestItems())

        const indices = manager.getNavigableIndices()

        expect(indices).toEqual([0, 1, 3])
      })
    })

    it('should return empty array when there are no navigable items', () => {
      using(new ContextMenuManager<TestData>(), (manager) => {
        manager.items.setValue([
          { type: 'separator' },
          { type: 'item', data: { id: 1, name: 'Disabled' }, label: 'Disabled', disabled: true },
        ])

        const indices = manager.getNavigableIndices()

        expect(indices).toEqual([])
      })
    })

    it('should return empty array for empty items', () => {
      using(new ContextMenuManager<TestData>(), (manager) => {
        const indices = manager.getNavigableIndices()

        expect(indices).toEqual([])
      })
    })
  })

  describe('open', () => {
    it('should set isOpened to true', () => {
      using(new ContextMenuManager<TestData>(), (manager) => {
        manager.open({ items: createTestItems(), position: { x: 100, y: 200 } })

        expect(manager.isOpened.getValue()).toBe(true)
      })
    })

    it('should set items when provided', () => {
      using(new ContextMenuManager<TestData>(), (manager) => {
        const items = createTestItems()

        manager.open({ items, position: { x: 0, y: 0 } })

        expect(manager.items.getValue()).toEqual(items)
      })
    })

    it('should set position when provided', () => {
      using(new ContextMenuManager<TestData>(), (manager) => {
        manager.open({ items: createTestItems(), position: { x: 150, y: 250 } })

        expect(manager.position.getValue()).toEqual({ x: 150, y: 250 })
      })
    })

    it('should focus the first navigable item', () => {
      using(new ContextMenuManager<TestData>(), (manager) => {
        manager.open({ items: createTestItems(), position: { x: 0, y: 0 } })

        expect(manager.focusedIndex.getValue()).toBe(0)
      })
    })

    it('should focus the first navigable item when first items are separators', () => {
      using(new ContextMenuManager<TestData>(), (manager) => {
        manager.open({
          items: [{ type: 'separator' }, { type: 'item', data: { id: 1, name: 'First' }, label: 'First' }],
          position: { x: 0, y: 0 },
        })

        expect(manager.focusedIndex.getValue()).toBe(1)
      })
    })

    it('should set focusedIndex to -1 when no navigable items exist', () => {
      using(new ContextMenuManager<TestData>(), (manager) => {
        manager.open({
          items: [{ type: 'separator' }],
          position: { x: 0, y: 0 },
        })

        expect(manager.focusedIndex.getValue()).toBe(-1)
      })
    })

    it('should keep existing items when items option is not provided', () => {
      using(new ContextMenuManager<TestData>(), (manager) => {
        const items = createTestItems()
        manager.items.setValue(items)

        manager.open({ position: { x: 50, y: 50 } })

        expect(manager.items.getValue()).toEqual(items)
        expect(manager.isOpened.getValue()).toBe(true)
      })
    })

    it('should keep existing position when position option is not provided', () => {
      using(new ContextMenuManager<TestData>(), (manager) => {
        manager.position.setValue({ x: 100, y: 200 })
        manager.items.setValue(createTestItems())

        manager.open()

        expect(manager.position.getValue()).toEqual({ x: 100, y: 200 })
        expect(manager.isOpened.getValue()).toBe(true)
      })
    })
  })

  describe('close', () => {
    it('should set isOpened to false', () => {
      using(new ContextMenuManager<TestData>(), (manager) => {
        manager.open({ items: createTestItems(), position: { x: 0, y: 0 } })

        manager.close()

        expect(manager.isOpened.getValue()).toBe(false)
      })
    })

    it('should reset focusedIndex to -1', () => {
      using(new ContextMenuManager<TestData>(), (manager) => {
        manager.open({ items: createTestItems(), position: { x: 0, y: 0 } })

        manager.close()

        expect(manager.focusedIndex.getValue()).toBe(-1)
      })
    })
  })

  describe('selectItem', () => {
    it('should emit onSelectItem event with the item data', () => {
      using(new ContextMenuManager<TestData>(), (manager) => {
        const items = createTestItems()
        manager.open({ items, position: { x: 0, y: 0 } })

        const onSelect = vi.fn()
        manager.subscribe('onSelectItem', onSelect)

        manager.selectItem(1)

        expect(onSelect).toHaveBeenCalledWith({ id: 2, name: 'Copy' })
      })
    })

    it('should close the menu after selection', () => {
      using(new ContextMenuManager<TestData>(), (manager) => {
        manager.open({ items: createTestItems(), position: { x: 0, y: 0 } })

        manager.selectItem(0)

        expect(manager.isOpened.getValue()).toBe(false)
      })
    })

    it('should use the focused index when no index is provided', () => {
      using(new ContextMenuManager<TestData>(), (manager) => {
        const items = createTestItems()
        manager.open({ items, position: { x: 0, y: 0 } })
        manager.focusedIndex.setValue(3)

        const onSelect = vi.fn()
        manager.subscribe('onSelectItem', onSelect)

        manager.selectItem()

        expect(onSelect).toHaveBeenCalledWith({ id: 3, name: 'Paste' })
      })
    })

    it('should not emit when selecting a separator', () => {
      using(new ContextMenuManager<TestData>(), (manager) => {
        manager.open({ items: createTestItems(), position: { x: 0, y: 0 } })

        const onSelect = vi.fn()
        manager.subscribe('onSelectItem', onSelect)

        manager.selectItem(2)

        expect(onSelect).not.toHaveBeenCalled()
      })
    })

    it('should not emit when selecting a disabled item', () => {
      using(new ContextMenuManager<TestData>(), (manager) => {
        manager.open({ items: createTestItems(), position: { x: 0, y: 0 } })

        const onSelect = vi.fn()
        manager.subscribe('onSelectItem', onSelect)

        manager.selectItem(4)

        expect(onSelect).not.toHaveBeenCalled()
      })
    })

    it('should not emit when item has no data', () => {
      using(new ContextMenuManager<TestData>(), (manager) => {
        manager.open({
          items: [{ type: 'item', label: 'No data' }],
          position: { x: 0, y: 0 },
        })

        const onSelect = vi.fn()
        manager.subscribe('onSelectItem', onSelect)

        manager.selectItem(0)

        expect(onSelect).not.toHaveBeenCalled()
      })
    })
  })

  describe('handleKeyDown', () => {
    it('should not handle keyboard events when menu is closed', () => {
      using(new ContextMenuManager<TestData>(), (manager) => {
        manager.items.setValue(createTestItems())
        manager.focusedIndex.setValue(0)

        manager.handleKeyDown(new KeyboardEvent('keydown', { key: 'ArrowDown' }))

        expect(manager.focusedIndex.getValue()).toBe(0)
      })
    })

    describe('ArrowDown', () => {
      it('should move focus to the next navigable item', () => {
        using(new ContextMenuManager<TestData>(), (manager) => {
          manager.open({ items: createTestItems(), position: { x: 0, y: 0 } })
          manager.focusedIndex.setValue(0)

          manager.handleKeyDown(new KeyboardEvent('keydown', { key: 'ArrowDown' }))

          expect(manager.focusedIndex.getValue()).toBe(1)
        })
      })

      it('should skip separators', () => {
        using(new ContextMenuManager<TestData>(), (manager) => {
          manager.open({ items: createTestItems(), position: { x: 0, y: 0 } })
          manager.focusedIndex.setValue(1)

          manager.handleKeyDown(new KeyboardEvent('keydown', { key: 'ArrowDown' }))

          expect(manager.focusedIndex.getValue()).toBe(3)
        })
      })

      it('should skip disabled items', () => {
        using(new ContextMenuManager<TestData>(), (manager) => {
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
        })
      })

      it('should wrap to first item when at the end', () => {
        using(new ContextMenuManager<TestData>(), (manager) => {
          manager.open({ items: createTestItems(), position: { x: 0, y: 0 } })
          manager.focusedIndex.setValue(3)

          manager.handleKeyDown(new KeyboardEvent('keydown', { key: 'ArrowDown' }))

          expect(manager.focusedIndex.getValue()).toBe(0)
        })
      })
    })

    describe('ArrowUp', () => {
      it('should move focus to the previous navigable item', () => {
        using(new ContextMenuManager<TestData>(), (manager) => {
          manager.open({ items: createTestItems(), position: { x: 0, y: 0 } })
          manager.focusedIndex.setValue(1)

          manager.handleKeyDown(new KeyboardEvent('keydown', { key: 'ArrowUp' }))

          expect(manager.focusedIndex.getValue()).toBe(0)
        })
      })

      it('should skip separators', () => {
        using(new ContextMenuManager<TestData>(), (manager) => {
          manager.open({ items: createTestItems(), position: { x: 0, y: 0 } })
          manager.focusedIndex.setValue(3)

          manager.handleKeyDown(new KeyboardEvent('keydown', { key: 'ArrowUp' }))

          expect(manager.focusedIndex.getValue()).toBe(1)
        })
      })

      it('should wrap to last navigable item when at the beginning', () => {
        using(new ContextMenuManager<TestData>(), (manager) => {
          manager.open({ items: createTestItems(), position: { x: 0, y: 0 } })
          manager.focusedIndex.setValue(0)

          manager.handleKeyDown(new KeyboardEvent('keydown', { key: 'ArrowUp' }))

          expect(manager.focusedIndex.getValue()).toBe(3)
        })
      })
    })

    describe('Home', () => {
      it('should move focus to the first navigable item', () => {
        using(new ContextMenuManager<TestData>(), (manager) => {
          manager.open({ items: createTestItems(), position: { x: 0, y: 0 } })
          manager.focusedIndex.setValue(3)

          manager.handleKeyDown(new KeyboardEvent('keydown', { key: 'Home' }))

          expect(manager.focusedIndex.getValue()).toBe(0)
        })
      })
    })

    describe('End', () => {
      it('should move focus to the last navigable item', () => {
        using(new ContextMenuManager<TestData>(), (manager) => {
          manager.open({ items: createTestItems(), position: { x: 0, y: 0 } })
          manager.focusedIndex.setValue(0)

          manager.handleKeyDown(new KeyboardEvent('keydown', { key: 'End' }))

          expect(manager.focusedIndex.getValue()).toBe(3)
        })
      })
    })

    describe('Enter', () => {
      it('should select the focused item', () => {
        using(new ContextMenuManager<TestData>(), (manager) => {
          manager.open({ items: createTestItems(), position: { x: 0, y: 0 } })

          const onSelect = vi.fn()
          manager.subscribe('onSelectItem', onSelect)

          manager.focusedIndex.setValue(1)
          manager.handleKeyDown(new KeyboardEvent('keydown', { key: 'Enter' }))

          expect(onSelect).toHaveBeenCalledWith({ id: 2, name: 'Copy' })
        })
      })

      it('should not select when no item is focused', () => {
        using(new ContextMenuManager<TestData>(), (manager) => {
          manager.open({ items: createTestItems(), position: { x: 0, y: 0 } })
          manager.focusedIndex.setValue(-1)

          const onSelect = vi.fn()
          manager.subscribe('onSelectItem', onSelect)

          manager.handleKeyDown(new KeyboardEvent('keydown', { key: 'Enter' }))

          expect(onSelect).not.toHaveBeenCalled()
        })
      })

      it('should close the menu after selection', () => {
        using(new ContextMenuManager<TestData>(), (manager) => {
          manager.open({ items: createTestItems(), position: { x: 0, y: 0 } })
          manager.focusedIndex.setValue(0)

          manager.handleKeyDown(new KeyboardEvent('keydown', { key: 'Enter' }))

          expect(manager.isOpened.getValue()).toBe(false)
        })
      })
    })

    describe('Escape', () => {
      it('should close the menu', () => {
        using(new ContextMenuManager<TestData>(), (manager) => {
          manager.open({ items: createTestItems(), position: { x: 0, y: 0 } })

          manager.handleKeyDown(new KeyboardEvent('keydown', { key: 'Escape' }))

          expect(manager.isOpened.getValue()).toBe(false)
          expect(manager.focusedIndex.getValue()).toBe(-1)
        })
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
