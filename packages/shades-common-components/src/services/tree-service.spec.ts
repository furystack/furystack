import { using } from '@furystack/utils'
import { describe, expect, it } from 'vitest'
import { TreeService } from './tree-service.js'

type TestNode = { id: number; name: string; children?: TestNode[] }

const getChildren = (node: TestNode): TestNode[] => node.children ?? []

describe('TreeService', () => {
  const createTreeData = (): TestNode[] => [
    {
      id: 1,
      name: 'Root 1',
      children: [
        {
          id: 11,
          name: 'Child 1-1',
          children: [
            { id: 111, name: 'Leaf 1-1-1' },
            { id: 112, name: 'Leaf 1-1-2' },
          ],
        },
        { id: 12, name: 'Child 1-2' },
      ],
    },
    { id: 2, name: 'Root 2' },
    {
      id: 3,
      name: 'Root 3',
      children: [{ id: 31, name: 'Child 3-1' }],
    },
  ]

  const createTestService = () => {
    const rootItems = createTreeData()
    const service = new TreeService<TestNode>({
      getChildren,
    })
    service.rootItems.setValue(rootItems)
    service.updateFlattenedNodes()
    return { service, rootItems }
  }

  describe('flattenedNodes', () => {
    it('should flatten only root items when none are expanded', () => {
      const { service, rootItems } = createTestService()
      using(service, () => {
        const flattened = service.flattenedNodes.getValue()
        expect(flattened.length).toBe(3)
        expect(flattened[0].item).toBe(rootItems[0])
        expect(flattened[0].level).toBe(0)
        expect(flattened[0].hasChildren).toBe(true)
        expect(flattened[0].isExpanded).toBe(false)
        expect(flattened[1].item).toBe(rootItems[1])
        expect(flattened[1].hasChildren).toBe(false)
        expect(flattened[2].item).toBe(rootItems[2])
      })
    })

    it('should flatten children when a node is expanded', () => {
      const { service, rootItems } = createTestService()
      using(service, () => {
        service.expand(rootItems[0])

        const flattened = service.flattenedNodes.getValue()
        expect(flattened.length).toBe(5)
        expect(flattened[0].item).toBe(rootItems[0])
        expect(flattened[0].isExpanded).toBe(true)
        expect(flattened[1].item).toBe(rootItems[0].children![0])
        expect(flattened[1].level).toBe(1)
        expect(flattened[2].item).toBe(rootItems[0].children![1])
        expect(flattened[2].level).toBe(1)
        expect(flattened[3].item).toBe(rootItems[1])
        expect(flattened[4].item).toBe(rootItems[2])
      })
    })

    it('should flatten deeply nested children', () => {
      const { service, rootItems } = createTestService()
      using(service, () => {
        service.expand(rootItems[0])
        service.expand(rootItems[0].children![0])

        const flattened = service.flattenedNodes.getValue()
        expect(flattened.length).toBe(7)
        expect(flattened[2].item.id).toBe(111)
        expect(flattened[2].level).toBe(2)
        expect(flattened[3].item.id).toBe(112)
        expect(flattened[3].level).toBe(2)
      })
    })

    it('should sync items with flattened nodes', () => {
      const { service, rootItems } = createTestService()
      using(service, () => {
        service.expand(rootItems[0])

        const items = service.items.getValue()
        const flattened = service.flattenedNodes.getValue()

        expect(items.length).toBe(flattened.length)
        for (let i = 0; i < items.length; i++) {
          expect(items[i]).toBe(flattened[i].item)
        }
      })
    })
  })

  describe('expand/collapse', () => {
    it('should expand a node', () => {
      const { service, rootItems } = createTestService()
      using(service, () => {
        service.expand(rootItems[0])

        expect(service.isExpanded(rootItems[0])).toBe(true)
      })
    })

    it('should collapse a node', () => {
      const { service, rootItems } = createTestService()
      using(service, () => {
        service.expand(rootItems[0])
        service.collapse(rootItems[0])

        expect(service.isExpanded(rootItems[0])).toBe(false)
      })
    })

    it('should toggle expand on a collapsed node with children', () => {
      const { service, rootItems } = createTestService()
      using(service, () => {
        service.toggleExpanded(rootItems[0])

        expect(service.isExpanded(rootItems[0])).toBe(true)
      })
    })

    it('should toggle collapse on an expanded node', () => {
      const { service, rootItems } = createTestService()
      using(service, () => {
        service.expand(rootItems[0])
        service.toggleExpanded(rootItems[0])

        expect(service.isExpanded(rootItems[0])).toBe(false)
      })
    })

    it('should not expand a leaf node', () => {
      const { service, rootItems } = createTestService()
      using(service, () => {
        service.toggleExpanded(rootItems[1])

        expect(service.isExpanded(rootItems[1])).toBe(false)
      })
    })

    it('should hide children when collapsing a node', () => {
      const { service, rootItems } = createTestService()
      using(service, () => {
        service.expand(rootItems[0])
        expect(service.flattenedNodes.getValue().length).toBe(5)

        service.collapse(rootItems[0])
        expect(service.flattenedNodes.getValue().length).toBe(3)
      })
    })
  })

  describe('getParent', () => {
    it('should return undefined for root items', () => {
      const { service, rootItems } = createTestService()
      using(service, () => {
        expect(service.getParent(rootItems[0])).toBeUndefined()
        expect(service.getParent(rootItems[1])).toBeUndefined()
      })
    })

    it('should return the parent of a child node', () => {
      const { service, rootItems } = createTestService()
      using(service, () => {
        const parent = service.getParent(rootItems[0].children![0])
        expect(parent).toBe(rootItems[0])
      })
    })

    it('should return the parent of a deeply nested node', () => {
      const { service, rootItems } = createTestService()
      using(service, () => {
        const parent = service.getParent(rootItems[0].children![0].children![0])
        expect(parent).toBe(rootItems[0].children![0])
      })
    })
  })

  describe('getNodeInfo', () => {
    it('should return node info for a visible item', () => {
      const { service, rootItems } = createTestService()
      using(service, () => {
        const info = service.getNodeInfo(rootItems[0])
        expect(info).toBeDefined()
        expect(info?.level).toBe(0)
        expect(info?.hasChildren).toBe(true)
        expect(info?.isExpanded).toBe(false)
      })
    })

    it('should return undefined for a hidden item', () => {
      const { service, rootItems } = createTestService()
      using(service, () => {
        const info = service.getNodeInfo(rootItems[0].children![0])
        expect(info).toBeUndefined()
      })
    })
  })

  describe('handleKeyDown - tree navigation', () => {
    it('should expand a collapsed node on ArrowRight', () => {
      const { service, rootItems } = createTestService()
      using(service, () => {
        service.hasFocus.setValue(true)
        service.focusedItem.setValue(rootItems[0])

        service.handleKeyDown(new KeyboardEvent('keydown', { key: 'ArrowRight' }))

        expect(service.isExpanded(rootItems[0])).toBe(true)
      })
    })

    it('should move focus to first child on ArrowRight when already expanded', () => {
      const { service, rootItems } = createTestService()
      using(service, () => {
        service.hasFocus.setValue(true)
        service.expand(rootItems[0])
        service.focusedItem.setValue(rootItems[0])

        service.handleKeyDown(new KeyboardEvent('keydown', { key: 'ArrowRight' }))

        expect(service.focusedItem.getValue()).toBe(rootItems[0].children![0])
      })
    })

    it('should do nothing on ArrowRight on a leaf node', () => {
      const { service, rootItems } = createTestService()
      using(service, () => {
        service.hasFocus.setValue(true)
        service.focusedItem.setValue(rootItems[1])

        service.handleKeyDown(new KeyboardEvent('keydown', { key: 'ArrowRight' }))

        expect(service.focusedItem.getValue()).toBe(rootItems[1])
      })
    })

    it('should collapse an expanded node on ArrowLeft', () => {
      const { service, rootItems } = createTestService()
      using(service, () => {
        service.hasFocus.setValue(true)
        service.expand(rootItems[0])
        service.focusedItem.setValue(rootItems[0])

        service.handleKeyDown(new KeyboardEvent('keydown', { key: 'ArrowLeft' }))

        expect(service.isExpanded(rootItems[0])).toBe(false)
      })
    })

    it('should move focus to parent on ArrowLeft when node is collapsed', () => {
      const { service, rootItems } = createTestService()
      using(service, () => {
        service.hasFocus.setValue(true)
        service.expand(rootItems[0])
        service.focusedItem.setValue(rootItems[0].children![0])

        service.handleKeyDown(new KeyboardEvent('keydown', { key: 'ArrowLeft' }))

        expect(service.focusedItem.getValue()).toBe(rootItems[0])
      })
    })

    it('should do nothing on ArrowLeft on a root node that is collapsed', () => {
      const { service, rootItems } = createTestService()
      using(service, () => {
        service.hasFocus.setValue(true)
        service.focusedItem.setValue(rootItems[1])

        service.handleKeyDown(new KeyboardEvent('keydown', { key: 'ArrowLeft' }))

        expect(service.focusedItem.getValue()).toBe(rootItems[1])
      })
    })

    it('should not handle keys when not focused', () => {
      const { service, rootItems } = createTestService()
      using(service, () => {
        service.hasFocus.setValue(false)
        service.focusedItem.setValue(rootItems[0])

        service.handleKeyDown(new KeyboardEvent('keydown', { key: 'ArrowRight' }))

        expect(service.isExpanded(rootItems[0])).toBe(false)
      })
    })
  })

  describe('inherited ListService keyboard navigation', () => {
    it('should handle ArrowDown to move focus to next visible item', () => {
      const { service, rootItems } = createTestService()
      using(service, () => {
        service.hasFocus.setValue(true)
        service.focusedItem.setValue(rootItems[0])

        service.handleKeyDown(new KeyboardEvent('keydown', { key: 'ArrowDown' }))

        expect(service.focusedItem.getValue()).toBe(rootItems[1])
      })
    })

    it('should handle ArrowUp to move focus to previous visible item', () => {
      const { service, rootItems } = createTestService()
      using(service, () => {
        service.hasFocus.setValue(true)
        service.focusedItem.setValue(rootItems[1])

        service.handleKeyDown(new KeyboardEvent('keydown', { key: 'ArrowUp' }))

        expect(service.focusedItem.getValue()).toBe(rootItems[0])
      })
    })

    it('should handle Home to move focus to first item', () => {
      const { service, rootItems } = createTestService()
      using(service, () => {
        service.hasFocus.setValue(true)
        service.focusedItem.setValue(rootItems[2])

        service.handleKeyDown(new KeyboardEvent('keydown', { key: 'Home' }))

        expect(service.focusedItem.getValue()).toBe(rootItems[0])
      })
    })

    it('should handle End to move focus to last item', () => {
      const { service, rootItems } = createTestService()
      using(service, () => {
        service.hasFocus.setValue(true)
        service.focusedItem.setValue(rootItems[0])

        service.handleKeyDown(new KeyboardEvent('keydown', { key: 'End' }))

        expect(service.focusedItem.getValue()).toBe(rootItems[2])
      })
    })

    it('should handle Space to toggle selection of focused item', () => {
      const { service, rootItems } = createTestService()
      using(service, () => {
        service.hasFocus.setValue(true)
        service.focusedItem.setValue(rootItems[0])

        service.handleKeyDown(new KeyboardEvent('keydown', { key: ' ' }))
        expect(service.selection.getValue()).toContain(rootItems[0])

        service.handleKeyDown(new KeyboardEvent('keydown', { key: ' ' }))
        expect(service.selection.getValue()).not.toContain(rootItems[0])
      })
    })

    it('should handle Escape to clear selection and search term', () => {
      const { service, rootItems } = createTestService()
      using(service, () => {
        service.hasFocus.setValue(true)
        service.selection.setValue([rootItems[0]])
        service.searchTerm.setValue('test')

        service.handleKeyDown(new KeyboardEvent('keydown', { key: 'Escape' }))

        expect(service.selection.getValue()).toEqual([])
        expect(service.searchTerm.getValue()).toBe('')
      })
    })
  })

  describe('handleItemDoubleClick', () => {
    it('should toggle expansion on double-click of a node with children', () => {
      const { service, rootItems } = createTestService()
      using(service, () => {
        service.handleItemDoubleClick(rootItems[0])
        expect(service.isExpanded(rootItems[0])).toBe(true)

        service.handleItemDoubleClick(rootItems[0])
        expect(service.isExpanded(rootItems[0])).toBe(false)
      })
    })

    it('should not expand on double-click of a leaf node', () => {
      const { service, rootItems } = createTestService()
      using(service, () => {
        service.handleItemDoubleClick(rootItems[1])

        expect(service.isExpanded(rootItems[1])).toBe(false)
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
