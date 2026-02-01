import { Injector } from '@furystack/inject'
import { createComponent, initializeShadeRoot } from '@furystack/shades'
import { sleepAsync } from '@furystack/utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { CollectionService } from '../../services/collection-service.js'
import { DataGridBody } from './body.js'

type TestEntry = { id: number; name: string }

describe('DataGridBody', () => {
  beforeEach(() => {
    document.body.innerHTML = '<div id="root"></div>'
  })

  afterEach(() => {
    document.body.innerHTML = ''
  })

  it('should render default empty component when no data', async () => {
    const injector = new Injector()
    const rootElement = document.getElementById('root') as HTMLDivElement
    const service = new CollectionService<TestEntry>()

    initializeShadeRoot({
      injector,
      rootElement,
      jsxElement: (
        <table>
          <DataGridBody<TestEntry, 'id' | 'name'> service={service} columns={['id', 'name']} />
        </table>
      ),
    })

    await sleepAsync(50)

    const body = document.querySelector('tbody[is="shade-data-grid-body"]')
    expect(body).not.toBeNull()
    expect(body?.textContent).toContain('- No Data -')

    service[Symbol.dispose]()
  })

  it('should render custom empty component when provided and no data', async () => {
    const injector = new Injector()
    const rootElement = document.getElementById('root') as HTMLDivElement
    const service = new CollectionService<TestEntry>()

    initializeShadeRoot({
      injector,
      rootElement,
      jsxElement: (
        <table>
          <DataGridBody<TestEntry, 'id' | 'name'>
            service={service}
            columns={['id', 'name']}
            emptyComponent={<div data-testid="custom-empty">Custom Empty State</div>}
          />
        </table>
      ),
    })

    await sleepAsync(50)

    const body = document.querySelector('tbody[is="shade-data-grid-body"]')
    expect(body).not.toBeNull()
    expect(body?.querySelector('[data-testid="custom-empty"]')).not.toBeNull()
    expect(body?.textContent).toContain('Custom Empty State')

    service[Symbol.dispose]()
  })

  it('should render rows for each data entry', async () => {
    const injector = new Injector()
    const rootElement = document.getElementById('root') as HTMLDivElement
    const service = new CollectionService<TestEntry>()

    service.data.setValue({
      count: 2,
      entries: [
        { id: 1, name: 'First' },
        { id: 2, name: 'Second' },
      ],
    })

    initializeShadeRoot({
      injector,
      rootElement,
      jsxElement: (
        <table>
          <DataGridBody<TestEntry, 'id' | 'name'> service={service} columns={['id', 'name']} />
        </table>
      ),
    })

    await sleepAsync(50)

    const body = document.querySelector('tbody[is="shade-data-grid-body"]')
    expect(body).not.toBeNull()

    const rows = body?.querySelectorAll('shades-data-grid-row')
    expect(rows?.length).toBe(2)

    service[Symbol.dispose]()
  })

  it('should render cell content from entry properties', async () => {
    const injector = new Injector()
    const rootElement = document.getElementById('root') as HTMLDivElement
    const service = new CollectionService<TestEntry>()

    service.data.setValue({
      count: 1,
      entries: [{ id: 42, name: 'Test Entry' }],
    })

    initializeShadeRoot({
      injector,
      rootElement,
      jsxElement: (
        <table>
          <DataGridBody<TestEntry, 'id' | 'name'> service={service} columns={['id', 'name']} />
        </table>
      ),
    })

    await sleepAsync(50)

    const body = document.querySelector('tbody[is="shade-data-grid-body"]')
    const cells = body?.querySelectorAll('td')

    expect(cells?.length).toBe(2)
    expect(cells?.[0]?.textContent).toBe('42')
    expect(cells?.[1]?.textContent).toBe('Test Entry')

    service[Symbol.dispose]()
  })

  it('should re-render when data observable changes', async () => {
    const injector = new Injector()
    const rootElement = document.getElementById('root') as HTMLDivElement
    const service = new CollectionService<TestEntry>()

    initializeShadeRoot({
      injector,
      rootElement,
      jsxElement: (
        <table>
          <DataGridBody<TestEntry, 'id' | 'name'> service={service} columns={['id', 'name']} />
        </table>
      ),
    })

    await sleepAsync(50)

    let body = document.querySelector('tbody[is="shade-data-grid-body"]')
    expect(body?.textContent).toContain('- No Data -')

    service.data.setValue({
      count: 1,
      entries: [{ id: 1, name: 'New Entry' }],
    })

    await sleepAsync(50)

    body = document.querySelector('tbody[is="shade-data-grid-body"]')
    const rows = body?.querySelectorAll('shades-data-grid-row')
    expect(rows?.length).toBe(1)

    service[Symbol.dispose]()
  })

  it('should call onRowClick callback when row is clicked', async () => {
    const injector = new Injector()
    const rootElement = document.getElementById('root') as HTMLDivElement
    const service = new CollectionService<TestEntry>()
    const onRowClick = vi.fn()

    const entry = { id: 1, name: 'Clickable' }
    service.data.setValue({
      count: 1,
      entries: [entry],
    })

    initializeShadeRoot({
      injector,
      rootElement,
      jsxElement: (
        <table>
          <DataGridBody<TestEntry, 'id' | 'name'> service={service} columns={['id', 'name']} onRowClick={onRowClick} />
        </table>
      ),
    })

    await sleepAsync(50)

    const cell = document.querySelector('td') as HTMLTableCellElement
    cell.click()

    expect(onRowClick).toHaveBeenCalledWith(entry, expect.any(MouseEvent))

    service[Symbol.dispose]()
  })

  it('should call onRowDoubleClick callback when row is double-clicked', async () => {
    const injector = new Injector()
    const rootElement = document.getElementById('root') as HTMLDivElement
    const service = new CollectionService<TestEntry>()
    const onRowDoubleClick = vi.fn()

    const entry = { id: 1, name: 'DoubleClickable' }
    service.data.setValue({
      count: 1,
      entries: [entry],
    })

    initializeShadeRoot({
      injector,
      rootElement,
      jsxElement: (
        <table>
          <DataGridBody<TestEntry, 'id' | 'name'>
            service={service}
            columns={['id', 'name']}
            onRowDoubleClick={onRowDoubleClick}
          />
        </table>
      ),
    })

    await sleepAsync(50)

    const cell = document.querySelector('td') as HTMLTableCellElement
    const dblClickEvent = new MouseEvent('dblclick', { bubbles: true })
    cell.dispatchEvent(dblClickEvent)

    expect(onRowDoubleClick).toHaveBeenCalledWith(entry, expect.any(MouseEvent))

    service[Symbol.dispose]()
  })

  it('should use custom row components when provided', async () => {
    const injector = new Injector()
    const rootElement = document.getElementById('root') as HTMLDivElement
    const service = new CollectionService<TestEntry>()

    service.data.setValue({
      count: 1,
      entries: [{ id: 1, name: 'Custom' }],
    })

    initializeShadeRoot({
      injector,
      rootElement,
      jsxElement: (
        <table>
          <DataGridBody<TestEntry, 'id' | 'name'>
            service={service}
            columns={['id', 'name']}
            rowComponents={{
              id: (entry) => <span data-testid="custom-id">ID: {entry.id}</span>,
              name: (entry) => <strong data-testid="custom-name">{entry.name}</strong>,
            }}
          />
        </table>
      ),
    })

    await sleepAsync(50)

    const customId = document.querySelector('[data-testid="custom-id"]')
    const customName = document.querySelector('[data-testid="custom-name"]')

    expect(customId?.textContent).toContain('ID: 1')
    expect(customName?.textContent).toBe('Custom')

    service[Symbol.dispose]()
  })

  it('should use default row component when column-specific one is not provided', async () => {
    const injector = new Injector()
    const rootElement = document.getElementById('root') as HTMLDivElement
    const service = new CollectionService<TestEntry>()

    service.data.setValue({
      count: 1,
      entries: [{ id: 1, name: 'Default' }],
    })

    initializeShadeRoot({
      injector,
      rootElement,
      jsxElement: (
        <table>
          <DataGridBody<TestEntry, 'id' | 'name'>
            service={service}
            columns={['id', 'name']}
            rowComponents={{
              default: (entry) => <em data-testid="default-cell">{JSON.stringify(entry)}</em>,
            }}
          />
        </table>
      ),
    })

    await sleepAsync(50)

    const defaultCells = document.querySelectorAll('[data-testid="default-cell"]')
    expect(defaultCells.length).toBe(2)

    service[Symbol.dispose]()
  })

  it('should render with empty entries array', async () => {
    const injector = new Injector()
    const rootElement = document.getElementById('root') as HTMLDivElement
    const service = new CollectionService<TestEntry>()

    service.data.setValue({
      count: 0,
      entries: [],
    })

    initializeShadeRoot({
      injector,
      rootElement,
      jsxElement: (
        <table>
          <DataGridBody<TestEntry, 'id' | 'name'> service={service} columns={['id', 'name']} />
        </table>
      ),
    })

    await sleepAsync(50)

    const body = document.querySelector('tbody[is="shade-data-grid-body"]')
    expect(body?.textContent).toContain('- No Data -')

    service[Symbol.dispose]()
  })
})
