import type { FindOptions } from '@furystack/core'
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

  const withTestGrid = async (
    fn: (ctx: {
      injector: Injector
      service: CollectionService<TestEntry>
      findOptions: ObservableValue<FindOptions<TestEntry, Array<keyof TestEntry>>>
    }) => Promise<void>,
    opts?: { createService?: () => CollectionService<TestEntry> },
  ) => {
    await usingAsync(new Injector(), async (injector) => {
      await usingAsync(opts?.createService?.() ?? createTestService(), async (service) => {
        await usingAsync(
          new ObservableValue<FindOptions<TestEntry, Array<keyof TestEntry>>>({}),
          async (findOptions) => {
            await fn({ injector, service, findOptions })
          },
        )
      })
    })
  }

  describe('rendering', () => {
    it('should render with columns', async () => {
      await withTestGrid(async ({ injector, service, findOptions }) => {
        const rootElement = document.getElementById('root') as HTMLDivElement

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
      })
    })

    it('should render table structure', async () => {
      await withTestGrid(async ({ injector, service, findOptions }) => {
        const rootElement = document.getElementById('root') as HTMLDivElement

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
      })
    })

    it('should render custom header components when provided', async () => {
      await withTestGrid(async ({ injector, service, findOptions }) => {
        const rootElement = document.getElementById('root') as HTMLDivElement

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
      })
    })

    it('should render default header components from headerComponents.default', async () => {
      await withTestGrid(async ({ injector, service, findOptions }) => {
        const rootElement = document.getElementById('root') as HTMLDivElement

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
      })
    })

    it('should render DataGridHeader when no custom header is provided', async () => {
      await withTestGrid(async ({ injector, service, findOptions }) => {
        const rootElement = document.getElementById('root') as HTMLDivElement

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
      })
    })
  })

  describe('focus management', () => {
    it('should set focus on click', async () => {
      await withTestGrid(async ({ injector, service, findOptions }) => {
        const rootElement = document.getElementById('root') as HTMLDivElement

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
      })
    })

    it('should lose focus on click outside', async () => {
      await withTestGrid(async ({ injector, service, findOptions }) => {
        const rootElement = document.getElementById('root') as HTMLDivElement

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
      })
    })
  })

  describe('keyboard navigation', () => {
    it('should handle ArrowDown to move focus to next entry', async () => {
      await withTestGrid(async ({ injector, service, findOptions }) => {
        const rootElement = document.getElementById('root') as HTMLDivElement

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
      })
    })

    it('should handle ArrowUp to move focus to previous entry', async () => {
      await withTestGrid(async ({ injector, service, findOptions }) => {
        const rootElement = document.getElementById('root') as HTMLDivElement

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
      })
    })

    it('should handle Home to move focus to first entry', async () => {
      await withTestGrid(async ({ injector, service, findOptions }) => {
        const rootElement = document.getElementById('root') as HTMLDivElement

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
      })
    })

    it('should handle End to move focus to last entry', async () => {
      await withTestGrid(async ({ injector, service, findOptions }) => {
        const rootElement = document.getElementById('root') as HTMLDivElement

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
      })
    })

    it('should handle Tab to toggle focus', async () => {
      await withTestGrid(async ({ injector, service, findOptions }) => {
        const rootElement = document.getElementById('root') as HTMLDivElement

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
      })
    })

    it('should handle Escape to clear selection and search', async () => {
      await withTestGrid(async ({ injector, service, findOptions }) => {
        const rootElement = document.getElementById('root') as HTMLDivElement

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
      })
    })

    it('should handle Space to toggle selection of focused entry', async () => {
      await withTestGrid(async ({ injector, service, findOptions }) => {
        const rootElement = document.getElementById('root') as HTMLDivElement

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
      })
    })

    it('should handle + to select all entries', async () => {
      await withTestGrid(async ({ injector, service, findOptions }) => {
        const rootElement = document.getElementById('root') as HTMLDivElement

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
      })
    })

    it('should handle - to deselect all entries', async () => {
      await withTestGrid(async ({ injector, service, findOptions }) => {
        const rootElement = document.getElementById('root') as HTMLDivElement

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
      })
    })

    it('should handle * to invert selection', async () => {
      await withTestGrid(async ({ injector, service, findOptions }) => {
        const rootElement = document.getElementById('root') as HTMLDivElement

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
      })
    })

    it('should not handle keyboard when not focused', async () => {
      await withTestGrid(async ({ injector, service, findOptions }) => {
        const rootElement = document.getElementById('root') as HTMLDivElement

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
      })
    })

    it('should handle Insert to toggle selection and move to next', async () => {
      await withTestGrid(async ({ injector, service, findOptions }) => {
        const rootElement = document.getElementById('root') as HTMLDivElement

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
      })
    })
  })

  describe('styles', () => {
    it('should apply wrapper styles when provided', async () => {
      await withTestGrid(async ({ injector, service, findOptions }) => {
        const rootElement = document.getElementById('root') as HTMLDivElement

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
      })
    })

    it('should apply header styles when provided', async () => {
      await withTestGrid(async ({ injector, service, findOptions }) => {
        const rootElement = document.getElementById('root') as HTMLDivElement

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
      })
    })
  })

  describe('empty and loading states', () => {
    it('should show empty component when no data', async () => {
      await withTestGrid(
        async ({ injector, service, findOptions }) => {
          const rootElement = document.getElementById('root') as HTMLDivElement

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
        },
        { createService: () => new CollectionService<TestEntry>() },
      )
    })
  })

  describe('row interactions', () => {
    it('should pass row click to collectionService', async () => {
      const onRowClick = vi.fn()
      await withTestGrid(
        async ({ injector, service, findOptions }) => {
          const rootElement = document.getElementById('root') as HTMLDivElement

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
        },
        { createService: () => new CollectionService<TestEntry>({ onRowClick }) },
      )
    })

    it('should pass row double click to collectionService', async () => {
      const onRowDoubleClick = vi.fn()
      await withTestGrid(
        async ({ injector, service, findOptions }) => {
          const rootElement = document.getElementById('root') as HTMLDivElement

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
        },
        { createService: () => new CollectionService<TestEntry>({ onRowDoubleClick }) },
      )
    })
  })

  describe('keyboard listener cleanup', () => {
    it('should remove keyboard listener when component is disconnected', async () => {
      await withTestGrid(async ({ injector, service, findOptions }) => {
        const rootElement = document.getElementById('root') as HTMLDivElement

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
      })
    })
  })
})
