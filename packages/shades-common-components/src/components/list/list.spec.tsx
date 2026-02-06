import { Injector } from '@furystack/inject'
import { createComponent, initializeShadeRoot } from '@furystack/shades'
import { sleepAsync, usingAsync } from '@furystack/utils'
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

        await sleepAsync(50)

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

        await sleepAsync(50)

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

        await sleepAsync(50)

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

        await sleepAsync(50)

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

        await sleepAsync(50)

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

        await sleepAsync(50)

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

        await sleepAsync(50)

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

        await sleepAsync(50)

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

        await sleepAsync(50)

        const list = document.querySelector('shade-list')
        const wrapper = list?.querySelector('.shade-list-wrapper') as HTMLElement
        wrapper?.click()

        expect(service.hasFocus.getValue()).toBe(true)

        service[Symbol.dispose]()
      })
    })

    it('should lose focus on click outside', async () => {
      await usingAsync(new Injector(), async (injector) => {
        const rootElement = document.getElementById('root') as HTMLDivElement
        const service = createTestService()

        initializeShadeRoot({
          injector,
          rootElement,
          jsxElement: (
            <>
              <div data-testid="outside">Outside</div>
              <List<TestItem> items={testItems} listService={service} renderItem={(item) => <span>{item.name}</span>} />
            </>
          ),
        })

        await sleepAsync(50)

        const list = document.querySelector('shade-list')
        const wrapper = list?.querySelector('.shade-list-wrapper') as HTMLElement
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
        const service = createTestService()

        initializeShadeRoot({
          injector,
          rootElement,
          jsxElement: (
            <List<TestItem> items={testItems} listService={service} renderItem={(item) => <span>{item.name}</span>} />
          ),
        })

        await sleepAsync(50)

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

        await sleepAsync(50)

        service.focusedItem.setValue(testItems[1])
        await sleepAsync(10)

        const list = document.querySelector('shade-list')
        const listItems = list?.querySelectorAll('shade-list-item') as NodeListOf<HTMLElement>
        expect(listItems[1]?.classList.contains('focused')).toBe(true)
        expect(listItems[0]?.classList.contains('focused')).toBe(false)

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

        await sleepAsync(50)

        service.selection.setValue([testItems[0], testItems[2]])
        await sleepAsync(10)

        const list = document.querySelector('shade-list')
        const listItems = list?.querySelectorAll('shade-list-item') as NodeListOf<HTMLElement>
        expect(listItems[0]?.classList.contains('selected')).toBe(true)
        expect(listItems[1]?.classList.contains('selected')).toBe(false)
        expect(listItems[2]?.classList.contains('selected')).toBe(true)

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

        await sleepAsync(50)

        service.selection.setValue([testItems[0]])
        await sleepAsync(10)

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

        await sleepAsync(50)

        service.selection.setValue([testItems[0]])
        await sleepAsync(10)

        expect(onSelectionChange).toHaveBeenCalledWith([testItems[0]])

        service[Symbol.dispose]()
      })
    })
  })

  describe('keyboard navigation', () => {
    it('should handle ArrowDown to move focus to next item', async () => {
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

        await sleepAsync(50)

        window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }))

        expect(service.focusedItem.getValue()).toEqual(testItems[1])

        service[Symbol.dispose]()
      })
    })

    it('should handle ArrowUp to move focus to previous item', async () => {
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

        await sleepAsync(50)

        window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp', bubbles: true }))

        expect(service.focusedItem.getValue()).toEqual(testItems[0])

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

        await sleepAsync(50)

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

        await sleepAsync(50)

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

        await sleepAsync(50)

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

        await sleepAsync(50)

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

        await sleepAsync(50)

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

        await sleepAsync(50)

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

        await sleepAsync(50)

        window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))

        expect(service.selection.getValue()).toEqual([])
        expect(service.searchTerm.getValue()).toBe('')

        service[Symbol.dispose]()
      })
    })

    it('should handle Tab to toggle focus', async () => {
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

        await sleepAsync(50)

        window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab', bubbles: true }))

        expect(service.hasFocus.getValue()).toBe(false)

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

        await sleepAsync(50)

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

        await sleepAsync(50)

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

        await sleepAsync(50)

        const list = document.querySelector('shade-list')
        const listItems = list?.querySelectorAll('shade-list-item') as NodeListOf<HTMLElement>
        listItems[0]?.dispatchEvent(new MouseEvent('dblclick', { bubbles: true }))

        expect(onItemActivate).toHaveBeenCalledWith(testItems[0])

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

        await sleepAsync(50)

        const list = document.querySelector('shade-list') as HTMLElement
        list.remove()

        await sleepAsync(10)

        window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }))
        expect(service.focusedItem.getValue()).toEqual(testItems[0])

        service[Symbol.dispose]()
      })
    })
  })
})
