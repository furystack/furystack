import { Injector } from '@furystack/inject'
import { createComponent, initializeShadeRoot } from '@furystack/shades'
import { sleepAsync, usingAsync } from '@furystack/utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { CollectionService } from '../../services/collection-service.js'
import { DataGridRow } from './data-grid-row.js'

type TestEntry = { id: number; name: string }

describe('DataGridRow', () => {
  beforeEach(() => {
    document.body.innerHTML = '<div id="root"></div>'
    // Mock scrollTo for jsdom
    Element.prototype.scrollTo = vi.fn()
  })

  afterEach(() => {
    document.body.innerHTML = ''
  })

  const renderRow = async (props: {
    entry: TestEntry
    service: CollectionService<TestEntry>
    columns?: Array<'id' | 'name'>
    onRowClick?: (row: TestEntry, event: MouseEvent) => void
    onRowDoubleClick?: (row: TestEntry, event: MouseEvent) => void
    focusedRowStyle?: Partial<CSSStyleDeclaration>
    selectedRowStyle?: Partial<CSSStyleDeclaration>
    unfocusedRowStyle?: Partial<CSSStyleDeclaration>
    unselectedRowStyle?: Partial<CSSStyleDeclaration>
    rowComponents?: Record<string, (entry: TestEntry) => JSX.Element>
  }) => {
    const injector = new Injector()
    const root = document.getElementById('root')!

    // Create shade-data-grid element manually to simulate production structure
    // shade-data-grid is the scrollable container in production
    const shadeDataGrid = document.createElement('shade-data-grid')
    shadeDataGrid.style.overflow = 'auto'
    shadeDataGrid.style.height = '200px'
    shadeDataGrid.style.display = 'block'
    root.appendChild(shadeDataGrid)

    initializeShadeRoot({
      injector,
      rootElement: shadeDataGrid,
      jsxElement: (
        <div className="shade-grid-wrapper">
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Name</th>
              </tr>
            </thead>
            <tbody>
              <DataGridRow<TestEntry, 'id' | 'name'>
                entry={props.entry}
                service={props.service}
                columns={props.columns ?? ['id', 'name']}
                onRowClick={props.onRowClick}
                onRowDoubleClick={props.onRowDoubleClick}
                focusedRowStyle={props.focusedRowStyle}
                selectedRowStyle={props.selectedRowStyle}
                unfocusedRowStyle={props.unfocusedRowStyle}
                unselectedRowStyle={props.unselectedRowStyle}
                rowComponents={props.rowComponents}
              />
            </tbody>
          </table>
        </div>
      ),
    })
    await sleepAsync(50)

    return {
      injector,
      getRow: () => root.querySelector('shades-data-grid-row'),
      getCells: () => root.querySelectorAll('td'),
      getScrollContainer: () => shadeDataGrid,
      [Symbol.asyncDispose]: () => injector[Symbol.asyncDispose](),
    }
  }

  describe('rendering', () => {
    it('should render as a table row element', async () => {
      await usingAsync(new CollectionService<TestEntry>(), async (service) => {
        const entry = { id: 1, name: 'Test' }
        await usingAsync(await renderRow({ entry, service }), async ({ getRow }) => {
          const row = getRow()
          expect(row).toBeTruthy()
          expect(row?.tagName.toLowerCase()).toBe('shades-data-grid-row')
        })
      })
    })

    it('should render a cell for each column', async () => {
      await usingAsync(new CollectionService<TestEntry>(), async (service) => {
        const entry = { id: 1, name: 'Test' }
        await usingAsync(await renderRow({ entry, service, columns: ['id', 'name'] }), async ({ getCells }) => {
          expect(getCells().length).toBe(2)
        })
      })
    })

    it('should render entry property values in cells', async () => {
      await usingAsync(new CollectionService<TestEntry>(), async (service) => {
        const entry = { id: 42, name: 'Test Entry' }
        await usingAsync(await renderRow({ entry, service }), async ({ getCells }) => {
          const cells = getCells()
          expect(cells[0]?.textContent).toBe('42')
          expect(cells[1]?.textContent).toBe('Test Entry')
        })
      })
    })

    it('should use custom row components when provided', async () => {
      await usingAsync(new CollectionService<TestEntry>(), async (service) => {
        const entry = { id: 1, name: 'Custom' }
        await usingAsync(
          await renderRow({
            entry,
            service,
            rowComponents: {
              id: (e: TestEntry) => <span data-testid="custom-id">ID: {e.id}</span>,
              name: (e: TestEntry) => <strong data-testid="custom-name">{e.name}</strong>,
            },
          }),
          async ({ getCells }) => {
            const cells = getCells()
            expect(cells[0]?.querySelector('[data-testid="custom-id"]')?.textContent).toContain('ID: 1')
            expect(cells[1]?.querySelector('[data-testid="custom-name"]')?.textContent).toBe('Custom')
          },
        )
      })
    })
  })

  describe('selection state', () => {
    it('should not have selected class when entry is not selected', async () => {
      await usingAsync(new CollectionService<TestEntry>(), async (service) => {
        const entry = { id: 1, name: 'Test' }
        await usingAsync(await renderRow({ entry, service }), async ({ getRow }) => {
          const row = getRow()
          expect(row?.classList.contains('selected')).toBe(false)
        })
      })
    })

    it('should have selected class when entry is in selection', async () => {
      await usingAsync(new CollectionService<TestEntry>(), async (service) => {
        const entry = { id: 1, name: 'Test' }
        service.selection.setValue([entry])
        await usingAsync(await renderRow({ entry, service }), async ({ getRow }) => {
          const row = getRow()
          expect(row?.classList.contains('selected')).toBe(true)
        })
      })
    })

    it('should update selected class when selection changes', async () => {
      await usingAsync(new CollectionService<TestEntry>(), async (service) => {
        const entry = { id: 1, name: 'Test' }
        await usingAsync(await renderRow({ entry, service }), async ({ getRow }) => {
          const row = getRow()
          expect(row?.classList.contains('selected')).toBe(false)

          service.selection.setValue([entry])
          await sleepAsync(50)
          expect(row?.classList.contains('selected')).toBe(true)

          service.selection.setValue([])
          await sleepAsync(50)
          expect(row?.classList.contains('selected')).toBe(false)
        })
      })
    })

    it('should set aria-selected attribute based on selection', async () => {
      await usingAsync(new CollectionService<TestEntry>(), async (service) => {
        const entry = { id: 1, name: 'Test' }
        await usingAsync(await renderRow({ entry, service }), async ({ getRow }) => {
          const row = getRow()
          expect(row?.getAttribute('aria-selected')).toBe('false')

          service.selection.setValue([entry])
          await sleepAsync(50)
          expect(row?.getAttribute('aria-selected')).toBe('true')
        })
      })
    })

    it('should apply selectedRowStyle when entry is selected', async () => {
      await usingAsync(new CollectionService<TestEntry>(), async (service) => {
        const entry = { id: 1, name: 'Test' }
        service.selection.setValue([entry])
        await usingAsync(
          await renderRow({
            entry,
            service,
            selectedRowStyle: { backgroundColor: 'rgb(255, 0, 0)' },
          }),
          async ({ getRow }) => {
            const row = getRow() as HTMLElement | null
            expect(row?.style.backgroundColor).toBe('rgb(255, 0, 0)')
          },
        )
      })
    })

    it('should apply unselectedRowStyle when entry is not selected', async () => {
      await usingAsync(new CollectionService<TestEntry>(), async (service) => {
        const entry = { id: 1, name: 'Test' }
        await usingAsync(
          await renderRow({
            entry,
            service,
            unselectedRowStyle: { backgroundColor: 'rgb(0, 255, 0)' },
          }),
          async ({ getRow }) => {
            const row = getRow() as HTMLElement | null
            expect(row?.style.backgroundColor).toBe('rgb(0, 255, 0)')
          },
        )
      })
    })
  })

  describe('focus state', () => {
    it('should not have focused class when entry is not focused', async () => {
      await usingAsync(new CollectionService<TestEntry>(), async (service) => {
        const entry = { id: 1, name: 'Test' }
        await usingAsync(await renderRow({ entry, service }), async ({ getRow }) => {
          const row = getRow()
          expect(row?.classList.contains('focused')).toBe(false)
        })
      })
    })

    it('should have focused class when entry is focused', async () => {
      await usingAsync(new CollectionService<TestEntry>(), async (service) => {
        const entry = { id: 1, name: 'Test' }
        service.focusedEntry.setValue(entry)
        await usingAsync(await renderRow({ entry, service }), async ({ getRow }) => {
          const row = getRow()
          expect(row?.classList.contains('focused')).toBe(true)
        })
      })
    })

    it('should update focused class when focus changes', async () => {
      await usingAsync(new CollectionService<TestEntry>(), async (service) => {
        const entry = { id: 1, name: 'Test' }
        await usingAsync(await renderRow({ entry, service }), async ({ getRow }) => {
          const row = getRow()
          expect(row?.classList.contains('focused')).toBe(false)

          service.focusedEntry.setValue(entry)
          await sleepAsync(50)
          expect(row?.classList.contains('focused')).toBe(true)

          service.focusedEntry.setValue(undefined)
          await sleepAsync(50)
          expect(row?.classList.contains('focused')).toBe(false)
        })
      })
    })

    it('should apply focusedRowStyle when entry is focused', async () => {
      await usingAsync(new CollectionService<TestEntry>(), async (service) => {
        const entry = { id: 1, name: 'Test' }
        service.focusedEntry.setValue(entry)
        await usingAsync(
          await renderRow({
            entry,
            service,
            focusedRowStyle: { fontWeight: 'bold' },
          }),
          async ({ getRow }) => {
            const row = getRow() as HTMLElement | null
            expect(row?.style.fontWeight).toBe('bold')
          },
        )
      })
    })

    it('should apply unfocusedRowStyle when entry is not focused', async () => {
      await usingAsync(new CollectionService<TestEntry>(), async (service) => {
        const entry = { id: 1, name: 'Test' }
        await usingAsync(
          await renderRow({
            entry,
            service,
            unfocusedRowStyle: { opacity: '0.8' },
          }),
          async ({ getRow }) => {
            const row = getRow() as HTMLElement | null
            expect(row?.style.opacity).toBe('0.8')
          },
        )
      })
    })

    it('should not have focused class when different entry is focused', async () => {
      await usingAsync(new CollectionService<TestEntry>(), async (service) => {
        const entry = { id: 1, name: 'Test' }
        const otherEntry = { id: 2, name: 'Other' }
        service.focusedEntry.setValue(otherEntry)
        await usingAsync(await renderRow({ entry, service }), async ({ getRow }) => {
          const row = getRow()
          expect(row?.classList.contains('focused')).toBe(false)
        })
      })
    })
  })

  describe('click handlers', () => {
    it('should call onRowClick when cell is clicked', async () => {
      await usingAsync(new CollectionService<TestEntry>(), async (service) => {
        const entry = { id: 1, name: 'Test' }
        const onRowClick = vi.fn()
        await usingAsync(await renderRow({ entry, service, onRowClick }), async ({ getCells }) => {
          const cell = getCells()[0]
          cell.click()

          expect(onRowClick).toHaveBeenCalledWith(entry, expect.any(MouseEvent))
        })
      })
    })

    it('should call onRowDoubleClick when cell is double-clicked', async () => {
      await usingAsync(new CollectionService<TestEntry>(), async (service) => {
        const entry = { id: 1, name: 'Test' }
        const onRowDoubleClick = vi.fn()
        await usingAsync(await renderRow({ entry, service, onRowDoubleClick }), async ({ getCells }) => {
          const cell = getCells()[0]
          const dblClickEvent = new MouseEvent('dblclick', { bubbles: true })
          cell.dispatchEvent(dblClickEvent)

          expect(onRowDoubleClick).toHaveBeenCalledWith(entry, expect.any(MouseEvent))
        })
      })
    })

    it('should not throw when onRowClick is not provided', async () => {
      await usingAsync(new CollectionService<TestEntry>(), async (service) => {
        const entry = { id: 1, name: 'Test' }
        await usingAsync(await renderRow({ entry, service }), async ({ getCells }) => {
          const cell = getCells()[0]
          expect(() => cell.click()).not.toThrow()
        })
      })
    })

    it('should not throw when onRowDoubleClick is not provided', async () => {
      await usingAsync(new CollectionService<TestEntry>(), async (service) => {
        const entry = { id: 1, name: 'Test' }
        await usingAsync(await renderRow({ entry, service }), async ({ getCells }) => {
          const cell = getCells()[0]
          const dblClickEvent = new MouseEvent('dblclick', { bubbles: true })
          expect(() => cell.dispatchEvent(dblClickEvent)).not.toThrow()
        })
      })
    })
  })

  describe('combined selection and focus states', () => {
    it('should have both selected and focused classes when applicable', async () => {
      await usingAsync(new CollectionService<TestEntry>(), async (service) => {
        const entry = { id: 1, name: 'Test' }
        service.selection.setValue([entry])
        service.focusedEntry.setValue(entry)
        await usingAsync(await renderRow({ entry, service }), async ({ getRow }) => {
          const row = getRow()
          expect(row?.classList.contains('selected')).toBe(true)
          expect(row?.classList.contains('focused')).toBe(true)
        })
      })
    })

    it('should be selected but not focused', async () => {
      await usingAsync(new CollectionService<TestEntry>(), async (service) => {
        const entry = { id: 1, name: 'Test' }
        const otherEntry = { id: 2, name: 'Other' }
        service.selection.setValue([entry])
        service.focusedEntry.setValue(otherEntry)
        await usingAsync(await renderRow({ entry, service }), async ({ getRow }) => {
          const row = getRow()
          expect(row?.classList.contains('selected')).toBe(true)
          expect(row?.classList.contains('focused')).toBe(false)
        })
      })
    })

    it('should be focused but not selected', async () => {
      await usingAsync(new CollectionService<TestEntry>(), async (service) => {
        const entry = { id: 1, name: 'Test' }
        service.focusedEntry.setValue(entry)
        await usingAsync(await renderRow({ entry, service }), async ({ getRow }) => {
          const row = getRow()
          expect(row?.classList.contains('selected')).toBe(false)
          expect(row?.classList.contains('focused')).toBe(true)
        })
      })
    })
  })
})
