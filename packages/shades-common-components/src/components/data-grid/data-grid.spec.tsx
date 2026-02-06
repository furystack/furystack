import { Injector } from '@furystack/inject'
import { createComponent, initializeShadeRoot } from '@furystack/shades'
import { ObservableValue, sleepAsync, usingAsync } from '@furystack/utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { CollectionService } from '../../services/collection-service.js'
import { DataGrid } from './data-grid.js'

type TestEntry = { id: number; name: string }

describe('DataGrid', () => {
  beforeEach(() => {
    document.body.innerHTML = '<div id="root"></div>'
  })

  afterEach(() => {
    document.body.innerHTML = ''
  })

  const createTestService = () => {
    const service = new CollectionService<TestEntry>()
    service.data.setValue({
      count: 3,
      entries: [
        { id: 1, name: 'First' },
        { id: 2, name: 'Second' },
        { id: 3, name: 'Third' },
      ],
    })
    return service
  }

  describe('rendering', () => {
    it('should render with columns', async () => {
      await usingAsync(new Injector(), async (injector) => {
        const rootElement = document.getElementById('root') as HTMLDivElement
        const service = createTestService()
        const findOptions = new ObservableValue<any>({})

        initializeShadeRoot({
          injector,
          rootElement,
          jsxElement: (
            <DataGrid<TestEntry, 'id' | 'name'>
              columns={['id', 'name']}
              collectionService={service}
              findOptions={findOptions}
              styles={{}}
              headerComponents={{}}
              rowComponents={{}}
            />
          ),
        })

        await sleepAsync(50)

        const grid = document.querySelector('shade-data-grid')
        expect(grid).not.toBeNull()

        const headers = grid?.querySelectorAll('th')
        expect(headers?.length).toBe(2)

        service[Symbol.dispose]()
        findOptions[Symbol.dispose]()
      })
    })

    it('should render table structure', async () => {
      await usingAsync(new Injector(), async (injector) => {
        const rootElement = document.getElementById('root') as HTMLDivElement
        const service = createTestService()
        const findOptions = new ObservableValue<any>({})

        initializeShadeRoot({
          injector,
          rootElement,
          jsxElement: (
            <DataGrid<TestEntry, 'id' | 'name'>
              columns={['id', 'name']}
              collectionService={service}
              findOptions={findOptions}
              styles={{}}
              headerComponents={{}}
              rowComponents={{}}
            />
          ),
        })

        await sleepAsync(50)

        const grid = document.querySelector('shade-data-grid')
        const table = grid?.querySelector('table')
        const thead = grid?.querySelector('thead')
        const tbody = grid?.querySelector('tbody')

        expect(table).not.toBeNull()
        expect(thead).not.toBeNull()
        expect(tbody).not.toBeNull()

        service[Symbol.dispose]()
        findOptions[Symbol.dispose]()
      })
    })

    it('should render custom header components when provided', async () => {
      await usingAsync(new Injector(), async (injector) => {
        const rootElement = document.getElementById('root') as HTMLDivElement
        const service = createTestService()
        const findOptions = new ObservableValue<any>({})

        initializeShadeRoot({
          injector,
          rootElement,
          jsxElement: (
            <DataGrid<TestEntry, 'id' | 'name'>
              columns={['id', 'name']}
              collectionService={service}
              findOptions={findOptions}
              styles={{}}
              headerComponents={{
                id: () => <span data-testid="custom-header-id">Custom ID Header</span>,
              }}
              rowComponents={{}}
            />
          ),
        })

        await sleepAsync(50)

        const grid = document.querySelector('shade-data-grid')
        const customHeader = grid?.querySelector('[data-testid="custom-header-id"]')
        expect(customHeader).not.toBeNull()
        expect(customHeader?.textContent).toBe('Custom ID Header')

        service[Symbol.dispose]()
        findOptions[Symbol.dispose]()
      })
    })

    it('should render default header components from headerComponents.default', async () => {
      await usingAsync(new Injector(), async (injector) => {
        const rootElement = document.getElementById('root') as HTMLDivElement
        const service = createTestService()
        const findOptions = new ObservableValue<any>({})

        initializeShadeRoot({
          injector,
          rootElement,
          jsxElement: (
            <DataGrid<TestEntry, 'id' | 'name'>
              columns={['id', 'name']}
              collectionService={service}
              findOptions={findOptions}
              styles={{}}
              headerComponents={{
                default: (name) => <span data-testid={`default-header-${name}`}>Default: {name}</span>,
              }}
              rowComponents={{}}
            />
          ),
        })

        await sleepAsync(50)

        const grid = document.querySelector('shade-data-grid')
        const defaultHeaderId = grid?.querySelector('[data-testid="default-header-id"]')
        const defaultHeaderName = grid?.querySelector('[data-testid="default-header-name"]')

        expect(defaultHeaderId?.textContent).toBe('Default: id')
        expect(defaultHeaderName?.textContent).toBe('Default: name')

        service[Symbol.dispose]()
        findOptions[Symbol.dispose]()
      })
    })

    it('should render DataGridHeader when no custom header is provided', async () => {
      await usingAsync(new Injector(), async (injector) => {
        const rootElement = document.getElementById('root') as HTMLDivElement
        const service = createTestService()
        const findOptions = new ObservableValue<any>({})

        initializeShadeRoot({
          injector,
          rootElement,
          jsxElement: (
            <DataGrid<TestEntry, 'id' | 'name'>
              columns={['id', 'name']}
              collectionService={service}
              findOptions={findOptions}
              styles={{}}
              headerComponents={{}}
              rowComponents={{}}
            />
          ),
        })

        await sleepAsync(50)

        const grid = document.querySelector('shade-data-grid')
        const defaultHeaders = grid?.querySelectorAll('data-grid-header')
        expect(defaultHeaders?.length).toBe(2)

        service[Symbol.dispose]()
        findOptions[Symbol.dispose]()
      })
    })
  })

  describe('focus management', () => {
    it('should set focus on click', async () => {
      await usingAsync(new Injector(), async (injector) => {
        const rootElement = document.getElementById('root') as HTMLDivElement
        const service = createTestService()
        const findOptions = new ObservableValue<any>({})

        expect(service.hasFocus.getValue()).toBe(false)

        initializeShadeRoot({
          injector,
          rootElement,
          jsxElement: (
            <DataGrid<TestEntry, 'id' | 'name'>
              columns={['id', 'name']}
              collectionService={service}
              findOptions={findOptions}
              styles={{}}
              headerComponents={{}}
              rowComponents={{}}
            />
          ),
        })

        await sleepAsync(50)

        const grid = document.querySelector('shade-data-grid')
        const wrapper = grid?.querySelector('.shade-grid-wrapper') as HTMLElement

        wrapper?.click()

        expect(service.hasFocus.getValue()).toBe(true)

        service[Symbol.dispose]()
        findOptions[Symbol.dispose]()
      })
    })

    it('should lose focus on click outside', async () => {
      await usingAsync(new Injector(), async (injector) => {
        const rootElement = document.getElementById('root') as HTMLDivElement
        const service = createTestService()
        const findOptions = new ObservableValue<any>({})

        initializeShadeRoot({
          injector,
          rootElement,
          jsxElement: (
            <>
              <div data-testid="outside">Outside</div>
              <DataGrid<TestEntry, 'id' | 'name'>
                columns={['id', 'name']}
                collectionService={service}
                findOptions={findOptions}
                styles={{}}
                headerComponents={{}}
                rowComponents={{}}
              />
            </>
          ),
        })

        await sleepAsync(50)

        const grid = document.querySelector('shade-data-grid')
        const wrapper = grid?.querySelector('.shade-grid-wrapper') as HTMLElement
        wrapper?.click()

        expect(service.hasFocus.getValue()).toBe(true)

        const outside = document.querySelector('[data-testid="outside"]') as HTMLElement
        outside?.dispatchEvent(new MouseEvent('click', { bubbles: true }))

        expect(service.hasFocus.getValue()).toBe(false)

        service[Symbol.dispose]()
        findOptions[Symbol.dispose]()
      })
    })
  })

  describe('keyboard navigation', () => {
    it('should handle ArrowDown to move focus to next entry', async () => {
      await usingAsync(new Injector(), async (injector) => {
        const rootElement = document.getElementById('root') as HTMLDivElement
        const service = createTestService()
        const findOptions = new ObservableValue<any>({})

        service.hasFocus.setValue(true)
        service.focusedEntry.setValue(service.data.getValue().entries[0])

        initializeShadeRoot({
          injector,
          rootElement,
          jsxElement: (
            <DataGrid<TestEntry, 'id' | 'name'>
              columns={['id', 'name']}
              collectionService={service}
              findOptions={findOptions}
              styles={{}}
              headerComponents={{}}
              rowComponents={{}}
            />
          ),
        })

        await sleepAsync(50)

        const keydownEvent = new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true })
        window.dispatchEvent(keydownEvent)

        expect(service.focusedEntry.getValue()).toEqual({ id: 2, name: 'Second' })

        service[Symbol.dispose]()
        findOptions[Symbol.dispose]()
      })
    })

    it('should handle ArrowUp to move focus to previous entry', async () => {
      await usingAsync(new Injector(), async (injector) => {
        const rootElement = document.getElementById('root') as HTMLDivElement
        const service = createTestService()
        const findOptions = new ObservableValue<any>({})

        service.hasFocus.setValue(true)
        service.focusedEntry.setValue(service.data.getValue().entries[1])

        initializeShadeRoot({
          injector,
          rootElement,
          jsxElement: (
            <DataGrid<TestEntry, 'id' | 'name'>
              columns={['id', 'name']}
              collectionService={service}
              findOptions={findOptions}
              styles={{}}
              headerComponents={{}}
              rowComponents={{}}
            />
          ),
        })

        await sleepAsync(50)

        const keydownEvent = new KeyboardEvent('keydown', { key: 'ArrowUp', bubbles: true })
        window.dispatchEvent(keydownEvent)

        expect(service.focusedEntry.getValue()).toEqual({ id: 1, name: 'First' })

        service[Symbol.dispose]()
        findOptions[Symbol.dispose]()
      })
    })

    it('should handle Home to move focus to first entry', async () => {
      await usingAsync(new Injector(), async (injector) => {
        const rootElement = document.getElementById('root') as HTMLDivElement
        const service = createTestService()
        const findOptions = new ObservableValue<any>({})

        service.hasFocus.setValue(true)
        service.focusedEntry.setValue(service.data.getValue().entries[2])

        initializeShadeRoot({
          injector,
          rootElement,
          jsxElement: (
            <DataGrid<TestEntry, 'id' | 'name'>
              columns={['id', 'name']}
              collectionService={service}
              findOptions={findOptions}
              styles={{}}
              headerComponents={{}}
              rowComponents={{}}
            />
          ),
        })

        await sleepAsync(50)

        const keydownEvent = new KeyboardEvent('keydown', { key: 'Home', bubbles: true })
        window.dispatchEvent(keydownEvent)

        expect(service.focusedEntry.getValue()).toEqual({ id: 1, name: 'First' })

        service[Symbol.dispose]()
        findOptions[Symbol.dispose]()
      })
    })

    it('should handle End to move focus to last entry', async () => {
      await usingAsync(new Injector(), async (injector) => {
        const rootElement = document.getElementById('root') as HTMLDivElement
        const service = createTestService()
        const findOptions = new ObservableValue<any>({})

        service.hasFocus.setValue(true)
        service.focusedEntry.setValue(service.data.getValue().entries[0])

        initializeShadeRoot({
          injector,
          rootElement,
          jsxElement: (
            <DataGrid<TestEntry, 'id' | 'name'>
              columns={['id', 'name']}
              collectionService={service}
              findOptions={findOptions}
              styles={{}}
              headerComponents={{}}
              rowComponents={{}}
            />
          ),
        })

        await sleepAsync(50)

        const keydownEvent = new KeyboardEvent('keydown', { key: 'End', bubbles: true })
        window.dispatchEvent(keydownEvent)

        expect(service.focusedEntry.getValue()).toEqual({ id: 3, name: 'Third' })

        service[Symbol.dispose]()
        findOptions[Symbol.dispose]()
      })
    })

    it('should handle Tab to toggle focus', async () => {
      await usingAsync(new Injector(), async (injector) => {
        const rootElement = document.getElementById('root') as HTMLDivElement
        const service = createTestService()
        const findOptions = new ObservableValue<any>({})

        service.hasFocus.setValue(true)

        initializeShadeRoot({
          injector,
          rootElement,
          jsxElement: (
            <DataGrid<TestEntry, 'id' | 'name'>
              columns={['id', 'name']}
              collectionService={service}
              findOptions={findOptions}
              styles={{}}
              headerComponents={{}}
              rowComponents={{}}
            />
          ),
        })

        await sleepAsync(50)

        const keydownEvent = new KeyboardEvent('keydown', { key: 'Tab', bubbles: true })
        window.dispatchEvent(keydownEvent)

        expect(service.hasFocus.getValue()).toBe(false)

        service[Symbol.dispose]()
        findOptions[Symbol.dispose]()
      })
    })

    it('should handle Escape to clear selection and search', async () => {
      await usingAsync(new Injector(), async (injector) => {
        const rootElement = document.getElementById('root') as HTMLDivElement
        const service = createTestService()
        const findOptions = new ObservableValue<any>({})

        const { entries } = service.data.getValue()
        service.hasFocus.setValue(true)
        service.selection.setValue([entries[0], entries[1]])
        service.searchTerm.setValue('test')

        initializeShadeRoot({
          injector,
          rootElement,
          jsxElement: (
            <DataGrid<TestEntry, 'id' | 'name'>
              columns={['id', 'name']}
              collectionService={service}
              findOptions={findOptions}
              styles={{}}
              headerComponents={{}}
              rowComponents={{}}
            />
          ),
        })

        await sleepAsync(50)

        const keydownEvent = new KeyboardEvent('keydown', { key: 'Escape', bubbles: true })
        window.dispatchEvent(keydownEvent)

        expect(service.selection.getValue()).toEqual([])
        expect(service.searchTerm.getValue()).toBe('')

        service[Symbol.dispose]()
        findOptions[Symbol.dispose]()
      })
    })

    it('should handle Space to toggle selection of focused entry', async () => {
      await usingAsync(new Injector(), async (injector) => {
        const rootElement = document.getElementById('root') as HTMLDivElement
        const service = createTestService()
        const findOptions = new ObservableValue<any>({})

        const { entries } = service.data.getValue()
        service.hasFocus.setValue(true)
        service.focusedEntry.setValue(entries[0])

        initializeShadeRoot({
          injector,
          rootElement,
          jsxElement: (
            <DataGrid<TestEntry, 'id' | 'name'>
              columns={['id', 'name']}
              collectionService={service}
              findOptions={findOptions}
              styles={{}}
              headerComponents={{}}
              rowComponents={{}}
            />
          ),
        })

        await sleepAsync(50)

        const keydownEvent = new KeyboardEvent('keydown', { key: ' ', bubbles: true })
        window.dispatchEvent(keydownEvent)

        expect(service.selection.getValue()).toContain(entries[0])

        window.dispatchEvent(new KeyboardEvent('keydown', { key: ' ', bubbles: true }))
        expect(service.selection.getValue()).not.toContain(entries[0])

        service[Symbol.dispose]()
        findOptions[Symbol.dispose]()
      })
    })

    it('should handle + to select all entries', async () => {
      await usingAsync(new Injector(), async (injector) => {
        const rootElement = document.getElementById('root') as HTMLDivElement
        const service = createTestService()
        const findOptions = new ObservableValue<any>({})

        service.hasFocus.setValue(true)

        initializeShadeRoot({
          injector,
          rootElement,
          jsxElement: (
            <DataGrid<TestEntry, 'id' | 'name'>
              columns={['id', 'name']}
              collectionService={service}
              findOptions={findOptions}
              styles={{}}
              headerComponents={{}}
              rowComponents={{}}
            />
          ),
        })

        await sleepAsync(50)

        const keydownEvent = new KeyboardEvent('keydown', { key: '+', bubbles: true })
        window.dispatchEvent(keydownEvent)

        expect(service.selection.getValue().length).toBe(3)

        service[Symbol.dispose]()
        findOptions[Symbol.dispose]()
      })
    })

    it('should handle - to deselect all entries', async () => {
      await usingAsync(new Injector(), async (injector) => {
        const rootElement = document.getElementById('root') as HTMLDivElement
        const service = createTestService()
        const findOptions = new ObservableValue<any>({})

        const { entries } = service.data.getValue()
        service.hasFocus.setValue(true)
        service.selection.setValue([...entries])

        initializeShadeRoot({
          injector,
          rootElement,
          jsxElement: (
            <DataGrid<TestEntry, 'id' | 'name'>
              columns={['id', 'name']}
              collectionService={service}
              findOptions={findOptions}
              styles={{}}
              headerComponents={{}}
              rowComponents={{}}
            />
          ),
        })

        await sleepAsync(50)

        const keydownEvent = new KeyboardEvent('keydown', { key: '-', bubbles: true })
        window.dispatchEvent(keydownEvent)

        expect(service.selection.getValue().length).toBe(0)

        service[Symbol.dispose]()
        findOptions[Symbol.dispose]()
      })
    })

    it('should handle * to invert selection', async () => {
      await usingAsync(new Injector(), async (injector) => {
        const rootElement = document.getElementById('root') as HTMLDivElement
        const service = createTestService()
        const findOptions = new ObservableValue<any>({})

        const { entries } = service.data.getValue()
        service.hasFocus.setValue(true)
        service.selection.setValue([entries[0]])

        initializeShadeRoot({
          injector,
          rootElement,
          jsxElement: (
            <DataGrid<TestEntry, 'id' | 'name'>
              columns={['id', 'name']}
              collectionService={service}
              findOptions={findOptions}
              styles={{}}
              headerComponents={{}}
              rowComponents={{}}
            />
          ),
        })

        await sleepAsync(50)

        const keydownEvent = new KeyboardEvent('keydown', { key: '*', bubbles: true })
        window.dispatchEvent(keydownEvent)

        const selection = service.selection.getValue()
        expect(selection).not.toContain(entries[0])
        expect(selection).toContain(entries[1])
        expect(selection).toContain(entries[2])

        service[Symbol.dispose]()
        findOptions[Symbol.dispose]()
      })
    })

    it('should not handle keyboard when not focused', async () => {
      await usingAsync(new Injector(), async (injector) => {
        const rootElement = document.getElementById('root') as HTMLDivElement
        const service = createTestService()
        const findOptions = new ObservableValue<any>({})

        service.hasFocus.setValue(false)
        service.focusedEntry.setValue(service.data.getValue().entries[0])

        initializeShadeRoot({
          injector,
          rootElement,
          jsxElement: (
            <DataGrid<TestEntry, 'id' | 'name'>
              columns={['id', 'name']}
              collectionService={service}
              findOptions={findOptions}
              styles={{}}
              headerComponents={{}}
              rowComponents={{}}
            />
          ),
        })

        await sleepAsync(50)

        const keydownEvent = new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true })
        window.dispatchEvent(keydownEvent)

        expect(service.focusedEntry.getValue()).toEqual({ id: 1, name: 'First' })

        service[Symbol.dispose]()
        findOptions[Symbol.dispose]()
      })
    })

    it('should handle Insert to toggle selection and move to next', async () => {
      await usingAsync(new Injector(), async (injector) => {
        const rootElement = document.getElementById('root') as HTMLDivElement
        const service = createTestService()
        const findOptions = new ObservableValue<any>({})

        const { entries } = service.data.getValue()
        service.hasFocus.setValue(true)
        service.focusedEntry.setValue(entries[0])

        initializeShadeRoot({
          injector,
          rootElement,
          jsxElement: (
            <DataGrid<TestEntry, 'id' | 'name'>
              columns={['id', 'name']}
              collectionService={service}
              findOptions={findOptions}
              styles={{}}
              headerComponents={{}}
              rowComponents={{}}
            />
          ),
        })

        await sleepAsync(50)

        const keydownEvent = new KeyboardEvent('keydown', { key: 'Insert', bubbles: true })
        window.dispatchEvent(keydownEvent)

        expect(service.selection.getValue()).toContain(entries[0])
        expect(service.focusedEntry.getValue()).toEqual(entries[1])

        service[Symbol.dispose]()
        findOptions[Symbol.dispose]()
      })
    })
  })

  describe('styles', () => {
    it('should apply wrapper styles when provided', async () => {
      await usingAsync(new Injector(), async (injector) => {
        const rootElement = document.getElementById('root') as HTMLDivElement
        const service = createTestService()
        const findOptions = new ObservableValue<any>({})

        initializeShadeRoot({
          injector,
          rootElement,
          jsxElement: (
            <DataGrid<TestEntry, 'id' | 'name'>
              columns={['id', 'name']}
              collectionService={service}
              findOptions={findOptions}
              styles={{
                wrapper: { backgroundColor: 'red' },
              }}
              headerComponents={{}}
              rowComponents={{}}
            />
          ),
        })

        await sleepAsync(50)

        const grid = document.querySelector('shade-data-grid') as HTMLElement
        expect(grid?.style.backgroundColor).toBe('red')

        service[Symbol.dispose]()
        findOptions[Symbol.dispose]()
      })
    })

    it('should apply header styles when provided', async () => {
      await usingAsync(new Injector(), async (injector) => {
        const rootElement = document.getElementById('root') as HTMLDivElement
        const service = createTestService()
        const findOptions = new ObservableValue<any>({})

        initializeShadeRoot({
          injector,
          rootElement,
          jsxElement: (
            <DataGrid<TestEntry, 'id' | 'name'>
              columns={['id', 'name']}
              collectionService={service}
              findOptions={findOptions}
              styles={{
                header: { color: 'blue' },
              }}
              headerComponents={{}}
              rowComponents={{}}
            />
          ),
        })

        await sleepAsync(50)

        const grid = document.querySelector('shade-data-grid')
        const headers = grid?.querySelectorAll('th') as NodeListOf<HTMLElement>
        expect(headers?.[0]?.style.color).toBe('blue')

        service[Symbol.dispose]()
        findOptions[Symbol.dispose]()
      })
    })
  })

  describe('empty and loading states', () => {
    it('should show empty component when no data', async () => {
      await usingAsync(new Injector(), async (injector) => {
        const rootElement = document.getElementById('root') as HTMLDivElement
        const service = new CollectionService<TestEntry>()
        const findOptions = new ObservableValue<any>({})

        initializeShadeRoot({
          injector,
          rootElement,
          jsxElement: (
            <DataGrid<TestEntry, 'id' | 'name'>
              columns={['id', 'name']}
              collectionService={service}
              findOptions={findOptions}
              styles={{}}
              headerComponents={{}}
              rowComponents={{}}
              emptyComponent={<div data-testid="empty-state">No data available</div>}
            />
          ),
        })

        await sleepAsync(50)

        const grid = document.querySelector('shade-data-grid')
        const emptyState = grid?.querySelector('[data-testid="empty-state"]')
        expect(emptyState).not.toBeNull()
        expect(emptyState?.textContent).toBe('No data available')

        service[Symbol.dispose]()
        findOptions[Symbol.dispose]()
      })
    })
  })

  describe('row interactions', () => {
    it('should pass row click to collectionService', async () => {
      await usingAsync(new Injector(), async (injector) => {
        const rootElement = document.getElementById('root') as HTMLDivElement
        const onRowClick = vi.fn()
        const service = new CollectionService<TestEntry>({ onRowClick })
        const findOptions = new ObservableValue<any>({})

        service.data.setValue({
          count: 1,
          entries: [{ id: 1, name: 'Test' }],
        })

        initializeShadeRoot({
          injector,
          rootElement,
          jsxElement: (
            <DataGrid<TestEntry, 'id' | 'name'>
              columns={['id', 'name']}
              collectionService={service}
              findOptions={findOptions}
              styles={{}}
              headerComponents={{}}
              rowComponents={{}}
            />
          ),
        })

        await sleepAsync(50)

        const grid = document.querySelector('shade-data-grid')
        const cell = grid?.querySelector('td') as HTMLTableCellElement
        cell?.click()

        expect(onRowClick).toHaveBeenCalledWith({ id: 1, name: 'Test' })

        service[Symbol.dispose]()
        findOptions[Symbol.dispose]()
      })
    })

    it('should pass row double click to collectionService', async () => {
      await usingAsync(new Injector(), async (injector) => {
        const rootElement = document.getElementById('root') as HTMLDivElement
        const onRowDoubleClick = vi.fn()
        const service = new CollectionService<TestEntry>({ onRowDoubleClick })
        const findOptions = new ObservableValue<any>({})

        service.data.setValue({
          count: 1,
          entries: [{ id: 1, name: 'Test' }],
        })

        initializeShadeRoot({
          injector,
          rootElement,
          jsxElement: (
            <DataGrid<TestEntry, 'id' | 'name'>
              columns={['id', 'name']}
              collectionService={service}
              findOptions={findOptions}
              styles={{}}
              headerComponents={{}}
              rowComponents={{}}
            />
          ),
        })

        await sleepAsync(50)

        const grid = document.querySelector('shade-data-grid')
        const cell = grid?.querySelector('td') as HTMLTableCellElement
        const dblClickEvent = new MouseEvent('dblclick', { bubbles: true })
        cell?.dispatchEvent(dblClickEvent)

        expect(onRowDoubleClick).toHaveBeenCalledWith({ id: 1, name: 'Test' })

        service[Symbol.dispose]()
        findOptions[Symbol.dispose]()
      })
    })
  })

  describe('keyboard listener cleanup', () => {
    it('should remove keyboard listener when component is disconnected', async () => {
      await usingAsync(new Injector(), async (injector) => {
        const rootElement = document.getElementById('root') as HTMLDivElement
        const service = createTestService()
        const findOptions = new ObservableValue<any>({})

        service.hasFocus.setValue(true)
        service.focusedEntry.setValue(service.data.getValue().entries[0])

        initializeShadeRoot({
          injector,
          rootElement,
          jsxElement: (
            <DataGrid<TestEntry, 'id' | 'name'>
              columns={['id', 'name']}
              collectionService={service}
              findOptions={findOptions}
              styles={{}}
              headerComponents={{}}
              rowComponents={{}}
            />
          ),
        })

        await sleepAsync(50)

        const grid = document.querySelector('shade-data-grid') as HTMLElement
        grid.remove()

        await sleepAsync(10)

        window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }))
        expect(service.focusedEntry.getValue()).toEqual({ id: 1, name: 'First' })

        service[Symbol.dispose]()
        findOptions[Symbol.dispose]()
      })
    })
  })
})
