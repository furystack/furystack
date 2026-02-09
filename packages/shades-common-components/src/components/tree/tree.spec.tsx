import { Injector } from '@furystack/inject'
import { createComponent, initializeShadeRoot } from '@furystack/shades'
import { sleepAsync, usingAsync } from '@furystack/utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { TreeService } from '../../services/tree-service.js'
import { Tree } from './tree.js'

type TestNode = { id: number; name: string; children?: TestNode[] }

const getChildren = (node: TestNode): TestNode[] => node.children ?? []

describe('Tree', () => {
  beforeEach(() => {
    document.body.innerHTML = '<div id="root"></div>'
  })

  afterEach(() => {
    document.body.innerHTML = ''
  })

  const createTreeData = (): TestNode[] => [
    {
      id: 1,
      name: 'Root 1',
      children: [
        { id: 11, name: 'Child 1-1' },
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
    return new TreeService<TestNode>({
      getChildren,
    })
  }

  describe('rendering', () => {
    it('should render the shade-tree custom element', async () => {
      await usingAsync(new Injector(), async (injector) => {
        const rootElement = document.getElementById('root') as HTMLDivElement
        const treeData = createTreeData()
        const service = createTestService()

        initializeShadeRoot({
          injector,
          rootElement,
          jsxElement: (
            <Tree<TestNode>
              rootItems={treeData}
              treeService={service}
              renderItem={(item) => <span>{item.name}</span>}
            />
          ),
        })

        await sleepAsync(50)

        const tree = document.querySelector('shade-tree')
        expect(tree).not.toBeNull()

        service[Symbol.dispose]()
      })
    })

    it('should render only root items when nothing is expanded', async () => {
      await usingAsync(new Injector(), async (injector) => {
        const rootElement = document.getElementById('root') as HTMLDivElement
        const treeData = createTreeData()
        const service = createTestService()

        initializeShadeRoot({
          injector,
          rootElement,
          jsxElement: (
            <Tree<TestNode>
              rootItems={treeData}
              treeService={service}
              renderItem={(item) => <span>{item.name}</span>}
            />
          ),
        })

        await sleepAsync(50)

        const tree = document.querySelector('shade-tree')
        const items = tree?.querySelectorAll('shade-tree-item')
        expect(items?.length).toBe(3)

        service[Symbol.dispose]()
      })
    })

    it('should render a tree container with correct role', async () => {
      await usingAsync(new Injector(), async (injector) => {
        const rootElement = document.getElementById('root') as HTMLDivElement
        const treeData = createTreeData()
        const service = createTestService()

        initializeShadeRoot({
          injector,
          rootElement,
          jsxElement: (
            <Tree<TestNode>
              rootItems={treeData}
              treeService={service}
              renderItem={(item) => <span>{item.name}</span>}
            />
          ),
        })

        await sleepAsync(50)

        const tree = document.querySelector('shade-tree')
        const treeContainer = tree?.querySelector('[role="tree"]')
        expect(treeContainer).not.toBeNull()
        expect(treeContainer?.getAttribute('aria-multiselectable')).toBe('true')

        service[Symbol.dispose]()
      })
    })

    it('should render items with role treeitem', async () => {
      await usingAsync(new Injector(), async (injector) => {
        const rootElement = document.getElementById('root') as HTMLDivElement
        const treeData = createTreeData()
        const service = createTestService()

        initializeShadeRoot({
          injector,
          rootElement,
          jsxElement: (
            <Tree<TestNode>
              rootItems={treeData}
              treeService={service}
              renderItem={(item) => <span>{item.name}</span>}
            />
          ),
        })

        await sleepAsync(50)

        const tree = document.querySelector('shade-tree')
        const treeItems = tree?.querySelectorAll('[role="treeitem"]')
        expect(treeItems?.length).toBe(3)

        service[Symbol.dispose]()
      })
    })

    it('should render icon when renderIcon is provided', async () => {
      await usingAsync(new Injector(), async (injector) => {
        const rootElement = document.getElementById('root') as HTMLDivElement
        const treeData = createTreeData()
        const service = createTestService()

        initializeShadeRoot({
          injector,
          rootElement,
          jsxElement: (
            <Tree<TestNode>
              rootItems={treeData}
              treeService={service}
              renderItem={(item) => <span>{item.name}</span>}
              renderIcon={() => <span data-testid="icon">icon</span>}
            />
          ),
        })

        await sleepAsync(50)

        const tree = document.querySelector('shade-tree')
        const icons = tree?.querySelectorAll('[data-testid="icon"]')
        expect(icons?.length).toBe(3)

        service[Symbol.dispose]()
      })
    })

    it('should set data-variant attribute when variant is provided', async () => {
      await usingAsync(new Injector(), async (injector) => {
        const rootElement = document.getElementById('root') as HTMLDivElement
        const treeData = createTreeData()
        const service = createTestService()

        initializeShadeRoot({
          injector,
          rootElement,
          jsxElement: (
            <Tree<TestNode>
              rootItems={treeData}
              treeService={service}
              renderItem={(item) => <span>{item.name}</span>}
              variant="contained"
            />
          ),
        })

        await sleepAsync(50)

        const tree = document.querySelector('shade-tree') as HTMLElement
        expect(tree?.getAttribute('data-variant')).toBe('contained')

        service[Symbol.dispose]()
      })
    })

    it('should set aria-expanded on items with children', async () => {
      await usingAsync(new Injector(), async (injector) => {
        const rootElement = document.getElementById('root') as HTMLDivElement
        const treeData = createTreeData()
        const service = createTestService()

        initializeShadeRoot({
          injector,
          rootElement,
          jsxElement: (
            <Tree<TestNode>
              rootItems={treeData}
              treeService={service}
              renderItem={(item) => <span>{item.name}</span>}
            />
          ),
        })

        await sleepAsync(50)

        const tree = document.querySelector('shade-tree')
        const treeItems = tree?.querySelectorAll('shade-tree-item') as NodeListOf<HTMLElement>
        expect(treeItems[0]?.getAttribute('aria-expanded')).toBe('false')
        expect(treeItems[1]?.getAttribute('aria-expanded')).toBeNull()
        expect(treeItems[2]?.getAttribute('aria-expanded')).toBe('false')

        service[Symbol.dispose]()
      })
    })

    it('should set aria-level on items', async () => {
      await usingAsync(new Injector(), async (injector) => {
        const rootElement = document.getElementById('root') as HTMLDivElement
        const treeData = createTreeData()
        const service = createTestService()

        initializeShadeRoot({
          injector,
          rootElement,
          jsxElement: (
            <Tree<TestNode>
              rootItems={treeData}
              treeService={service}
              renderItem={(item) => <span>{item.name}</span>}
            />
          ),
        })

        await sleepAsync(50)

        const tree = document.querySelector('shade-tree')
        const treeItems = tree?.querySelectorAll('shade-tree-item') as NodeListOf<HTMLElement>
        expect(treeItems[0]?.getAttribute('aria-level')).toBe('1')
        expect(treeItems[1]?.getAttribute('aria-level')).toBe('1')
        expect(treeItems[2]?.getAttribute('aria-level')).toBe('1')

        service[Symbol.dispose]()
      })
    })
  })

  describe('focus management', () => {
    it('should set focus on click', async () => {
      await usingAsync(new Injector(), async (injector) => {
        const rootElement = document.getElementById('root') as HTMLDivElement
        const treeData = createTreeData()
        const service = createTestService()

        expect(service.hasFocus.getValue()).toBe(false)

        initializeShadeRoot({
          injector,
          rootElement,
          jsxElement: (
            <Tree<TestNode>
              rootItems={treeData}
              treeService={service}
              renderItem={(item) => <span>{item.name}</span>}
            />
          ),
        })

        await sleepAsync(50)

        const tree = document.querySelector('shade-tree')
        const wrapper = tree?.querySelector('.shade-tree-wrapper') as HTMLElement
        wrapper?.click()

        expect(service.hasFocus.getValue()).toBe(true)

        service[Symbol.dispose]()
      })
    })

    it('should lose focus on click outside', async () => {
      await usingAsync(new Injector(), async (injector) => {
        const rootElement = document.getElementById('root') as HTMLDivElement
        const treeData = createTreeData()
        const service = createTestService()

        initializeShadeRoot({
          injector,
          rootElement,
          jsxElement: (
            <>
              <div data-testid="outside">Outside</div>
              <Tree<TestNode>
                rootItems={treeData}
                treeService={service}
                renderItem={(item) => <span>{item.name}</span>}
              />
            </>
          ),
        })

        await sleepAsync(50)

        const tree = document.querySelector('shade-tree')
        const wrapper = tree?.querySelector('.shade-tree-wrapper') as HTMLElement
        wrapper?.click()
        expect(service.hasFocus.getValue()).toBe(true)

        const outside = document.querySelector('[data-testid="outside"]') as HTMLElement
        outside?.dispatchEvent(new MouseEvent('click', { bubbles: true }))

        expect(service.hasFocus.getValue()).toBe(false)

        service[Symbol.dispose]()
      })
    })

    it('should set focused item on item click', async () => {
      await usingAsync(new Injector(), async (injector) => {
        const rootElement = document.getElementById('root') as HTMLDivElement
        const treeData = createTreeData()
        const service = createTestService()

        initializeShadeRoot({
          injector,
          rootElement,
          jsxElement: (
            <Tree<TestNode>
              rootItems={treeData}
              treeService={service}
              renderItem={(item) => <span>{item.name}</span>}
            />
          ),
        })

        await sleepAsync(50)

        const tree = document.querySelector('shade-tree')
        const treeItems = tree?.querySelectorAll('shade-tree-item') as NodeListOf<HTMLElement>
        treeItems[1]?.click()

        expect(service.focusedItem.getValue()).toBe(treeData[1])

        service[Symbol.dispose]()
      })
    })

    it('should add focused CSS class to focused item', async () => {
      await usingAsync(new Injector(), async (injector) => {
        const rootElement = document.getElementById('root') as HTMLDivElement
        const treeData = createTreeData()
        const service = createTestService()

        initializeShadeRoot({
          injector,
          rootElement,
          jsxElement: (
            <Tree<TestNode>
              rootItems={treeData}
              treeService={service}
              renderItem={(item) => <span>{item.name}</span>}
            />
          ),
        })

        await sleepAsync(50)

        service.focusedItem.setValue(treeData[1])
        await sleepAsync(10)

        const tree = document.querySelector('shade-tree')
        const treeItems = tree?.querySelectorAll('shade-tree-item') as NodeListOf<HTMLElement>
        expect(treeItems[1]?.hasAttribute('data-focused')).toBe(true)
        expect(treeItems[0]?.hasAttribute('data-focused')).toBe(false)

        service[Symbol.dispose]()
      })
    })
  })

  describe('selection', () => {
    it('should add selected CSS class to selected items', async () => {
      await usingAsync(new Injector(), async (injector) => {
        const rootElement = document.getElementById('root') as HTMLDivElement
        const treeData = createTreeData()
        const service = createTestService()

        initializeShadeRoot({
          injector,
          rootElement,
          jsxElement: (
            <Tree<TestNode>
              rootItems={treeData}
              treeService={service}
              renderItem={(item) => <span>{item.name}</span>}
            />
          ),
        })

        await sleepAsync(50)

        service.selection.setValue([treeData[0], treeData[2]])
        await sleepAsync(10)

        const tree = document.querySelector('shade-tree')
        const treeItems = tree?.querySelectorAll('shade-tree-item') as NodeListOf<HTMLElement>
        expect(treeItems[0]?.hasAttribute('data-selected')).toBe(true)
        expect(treeItems[1]?.hasAttribute('data-selected')).toBe(false)
        expect(treeItems[2]?.hasAttribute('data-selected')).toBe(true)

        service[Symbol.dispose]()
      })
    })

    it('should set aria-selected on selected items', async () => {
      await usingAsync(new Injector(), async (injector) => {
        const rootElement = document.getElementById('root') as HTMLDivElement
        const treeData = createTreeData()
        const service = createTestService()

        initializeShadeRoot({
          injector,
          rootElement,
          jsxElement: (
            <Tree<TestNode>
              rootItems={treeData}
              treeService={service}
              renderItem={(item) => <span>{item.name}</span>}
            />
          ),
        })

        await sleepAsync(50)

        service.selection.setValue([treeData[0]])
        await sleepAsync(10)

        const tree = document.querySelector('shade-tree')
        const treeItems = tree?.querySelectorAll('shade-tree-item') as NodeListOf<HTMLElement>
        expect(treeItems[0]?.getAttribute('aria-selected')).toBe('true')
        expect(treeItems[1]?.getAttribute('aria-selected')).toBe('false')

        service[Symbol.dispose]()
      })
    })

    it('should call onSelectionChange when selection changes', async () => {
      const onSelectionChange = vi.fn()
      await usingAsync(new Injector(), async (injector) => {
        const rootElement = document.getElementById('root') as HTMLDivElement
        const treeData = createTreeData()
        const service = createTestService()

        initializeShadeRoot({
          injector,
          rootElement,
          jsxElement: (
            <Tree<TestNode>
              rootItems={treeData}
              treeService={service}
              renderItem={(item) => <span>{item.name}</span>}
              onSelectionChange={onSelectionChange}
            />
          ),
        })

        await sleepAsync(50)

        service.selection.setValue([treeData[0]])
        await sleepAsync(10)

        expect(onSelectionChange).toHaveBeenCalledWith([treeData[0]])

        service[Symbol.dispose]()
      })
    })
  })

  describe('keyboard navigation', () => {
    it('should handle ArrowDown to move focus to next item', async () => {
      await usingAsync(new Injector(), async (injector) => {
        const rootElement = document.getElementById('root') as HTMLDivElement
        const treeData = createTreeData()
        const service = createTestService()

        service.hasFocus.setValue(true)
        service.rootItems.setValue(treeData)
        service.updateFlattenedNodes()
        service.focusedItem.setValue(treeData[0])

        initializeShadeRoot({
          injector,
          rootElement,
          jsxElement: (
            <Tree<TestNode>
              rootItems={treeData}
              treeService={service}
              renderItem={(item) => <span>{item.name}</span>}
            />
          ),
        })

        await sleepAsync(50)

        window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }))

        expect(service.focusedItem.getValue()).toEqual(treeData[1])

        service[Symbol.dispose]()
      })
    })

    it('should handle ArrowRight to expand a node', async () => {
      await usingAsync(new Injector(), async (injector) => {
        const rootElement = document.getElementById('root') as HTMLDivElement
        const treeData = createTreeData()
        const service = createTestService()

        service.hasFocus.setValue(true)
        service.rootItems.setValue(treeData)
        service.updateFlattenedNodes()
        service.focusedItem.setValue(treeData[0])

        initializeShadeRoot({
          injector,
          rootElement,
          jsxElement: (
            <Tree<TestNode>
              rootItems={treeData}
              treeService={service}
              renderItem={(item) => <span>{item.name}</span>}
            />
          ),
        })

        await sleepAsync(50)

        window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }))

        expect(service.isExpanded(treeData[0])).toBe(true)

        service[Symbol.dispose]()
      })
    })

    it('should handle ArrowLeft to collapse an expanded node', async () => {
      await usingAsync(new Injector(), async (injector) => {
        const rootElement = document.getElementById('root') as HTMLDivElement
        const treeData = createTreeData()
        const service = createTestService()

        service.hasFocus.setValue(true)
        service.rootItems.setValue(treeData)
        service.updateFlattenedNodes()
        service.expand(treeData[0])
        service.focusedItem.setValue(treeData[0])

        initializeShadeRoot({
          injector,
          rootElement,
          jsxElement: (
            <Tree<TestNode>
              rootItems={treeData}
              treeService={service}
              renderItem={(item) => <span>{item.name}</span>}
            />
          ),
        })

        await sleepAsync(50)

        window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true }))

        expect(service.isExpanded(treeData[0])).toBe(false)

        service[Symbol.dispose]()
      })
    })

    it('should not handle keyboard when not focused', async () => {
      await usingAsync(new Injector(), async (injector) => {
        const rootElement = document.getElementById('root') as HTMLDivElement
        const treeData = createTreeData()
        const service = createTestService()

        service.hasFocus.setValue(false)
        service.rootItems.setValue(treeData)
        service.updateFlattenedNodes()
        service.focusedItem.setValue(treeData[0])

        initializeShadeRoot({
          injector,
          rootElement,
          jsxElement: (
            <Tree<TestNode>
              rootItems={treeData}
              treeService={service}
              renderItem={(item) => <span>{item.name}</span>}
            />
          ),
        })

        await sleepAsync(50)

        window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }))

        expect(service.focusedItem.getValue()).toEqual(treeData[0])

        service[Symbol.dispose]()
      })
    })
  })

  describe('keyboard listener cleanup', () => {
    it('should remove keyboard listener when component is disconnected', async () => {
      await usingAsync(new Injector(), async (injector) => {
        const rootElement = document.getElementById('root') as HTMLDivElement
        const treeData = createTreeData()
        const service = createTestService()

        service.hasFocus.setValue(true)
        service.rootItems.setValue(treeData)
        service.updateFlattenedNodes()
        service.focusedItem.setValue(treeData[0])

        initializeShadeRoot({
          injector,
          rootElement,
          jsxElement: (
            <Tree<TestNode>
              rootItems={treeData}
              treeService={service}
              renderItem={(item) => <span>{item.name}</span>}
            />
          ),
        })

        await sleepAsync(50)

        const tree = document.querySelector('shade-tree') as HTMLElement
        tree.remove()

        await sleepAsync(10)

        window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }))
        expect(service.focusedItem.getValue()).toEqual(treeData[0])

        service[Symbol.dispose]()
      })
    })
  })
})
