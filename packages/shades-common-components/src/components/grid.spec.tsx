import { Injector } from '@furystack/inject'
import { createComponent, initializeShadeRoot } from '@furystack/shades'
import { sleepAsync, usingAsync } from '@furystack/utils'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { Grid, type GridProps, type HeaderCells, type RowCells } from './grid.js'

type TestEntry = { id: number; name: string; value: string }
type TestColumns = 'id' | 'name' | 'value'

describe('Grid', () => {
  beforeEach(() => {
    document.body.innerHTML = '<div id="root"></div>'
  })

  afterEach(() => {
    document.body.innerHTML = ''
  })

  const renderGrid = async (props: GridProps<TestEntry, TestColumns>) => {
    const injector = new Injector()
    const root = document.getElementById('root')!
    initializeShadeRoot({
      injector,
      rootElement: root,
      jsxElement: <Grid {...props} />,
    })
    await sleepAsync(50)
    const grid = document.querySelector('shade-grid') as HTMLElement
    return {
      injector,
      grid,
      table: grid?.querySelector('table') as HTMLTableElement,
      [Symbol.asyncDispose]: () => injector[Symbol.asyncDispose](),
    }
  }

  describe('rendering', () => {
    it('should render a grid element as custom element', async () => {
      await usingAsync(
        await renderGrid({
          columns: ['id', 'name'],
          entries: [],
        }),
        async ({ grid }) => {
          expect(grid).toBeTruthy()
          expect(grid.tagName.toLowerCase()).toBe('shade-grid')
        },
      )
    })

    it('should render a table inside the grid element', async () => {
      await usingAsync(
        await renderGrid({
          columns: ['id', 'name'],
          entries: [],
        }),
        async ({ table }) => {
          expect(table).toBeTruthy()
          expect(table.tagName.toLowerCase()).toBe('table')
        },
      )
    })

    it('should render thead and tbody', async () => {
      await usingAsync(
        await renderGrid({
          columns: ['id', 'name'],
          entries: [],
        }),
        async ({ table }) => {
          expect(table.querySelector('thead')).toBeTruthy()
          expect(table.querySelector('tbody')).toBeTruthy()
        },
      )
    })
  })

  describe('columns', () => {
    it('should render column headers', async () => {
      await usingAsync(
        await renderGrid({
          columns: ['id', 'name', 'value'],
          entries: [],
        }),
        async ({ table }) => {
          const headers = table.querySelectorAll('th')
          expect(headers.length).toBe(3)
        },
      )
    })

    it('should render column names as header text by default', async () => {
      await usingAsync(
        await renderGrid({
          columns: ['id', 'name', 'value'],
          entries: [],
        }),
        async ({ table }) => {
          const headers = table.querySelectorAll('th')
          expect(headers[0].textContent).toBe('id')
          expect(headers[1].textContent).toBe('name')
          expect(headers[2].textContent).toBe('value')
        },
      )
    })

    it('should use custom header components when provided', async () => {
      const headerComponents: HeaderCells<TestColumns> = {
        id: (name) => <span>ID Header: {name}</span>,
        name: (name) => <span>Name Header: {name}</span>,
      }
      await usingAsync(
        await renderGrid({
          columns: ['id', 'name', 'value'],
          entries: [],
          headerComponents,
        }),
        async ({ table }) => {
          const headers = table.querySelectorAll('th')
          expect(headers[0].textContent).toContain('ID Header: id')
          expect(headers[1].textContent).toContain('Name Header: name')
          expect(headers[2].textContent).toBe('value')
        },
      )
    })

    it('should use default header component for unspecified columns', async () => {
      const headerComponents: HeaderCells<TestColumns> = {
        default: (name) => <strong>{name.toUpperCase()}</strong>,
      }
      await usingAsync(
        await renderGrid({
          columns: ['id', 'name'],
          entries: [],
          headerComponents,
        }),
        async ({ table }) => {
          const headers = table.querySelectorAll('th')
          expect(headers[0].textContent).toBe('ID')
          expect(headers[1].textContent).toBe('NAME')
        },
      )
    })

    it('should prefer specific header component over default', async () => {
      const headerComponents: HeaderCells<TestColumns> = {
        id: () => <span>Custom ID</span>,
        default: (name) => <span>Default: {name}</span>,
      }
      await usingAsync(
        await renderGrid({
          columns: ['id', 'name'],
          entries: [],
          headerComponents,
        }),
        async ({ table }) => {
          const headers = table.querySelectorAll('th')
          expect(headers[0].textContent).toBe('Custom ID')
          expect(headers[1].textContent).toBe('Default: name')
        },
      )
    })
  })

  describe('rows', () => {
    const testEntries: TestEntry[] = [
      { id: 1, name: 'Item 1', value: 'Value 1' },
      { id: 2, name: 'Item 2', value: 'Value 2' },
      { id: 3, name: 'Item 3', value: 'Value 3' },
    ]

    it('should render rows for each entry', async () => {
      await usingAsync(
        await renderGrid({
          columns: ['id', 'name'],
          entries: testEntries,
          rowComponents: {
            default: (entry, column) => <span>{String(entry[column])}</span>,
          },
        }),
        async ({ table }) => {
          const rows = table.querySelectorAll('tbody tr')
          expect(rows.length).toBe(3)
        },
      )
    })

    it('should render cells for each column in each row', async () => {
      await usingAsync(
        await renderGrid({
          columns: ['id', 'name', 'value'],
          entries: testEntries,
          rowComponents: {
            default: (entry, column) => <span>{String(entry[column])}</span>,
          },
        }),
        async ({ table }) => {
          const firstRow = table.querySelector('tbody tr')!
          const cells = firstRow.querySelectorAll('td')
          expect(cells.length).toBe(3)
        },
      )
    })

    it('should use custom row components when provided', async () => {
      const rowComponents: RowCells<TestEntry, TestColumns> = {
        id: (entry) => <span>ID: {entry.id}</span>,
        name: (entry) => <strong>{entry.name}</strong>,
      }
      await usingAsync(
        await renderGrid({
          columns: ['id', 'name', 'value'],
          entries: [testEntries[0]],
          rowComponents,
        }),
        async ({ table }) => {
          const cells = table.querySelectorAll('tbody td')
          expect(cells[0].textContent).toBe('ID: 1')
          expect(cells[1].textContent).toBe('Item 1')
          expect(cells[2].textContent).toBe('')
        },
      )
    })

    it('should use default row component for unspecified columns', async () => {
      const rowComponents: RowCells<TestEntry, TestColumns> = {
        default: (entry, column) => <span>{String(entry[column])}</span>,
      }
      await usingAsync(
        await renderGrid({
          columns: ['id', 'name'],
          entries: [testEntries[0]],
          rowComponents,
        }),
        async ({ table }) => {
          const cells = table.querySelectorAll('tbody td')
          expect(cells[0].textContent).toBe('1')
          expect(cells[1].textContent).toBe('Item 1')
        },
      )
    })

    it('should prefer specific row component over default', async () => {
      const rowComponents: RowCells<TestEntry, TestColumns> = {
        id: (entry) => <span>Custom: {entry.id}</span>,
        default: (entry, column) => <span>Default: {String(entry[column])}</span>,
      }
      await usingAsync(
        await renderGrid({
          columns: ['id', 'name'],
          entries: [testEntries[0]],
          rowComponents,
        }),
        async ({ table }) => {
          const cells = table.querySelectorAll('tbody td')
          expect(cells[0].textContent).toBe('Custom: 1')
          expect(cells[1].textContent).toBe('Default: Item 1')
        },
      )
    })

    it('should render empty cells when no row component is provided', async () => {
      await usingAsync(
        await renderGrid({
          columns: ['id', 'name'],
          entries: [testEntries[0]],
        }),
        async ({ table }) => {
          const cells = table.querySelectorAll('tbody td')
          expect(cells[0].textContent).toBe('')
          expect(cells[1].textContent).toBe('')
        },
      )
    })
  })

  describe('empty state', () => {
    it('should render empty tbody when no entries', async () => {
      await usingAsync(
        await renderGrid({
          columns: ['id', 'name'],
          entries: [],
        }),
        async ({ table }) => {
          const rows = table.querySelectorAll('tbody tr')
          expect(rows.length).toBe(0)
        },
      )
    })

    it('should still render headers when no entries', async () => {
      await usingAsync(
        await renderGrid({
          columns: ['id', 'name', 'value'],
          entries: [],
        }),
        async ({ table }) => {
          const headers = table.querySelectorAll('th')
          expect(headers.length).toBe(3)
        },
      )
    })
  })

  describe('styles', () => {
    const testEntries: TestEntry[] = [{ id: 1, name: 'Item 1', value: 'Value 1' }]

    it('should apply wrapper styles to the grid element', async () => {
      await usingAsync(
        await renderGrid({
          columns: ['id', 'name'],
          entries: testEntries,
          rowComponents: {
            default: (entry, column) => <span>{String(entry[column])}</span>,
          },
          styles: {
            wrapper: { backgroundColor: 'rgb(255, 0, 0)' },
          },
        }),
        async ({ grid }) => {
          const computedStyle = window.getComputedStyle(grid)
          expect(computedStyle.backgroundColor).toBe('rgb(255, 0, 0)')
        },
      )
    })

    it('should apply header styles to th elements', async () => {
      await usingAsync(
        await renderGrid({
          columns: ['id', 'name'],
          entries: [],
          styles: {
            header: { color: 'rgb(0, 255, 0)' },
          },
        }),
        async ({ table }) => {
          const header = table.querySelector('th')!
          expect(header.style.color).toBe('rgb(0, 255, 0)')
        },
      )
    })

    it('should apply cell styles to td elements', async () => {
      await usingAsync(
        await renderGrid({
          columns: ['id'],
          entries: testEntries,
          rowComponents: {
            default: (entry, column) => <span>{String(entry[column])}</span>,
          },
          styles: {
            cell: { color: 'rgb(0, 0, 255)' },
          },
        }),
        async ({ table }) => {
          const cell = table.querySelector('td')!
          expect(cell.style.color).toBe('rgb(0, 0, 255)')
        },
      )
    })

    it('should apply multiple style properties', async () => {
      await usingAsync(
        await renderGrid({
          columns: ['id'],
          entries: testEntries,
          rowComponents: {
            default: (entry, column) => <span>{String(entry[column])}</span>,
          },
          styles: {
            wrapper: { margin: '10px', padding: '20px' },
            header: { fontWeight: 'bold' },
            cell: { textAlign: 'center' },
          },
        }),
        async ({ grid, table }) => {
          expect(window.getComputedStyle(grid).margin).toBe('10px')
          expect(window.getComputedStyle(grid).padding).toBe('20px')
          expect(table.querySelector('th')!.style.fontWeight).toBe('bold')
          expect(table.querySelector('td')!.style.textAlign).toBe('center')
        },
      )
    })
  })

  describe('default styles', () => {
    it('should have full width and height by default', async () => {
      await usingAsync(
        await renderGrid({
          columns: ['id'],
          entries: [],
        }),
        async ({ grid }) => {
          const computedStyle = window.getComputedStyle(grid)
          expect(computedStyle.width).toBe('100%')
          expect(computedStyle.height).toBe('100%')
        },
      )
    })

    it('should have overflow auto', async () => {
      await usingAsync(
        await renderGrid({
          columns: ['id'],
          entries: [],
        }),
        async ({ grid }) => {
          const computedStyle = window.getComputedStyle(grid)
          expect(computedStyle.overflow).toBe('auto')
        },
      )
    })

    it('should have display block', async () => {
      await usingAsync(
        await renderGrid({
          columns: ['id'],
          entries: [],
        }),
        async ({ grid }) => {
          const computedStyle = window.getComputedStyle(grid)
          expect(computedStyle.display).toBe('block')
        },
      )
    })
  })
})
