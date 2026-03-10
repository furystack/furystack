import { Injector } from '@furystack/inject'
import { createComponent, flushUpdates, initializeShadeRoot } from '@furystack/shades'
import { usingAsync } from '@furystack/utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ListService } from '../../services/list-service.js'
import { List } from './list.js'

type TestItem = { id: number; name: string }

describe('List', () => {
  beforeEach(() => {
    document.body.innerHTML = '<div id="root"></div>'
  })

  afterEach(() => {
    document.body.innerHTML = ''
  })

  const testItems: TestItem[] = [
    { id: 1, name: 'First' },
    { id: 2, name: 'Second' },
    { id: 3, name: 'Third' },
  ]

  const createTestService = (options?: ConstructorParameters<typeof ListService<TestItem>>[0]) => {
    return new ListService<TestItem>(options)
  }

  describe('rendering', () => {
    it('should render the shade-list custom element', async () => {
      await usingAsync(new Injector(), async (injector) => {
        const rootElement = document.getElementById('root') as HTMLDivElement
        const service = createTestService()

        initializeShadeRoot({
          injector,
          rootElement,
          jsxElement: (
            <List<TestItem> items={testItems} listService={service} renderItem={(item) => <span>{item.name}</span>} />
          ),
        })

        await flushUpdates()

        const list = document.querySelector('shade-list')
        expect(list).not.toBeNull()

        service[Symbol.dispose]()
      })
    })

    it('should render list items', async () => {
      await usingAsync(new Injector(), async (injector) => {
        const rootElement = document.getElementById('root') as HTMLDivElement
        const service = createTestService()

        initializeShadeRoot({
          injector,
          rootElement,
          jsxElement: (
            <List<TestItem> items={testItems} listService={service} renderItem={(item) => <span>{item.name}</span>} />
          ),
        })

        await flushUpdates()

        const list = document.querySelector('shade-list')
        const items = list?.querySelectorAll('shade-list-item')
        expect(items?.length).toBe(3)

        service[Symbol.dispose]()
      })
    })

    it('should render a listbox container', async () => {
      await usingAsync(new Injector(), async (injector) => {
        const rootElement = document.getElementById('root') as HTMLDivElement
        const service = createTestService()

        initializeShadeRoot({
          injector,
          rootElement,
          jsxElement: (
            <List<TestItem> items={testItems} listService={service} renderItem={(item) => <span>{item.name}</span>} />
          ),
        })

        await flushUpdates()

        const list = document.querySelector('shade-list')
        const listbox = list?.querySelector('[role="listbox"]')
        expect(listbox).not.toBeNull()
        expect(listbox?.getAttribute('aria-multiselectable')).toBe('true')

        service[Symbol.dispose]()
      })
    })

    it('should render items with role option', async () => {
      await usingAsync(new Injector(), async (injector) => {
        const rootElement = document.getElementById('root') as HTMLDivElement
        const service = createTestService()

        initializeShadeRoot({
          injector,
          rootElement,
          jsxElement: (
            <List<TestItem> items={testItems} listService={service} renderItem={(item) => <span>{item.name}</span>} />
          ),
        })

        await flushUpdates()

        const list = document.querySelector('shade-list')
        const options = list?.querySelectorAll('[role="option"]')
        expect(options?.length).toBe(3)

        service[Symbol.dispose]()
      })
    })

    it('should render icon when renderIcon is provided', async () => {
      await usingAsync(new Injector(), async (injector) => {
        const rootElement = document.getElementById('root') as HTMLDivElement
        const service = createTestService()

        initializeShadeRoot({
          injector,
          rootElement,
          jsxElement: (
            <List<TestItem>
              items={testItems}
              listService={service}
              renderItem={(item) => <span>{item.name}</span>}
              renderIcon={() => <span data-testid="icon">icon</span>}
            />
          ),
        })

        await flushUpdates()

        const list = document.querySelector('shade-list')
        const icons = list?.querySelectorAll('[data-testid="icon"]')
        expect(icons?.length).toBe(3)

        service[Symbol.dispose]()
      })
    })

    it('should render secondary actions when provided', async () => {
      await usingAsync(new Injector(), async (injector) => {
        const rootElement = document.getElementById('root') as HTMLDivElement
        const service = createTestService()

        initializeShadeRoot({
          injector,
          rootElement,
          jsxElement: (
            <List<TestItem>
              items={testItems}
              listService={service}
              renderItem={(item) => <span>{item.name}</span>}
              renderSecondaryActions={() => [<button data-testid="action">Edit</button>]}
            />
          ),
        })

        await flushUpdates()

        const list = document.querySelector('shade-list')
        const actions = list?.querySelectorAll('[data-testid="action"]')
        expect(actions?.length).toBe(3)

        service[Symbol.dispose]()
      })
    })

    it('should set data-variant attribute when variant is provided', async () => {
      await usingAsync(new Injector(), async (injector) => {
        const rootElement = document.getElementById('root') as HTMLDivElement
        const service = createTestService()

        initializeShadeRoot({
          injector,
          rootElement,
          jsxElement: (
            <List<TestItem>
              items={testItems}
              listService={service}
              renderItem={(item) => <span>{item.name}</span>}
              variant="contained"
            />
          ),
        })

        await flushUpdates()

        const list = document.querySelector('shade-list') as HTMLElement
        expect(list?.getAttribute('data-variant')).toBe('contained')

        service[Symbol.dispose]()
      })
    })

    it('should sync items to the service', async () => {
      await usingAsync(new Injector(), async (injector) => {
        const rootElement = document.getElementById('root') as HTMLDivElement
        const service = createTestService()

        initializeShadeRoot({
          injector,
          rootElement,
          jsxElement: (
            <List<TestItem> items={testItems} listService={service} renderItem={(item) => <span>{item.name}</span>} />
          ),
        })

        await flushUpdates()

        expect(service.items.getValue()).toEqual(testItems)

        service[Symbol.dispose]()
      })
    })
  })

  describe('focus management', () => {
    it('should set focus on click', async () => {
      await usingAsync(new Injector(), async (injector) => {
        const rootElement = document.getElementById('root') as HTMLDivElement
        const service = createTestService()

        expect(service.hasFocus.getValue()).toBe(false)

        initializeShadeRoot({
          injector,
          rootElement,
          jsxElement: (
            <List<TestItem> items={testItems} listService={service} renderItem={(item) => <span>{item.name}</span>} />
          ),
        })

        await flushUpdates()

        const list = document.querySelector('shade-list')
        const wrapper = list?.querySelector('.shade-list-wrapper') as HTMLElement
        wrapper?.click()

        expect(service.hasFocus.getValue()).toBe(true)

        service[Symbol.dispose]()
      })
    })

    it('should lose focus on focusout to an outside element', async () => {
      await usingAsync(new Injector(), async (injector) => {
        const rootElement = document.getElementById('root') as HTMLDivElement
        const service = createTestService()

        initializeShadeRoot({
          injector,
          rootElement,
          jsxElement: (
            <>
              <button data-testid="outside">Outside</button>
              <List<TestItem> items={testItems} listService={service} renderItem={(item) => <span>{item.name}</span>} />
            </>
          ),
        })

        await flushUpdates()

        const list = document.querySelector('shade-list')
        const wrapper = list?.querySelector('.shade-list-wrapper') as HTMLElement
        wrapper?.click()

        expect(service.hasFocus.getValue()).toBe(true)

        const outside = document.querySelector('[data-testid="outside"]') as HTMLElement
        wrapper?.dispatchEvent(new FocusEvent('focusout', { bubbles: true, relatedTarget: outside }))

        expect(service.hasFocus.getValue()).toBe(false)

        service[Symbol.dispose]()
      })
    })

    it('should set focused item on item click', async () => {
      await usingAsync(new Injector(), async (injector) => {
        const rootElement = document.getElementById('root') as HTMLDivElement
        const service = createTestService()

        initializeShadeRoot({
          injector,
          rootElement,
          jsxElement: (
            <List<TestItem> items={testItems} listService={service} renderItem={(item) => <span>{item.name}</span>} />
          ),
        })

        await flushUpdates()

        const list = document.querySelector('shade-list')
        const listItems = list?.querySelectorAll('shade-list-item') as NodeListOf<HTMLElement>
        listItems[1]?.click()

        expect(service.focusedItem.getValue()).toBe(testItems[1])

        service[Symbol.dispose]()
      })
    })

    it('should add focused CSS class to focused item', async () => {
      await usingAsync(new Injector(), async (injector) => {
        const rootElement = document.getElementById('root') as HTMLDivElement
        const service = createTestService()

        initializeShadeRoot({
          injector,
          rootElement,
          jsxElement: (
            <List<TestItem> items={testItems} listService={service} renderItem={(item) => <span>{item.name}</span>} />
          ),
        })

        await flushUpdates()

        service.focusedItem.setValue(testItems[1])
        await flushUpdates()

        const list = document.querySelector('shade-list')
        const listItems = list?.querySelectorAll('shade-list-item') as NodeListOf<HTMLElement>
        expect(listItems[1]?.hasAttribute('data-focused')).toBe(true)
        expect(listItems[0]?.hasAttribute('data-focused')).toBe(false)

        service[Symbol.dispose]()
      })
    })

    it('should not initialize focusedItem on wrapper focusin (items handle focus individually)', async () => {
      await usingAsync(new Injector(), async (injector) => {
        const rootElement = document.getElementById('root') as HTMLDivElement
        const service = createTestService()

        initializeShadeRoot({
          injector,
          rootElement,
          jsxElement: (
            <List<TestItem> items={testItems} listService={service} renderItem={(item) => <span>{item.name}</span>} />
          ),
        })

        await flushUpdates()
        await new Promise((r) => setTimeout(r, 0))

        expect(service.hasFocus.getValue()).toBe(false)
        expect(service.focusedItem.getValue()).toBeUndefined()

        service[Symbol.dispose]()
      })
    })

    it('should clear hasFocus on focusout when focus moves outside', async () => {
      await usingAsync(new Injector(), async (injector) => {
        const rootElement = document.getElementById('root') as HTMLDivElement
        const service = createTestService()
        const outsideEl = document.createElement('button')
        outsideEl.textContent = 'Outside'
        document.body.appendChild(outsideEl)

        initializeShadeRoot({
          injector,
          rootElement,
          jsxElement: (
            <List<TestItem> items={testItems} listService={service} renderItem={(item) => <span>{item.name}</span>} />
          ),
        })

        await flushUpdates()
        await new Promise((r) => setTimeout(r, 0))

        service.hasFocus.setValue(true)

        const wrapper = document.querySelector('.shade-list-wrapper') as HTMLElement
        wrapper?.dispatchEvent(new FocusEvent('focusout', { bubbles: true, relatedTarget: outsideEl }))

        expect(service.hasFocus.getValue()).toBe(false)

        outsideEl.remove()
        service[Symbol.dispose]()
      })
    })

    it('should clear hasFocus on focusout when relatedTarget is null', async () => {
      await usingAsync(new Injector(), async (injector) => {
        const rootElement = document.getElementById('root') as HTMLDivElement
        const service = createTestService()

        initializeShadeRoot({
          injector,
          rootElement,
          jsxElement: (
            <List<TestItem> items={testItems} listService={service} renderItem={(item) => <span>{item.name}</span>} />
          ),
        })

        await flushUpdates()
        await new Promise((r) => setTimeout(r, 0))

        service.hasFocus.setValue(true)

        const wrapper = document.querySelector('.shade-list-wrapper') as HTMLElement
        wrapper?.dispatchEvent(new FocusEvent('focusout', { bubbles: true, relatedTarget: null }))

        expect(service.hasFocus.getValue()).toBe(false)

        service[Symbol.dispose]()
      })
    })
  })

  describe('selection', () => {
    it('should add selected CSS class to selected items', async () => {
      await usingAsync(new Injector(), async (injector) => {
        const rootElement = document.getElementById('root') as HTMLDivElement
        const service = createTestService()

        initializeShadeRoot({
          injector,
          rootElement,
          jsxElement: (
            <List<TestItem> items={testItems} listService={service} renderItem={(item) => <span>{item.name}</span>} />
          ),
        })

        await flushUpdates()

        service.selection.setValue([testItems[0], testItems[2]])
        await flushUpdates()

        const list = document.querySelector('shade-list')
        const listItems = list?.querySelectorAll('shade-list-item') as NodeListOf<HTMLElement>
        expect(listItems[0]?.hasAttribute('data-selected')).toBe(true)
        expect(listItems[1]?.hasAttribute('data-selected')).toBe(false)
        expect(listItems[2]?.hasAttribute('data-selected')).toBe(true)

        service[Symbol.dispose]()
      })
    })

    it('should set aria-selected on selected items', async () => {
      await usingAsync(new Injector(), async (injector) => {
        const rootElement = document.getElementById('root') as HTMLDivElement
        const service = createTestService()

        initializeShadeRoot({
          injector,
          rootElement,
          jsxElement: (
            <List<TestItem> items={testItems} listService={service} renderItem={(item) => <span>{item.name}</span>} />
          ),
        })

        await flushUpdates()

        service.selection.setValue([testItems[0]])
        await flushUpdates()

        const list = document.querySelector('shade-list')
        const listItems = list?.querySelectorAll('shade-list-item') as NodeListOf<HTMLElement>
        expect(listItems[0]?.getAttribute('aria-selected')).toBe('true')
        expect(listItems[1]?.getAttribute('aria-selected')).toBe('false')

        service[Symbol.dispose]()
      })
    })

    it('should call onSelectionChange when selection changes', async () => {
      const onSelectionChange = vi.fn()
      await usingAsync(new Injector(), async (injector) => {
        const rootElement = document.getElementById('root') as HTMLDivElement
        const service = createTestService()

        initializeShadeRoot({
          injector,
          rootElement,
          jsxElement: (
            <List<TestItem>
              items={testItems}
              listService={service}
              renderItem={(item) => <span>{item.name}</span>}
              onSelectionChange={onSelectionChange}
            />
          ),
        })

        await flushUpdates()

        service.selection.setValue([testItems[0]])
        await flushUpdates()

        expect(onSelectionChange).toHaveBeenCalledWith([testItems[0]])

        service[Symbol.dispose]()
      })
    })
  })

  describe('keyboard navigation', () => {
    it('should not handle ArrowDown (delegated to spatial navigation)', async () => {
      await usingAsync(new Injector(), async (injector) => {
        const rootElement = document.getElementById('root') as HTMLDivElement
        const service = createTestService()

        service.hasFocus.setValue(true)
        service.focusedItem.setValue(testItems[0])

        initializeShadeRoot({
          injector,
          rootElement,
          jsxElement: (
            <List<TestItem> items={testItems} listService={service} renderItem={(item) => <span>{item.name}</span>} />
          ),
        })

        await flushUpdates()

        window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }))

        expect(service.focusedItem.getValue()).toEqual(testItems[0])

        service[Symbol.dispose]()
      })
    })

    it('should not handle ArrowUp (delegated to spatial navigation)', async () => {
      await usingAsync(new Injector(), async (injector) => {
        const rootElement = document.getElementById('root') as HTMLDivElement
        const service = createTestService()

        service.hasFocus.setValue(true)
        service.focusedItem.setValue(testItems[1])

        initializeShadeRoot({
          injector,
          rootElement,
          jsxElement: (
            <List<TestItem> items={testItems} listService={service} renderItem={(item) => <span>{item.name}</span>} />
          ),
        })

        await flushUpdates()

        window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp', bubbles: true }))

        expect(service.focusedItem.getValue()).toEqual(testItems[1])

        service[Symbol.dispose]()
      })
    })

    it('should handle Home to move focus to first item', async () => {
      await usingAsync(new Injector(), async (injector) => {
        const rootElement = document.getElementById('root') as HTMLDivElement
        const service = createTestService()

        service.hasFocus.setValue(true)
        service.focusedItem.setValue(testItems[2])

        initializeShadeRoot({
          injector,
          rootElement,
          jsxElement: (
            <List<TestItem> items={testItems} listService={service} renderItem={(item) => <span>{item.name}</span>} />
          ),
        })

        await flushUpdates()

        window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Home', bubbles: true }))

        expect(service.focusedItem.getValue()).toEqual(testItems[0])

        service[Symbol.dispose]()
      })
    })

    it('should handle End to move focus to last item', async () => {
      await usingAsync(new Injector(), async (injector) => {
        const rootElement = document.getElementById('root') as HTMLDivElement
        const service = createTestService()

        service.hasFocus.setValue(true)
        service.focusedItem.setValue(testItems[0])

        initializeShadeRoot({
          injector,
          rootElement,
          jsxElement: (
            <List<TestItem> items={testItems} listService={service} renderItem={(item) => <span>{item.name}</span>} />
          ),
        })

        await flushUpdates()

        window.dispatchEvent(new KeyboardEvent('keydown', { key: 'End', bubbles: true }))

        expect(service.focusedItem.getValue()).toEqual(testItems[2])

        service[Symbol.dispose]()
      })
    })

    it('should handle Space to toggle selection of focused item', async () => {
      await usingAsync(new Injector(), async (injector) => {
        const rootElement = document.getElementById('root') as HTMLDivElement
        const service = createTestService()

        service.hasFocus.setValue(true)
        service.focusedItem.setValue(testItems[0])

        initializeShadeRoot({
          injector,
          rootElement,
          jsxElement: (
            <List<TestItem> items={testItems} listService={service} renderItem={(item) => <span>{item.name}</span>} />
          ),
        })

        await flushUpdates()

        window.dispatchEvent(new KeyboardEvent('keydown', { key: ' ', bubbles: true }))
        expect(service.selection.getValue()).toContain(testItems[0])

        window.dispatchEvent(new KeyboardEvent('keydown', { key: ' ', bubbles: true }))
        expect(service.selection.getValue()).not.toContain(testItems[0])

        service[Symbol.dispose]()
      })
    })

    it('should handle + to select all items', async () => {
      await usingAsync(new Injector(), async (injector) => {
        const rootElement = document.getElementById('root') as HTMLDivElement
        const service = createTestService()

        service.hasFocus.setValue(true)

        initializeShadeRoot({
          injector,
          rootElement,
          jsxElement: (
            <List<TestItem> items={testItems} listService={service} renderItem={(item) => <span>{item.name}</span>} />
          ),
        })

        await flushUpdates()

        window.dispatchEvent(new KeyboardEvent('keydown', { key: '+', bubbles: true }))

        expect(service.selection.getValue().length).toBe(3)

        service[Symbol.dispose]()
      })
    })

    it('should handle - to deselect all items', async () => {
      await usingAsync(new Injector(), async (injector) => {
        const rootElement = document.getElementById('root') as HTMLDivElement
        const service = createTestService()

        service.hasFocus.setValue(true)
        service.selection.setValue([...testItems])

        initializeShadeRoot({
          injector,
          rootElement,
          jsxElement: (
            <List<TestItem> items={testItems} listService={service} renderItem={(item) => <span>{item.name}</span>} />
          ),
        })

        await flushUpdates()

        window.dispatchEvent(new KeyboardEvent('keydown', { key: '-', bubbles: true }))

        expect(service.selection.getValue().length).toBe(0)

        service[Symbol.dispose]()
      })
    })

    it('should handle * to invert selection', async () => {
      await usingAsync(new Injector(), async (injector) => {
        const rootElement = document.getElementById('root') as HTMLDivElement
        const service = createTestService()

        service.hasFocus.setValue(true)
        service.selection.setValue([testItems[0]])

        initializeShadeRoot({
          injector,
          rootElement,
          jsxElement: (
            <List<TestItem> items={testItems} listService={service} renderItem={(item) => <span>{item.name}</span>} />
          ),
        })

        await flushUpdates()

        window.dispatchEvent(new KeyboardEvent('keydown', { key: '*', bubbles: true }))

        const selection = service.selection.getValue()
        expect(selection).not.toContain(testItems[0])
        expect(selection).toContain(testItems[1])
        expect(selection).toContain(testItems[2])

        service[Symbol.dispose]()
      })
    })

    it('should handle Escape to clear selection and search term', async () => {
      await usingAsync(new Injector(), async (injector) => {
        const rootElement = document.getElementById('root') as HTMLDivElement
        const service = createTestService()

        service.hasFocus.setValue(true)
        service.selection.setValue([testItems[0], testItems[1]])
        service.searchTerm.setValue('test')

        initializeShadeRoot({
          injector,
          rootElement,
          jsxElement: (
            <List<TestItem> items={testItems} listService={service} renderItem={(item) => <span>{item.name}</span>} />
          ),
        })

        await flushUpdates()

        window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))

        expect(service.selection.getValue()).toEqual([])
        expect(service.searchTerm.getValue()).toBe('')

        service[Symbol.dispose]()
      })
    })

    it('should not handle keyboard when not focused', async () => {
      await usingAsync(new Injector(), async (injector) => {
        const rootElement = document.getElementById('root') as HTMLDivElement
        const service = createTestService()

        service.hasFocus.setValue(false)
        service.focusedItem.setValue(testItems[0])

        initializeShadeRoot({
          injector,
          rootElement,
          jsxElement: (
            <List<TestItem> items={testItems} listService={service} renderItem={(item) => <span>{item.name}</span>} />
          ),
        })

        await flushUpdates()

        window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }))

        expect(service.focusedItem.getValue()).toEqual(testItems[0])

        service[Symbol.dispose]()
      })
    })
  })

  describe('activation', () => {
    it('should call onItemActivate on Enter key', async () => {
      const onItemActivate = vi.fn()
      await usingAsync(new Injector(), async (injector) => {
        const rootElement = document.getElementById('root') as HTMLDivElement
        const service = createTestService()

        service.hasFocus.setValue(true)
        service.focusedItem.setValue(testItems[1])

        initializeShadeRoot({
          injector,
          rootElement,
          jsxElement: (
            <List<TestItem>
              items={testItems}
              listService={service}
              renderItem={(item) => <span>{item.name}</span>}
              onItemActivate={onItemActivate}
            />
          ),
        })

        await flushUpdates()

        window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }))

        expect(onItemActivate).toHaveBeenCalledWith(testItems[1])

        service[Symbol.dispose]()
      })
    })

    it('should call onItemActivate on double-click', async () => {
      const onItemActivate = vi.fn()
      await usingAsync(new Injector(), async (injector) => {
        const rootElement = document.getElementById('root') as HTMLDivElement
        const service = createTestService()

        initializeShadeRoot({
          injector,
          rootElement,
          jsxElement: (
            <List<TestItem>
              items={testItems}
              listService={service}
              renderItem={(item) => <span>{item.name}</span>}
              onItemActivate={onItemActivate}
            />
          ),
        })

        await flushUpdates()

        const list = document.querySelector('shade-list')
        const listItems = list?.querySelectorAll('shade-list-item') as NodeListOf<HTMLElement>
        listItems[0]?.dispatchEvent(new MouseEvent('dblclick', { bubbles: true }))

        expect(onItemActivate).toHaveBeenCalledWith(testItems[0])

        service[Symbol.dispose]()
      })
    })
  })

  describe('pagination', () => {
    const manyItems: TestItem[] = Array.from({ length: 25 }, (_, i) => ({ id: i + 1, name: `Item ${i + 1}` }))

    it('should render only current page items when pagination is provided', async () => {
      await usingAsync(new Injector(), async (injector) => {
        const rootElement = document.getElementById('root') as HTMLDivElement
        const service = createTestService()

        initializeShadeRoot({
          injector,
          rootElement,
          jsxElement: (
            <List<TestItem>
              items={manyItems}
              listService={service}
              renderItem={(item) => <span>{item.name}</span>}
              pagination={{ itemsPerPage: 10, page: 1, onPageChange: () => {} }}
            />
          ),
        })

        await flushUpdates()

        const list = document.querySelector('shade-list')
        const listItems = list?.querySelectorAll('shade-list-item')
        expect(listItems?.length).toBe(10)

        service[Symbol.dispose]()
      })
    })

    it('should render the Pagination component', async () => {
      await usingAsync(new Injector(), async (injector) => {
        const rootElement = document.getElementById('root') as HTMLDivElement
        const service = createTestService()

        initializeShadeRoot({
          injector,
          rootElement,
          jsxElement: (
            <List<TestItem>
              items={manyItems}
              listService={service}
              renderItem={(item) => <span>{item.name}</span>}
              pagination={{ itemsPerPage: 10, page: 1, onPageChange: () => {} }}
            />
          ),
        })

        await flushUpdates()

        const pagination = document.querySelector('shade-list shade-pagination')
        expect(pagination).not.toBeNull()

        service[Symbol.dispose]()
      })
    })

    it('should show last page items correctly', async () => {
      await usingAsync(new Injector(), async (injector) => {
        const rootElement = document.getElementById('root') as HTMLDivElement
        const service = createTestService()

        initializeShadeRoot({
          injector,
          rootElement,
          jsxElement: (
            <List<TestItem>
              items={manyItems}
              listService={service}
              renderItem={(item) => <span>{item.name}</span>}
              pagination={{ itemsPerPage: 10, page: 3, onPageChange: () => {} }}
            />
          ),
        })

        await flushUpdates()

        const list = document.querySelector('shade-list')
        const listItems = list?.querySelectorAll('shade-list-item')
        expect(listItems?.length).toBe(5)

        service[Symbol.dispose]()
      })
    })

    it('should not render Pagination when all items fit on one page', async () => {
      await usingAsync(new Injector(), async (injector) => {
        const rootElement = document.getElementById('root') as HTMLDivElement
        const service = createTestService()

        initializeShadeRoot({
          injector,
          rootElement,
          jsxElement: (
            <List<TestItem>
              items={testItems}
              listService={service}
              renderItem={(item) => <span>{item.name}</span>}
              pagination={{ itemsPerPage: 10, page: 1, onPageChange: () => {} }}
            />
          ),
        })

        await flushUpdates()

        const pagination = document.querySelector('shade-list shade-pagination')
        expect(pagination).toBeNull()

        service[Symbol.dispose]()
      })
    })

    it('should call onPageChange when a pagination button is clicked', async () => {
      const onPageChange = vi.fn()
      await usingAsync(new Injector(), async (injector) => {
        const rootElement = document.getElementById('root') as HTMLDivElement
        const service = createTestService()

        initializeShadeRoot({
          injector,
          rootElement,
          jsxElement: (
            <List<TestItem>
              items={manyItems}
              listService={service}
              renderItem={(item) => <span>{item.name}</span>}
              pagination={{ itemsPerPage: 10, page: 1, onPageChange }}
            />
          ),
        })

        await flushUpdates()

        const nextButton = document.querySelector(
          'shade-list shade-pagination [aria-label="Go to next page"]',
        ) as HTMLButtonElement
        expect(nextButton).not.toBeNull()
        nextButton.click()

        expect(onPageChange).toHaveBeenCalledWith(2)

        service[Symbol.dispose]()
      })
    })

    it('should render all items when pagination is not provided', async () => {
      await usingAsync(new Injector(), async (injector) => {
        const rootElement = document.getElementById('root') as HTMLDivElement
        const service = createTestService()

        initializeShadeRoot({
          injector,
          rootElement,
          jsxElement: (
            <List<TestItem> items={manyItems} listService={service} renderItem={(item) => <span>{item.name}</span>} />
          ),
        })

        await flushUpdates()

        const list = document.querySelector('shade-list')
        const listItems = list?.querySelectorAll('shade-list-item')
        expect(listItems?.length).toBe(25)

        const pagination = document.querySelector('shade-list shade-pagination')
        expect(pagination).toBeNull()

        service[Symbol.dispose]()
      })
    })
  })

  describe('item spatial navigation attributes', () => {
    it('should set data-spatial-nav-target on list items', async () => {
      await usingAsync(new Injector(), async (injector) => {
        const rootElement = document.getElementById('root') as HTMLDivElement
        const service = createTestService()

        initializeShadeRoot({
          injector,
          rootElement,
          jsxElement: (
            <List<TestItem> items={testItems} listService={service} renderItem={(item) => <span>{item.name}</span>} />
          ),
        })

        await flushUpdates()

        const items = document.querySelectorAll('shade-list-item')
        for (const item of items) {
          expect(item.hasAttribute('data-spatial-nav-target')).toBe(true)
        }

        service[Symbol.dispose]()
      })
    })

    it('should set tabIndex 0 on focused item and -1 on others', async () => {
      await usingAsync(new Injector(), async (injector) => {
        const rootElement = document.getElementById('root') as HTMLDivElement
        const service = createTestService()

        service.focusedItem.setValue(testItems[1])

        initializeShadeRoot({
          injector,
          rootElement,
          jsxElement: (
            <List<TestItem> items={testItems} listService={service} renderItem={(item) => <span>{item.name}</span>} />
          ),
        })

        await flushUpdates()

        const items = document.querySelectorAll<HTMLDivElement>('shade-list-item')
        expect(items[0]?.tabIndex).toBe(-1)
        expect(items[1]?.tabIndex).toBe(0)
        expect(items[2]?.tabIndex).toBe(-1)

        service[Symbol.dispose]()
      })
    })

    it('should sync focusedItem on item onfocus', async () => {
      await usingAsync(new Injector(), async (injector) => {
        const rootElement = document.getElementById('root') as HTMLDivElement
        const service = createTestService()

        initializeShadeRoot({
          injector,
          rootElement,
          jsxElement: (
            <List<TestItem> items={testItems} listService={service} renderItem={(item) => <span>{item.name}</span>} />
          ),
        })

        await flushUpdates()

        const items = document.querySelectorAll('shade-list-item')
        items[2]?.dispatchEvent(new FocusEvent('focus'))

        expect(service.focusedItem.getValue()).toEqual(testItems[2])
        expect(service.hasFocus.getValue()).toBe(true)

        service[Symbol.dispose]()
      })
    })
  })

  describe('keyboard listener cleanup', () => {
    it('should remove keyboard listener when component is disconnected', async () => {
      await usingAsync(new Injector(), async (injector) => {
        const rootElement = document.getElementById('root') as HTMLDivElement
        const service = createTestService()

        service.hasFocus.setValue(true)
        service.focusedItem.setValue(testItems[0])

        initializeShadeRoot({
          injector,
          rootElement,
          jsxElement: (
            <List<TestItem> items={testItems} listService={service} renderItem={(item) => <span>{item.name}</span>} />
          ),
        })

        await flushUpdates()

        const list = document.querySelector('shade-list') as HTMLElement
        list.remove()

        await flushUpdates()

        window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }))
        expect(service.focusedItem.getValue()).toEqual(testItems[0])

        service[Symbol.dispose]()
      })
    })
  })
})
