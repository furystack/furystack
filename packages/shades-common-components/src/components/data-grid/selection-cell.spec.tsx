import { Injector } from '@furystack/inject'
import { createComponent, initializeShadeRoot } from '@furystack/shades'
import { sleepAsync, usingAsync } from '@furystack/utils'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { CollectionService } from '../../services/collection-service.js'
import { SelectionCell } from './selection-cell.js'

type TestEntry = { id: number; name: string }

describe('SelectionCell', () => {
  beforeEach(() => {
    document.body.innerHTML = '<div id="root"></div>'
  })

  afterEach(() => {
    document.body.innerHTML = ''
  })

  const renderSelectionCell = async (entry: TestEntry, service: CollectionService<TestEntry>) => {
    const injector = new Injector()
    const root = document.getElementById('root')!
    initializeShadeRoot({
      injector,
      rootElement: root,
      jsxElement: <SelectionCell entry={entry} service={service} />,
    })
    await sleepAsync(50)
    return {
      injector,
      cell: root.querySelector('shades-data-grid-selection-cell') as HTMLElement,
      getCheckbox: () =>
        root.querySelector('shades-data-grid-selection-cell')?.querySelector('input[type="checkbox"]') as
          | HTMLInputElement
          | undefined,
      [Symbol.asyncDispose]: () => injector[Symbol.asyncDispose](),
    }
  }

  describe('rendering', () => {
    it('should render a checkbox input', async () => {
      await usingAsync(new CollectionService<TestEntry>(), async (service) => {
        const entry = { id: 1, name: 'Test' }
        await usingAsync(await renderSelectionCell(entry, service), async ({ cell, getCheckbox }) => {
          expect(cell).toBeTruthy()
          expect(getCheckbox()).toBeTruthy()
          expect(getCheckbox()?.type).toBe('checkbox')
        })
      })
    })
  })

  describe('checkbox state sync', () => {
    it('should be unchecked when entry is not selected', async () => {
      await usingAsync(new CollectionService<TestEntry>(), async (service) => {
        const entry = { id: 1, name: 'Test' }
        await usingAsync(await renderSelectionCell(entry, service), async ({ getCheckbox }) => {
          expect(getCheckbox()?.checked).toBe(false)
        })
      })
    })

    it('should be checked when entry is in selection', async () => {
      await usingAsync(new CollectionService<TestEntry>(), async (service) => {
        const entry = { id: 1, name: 'Test' }
        service.selection.setValue([entry])
        await usingAsync(await renderSelectionCell(entry, service), async ({ getCheckbox }) => {
          expect(getCheckbox()?.checked).toBe(true)
        })
      })
    })

    it('should update checkbox when selection changes externally', async () => {
      await usingAsync(new CollectionService<TestEntry>(), async (service) => {
        const entry = { id: 1, name: 'Test' }
        await usingAsync(await renderSelectionCell(entry, service), async ({ getCheckbox }) => {
          expect(getCheckbox()?.checked).toBe(false)

          service.selection.setValue([entry])
          await sleepAsync(50)

          expect(getCheckbox()?.checked).toBe(true)

          service.selection.setValue([])
          await sleepAsync(50)

          expect(getCheckbox()?.checked).toBe(false)
        })
      })
    })

    it('should remain unchecked when different entries are selected', async () => {
      await usingAsync(new CollectionService<TestEntry>(), async (service) => {
        const entry = { id: 1, name: 'Test' }
        const otherEntry = { id: 2, name: 'Other' }
        service.selection.setValue([otherEntry])
        await usingAsync(await renderSelectionCell(entry, service), async ({ getCheckbox }) => {
          expect(getCheckbox()?.checked).toBe(false)
        })
      })
    })
  })

  describe('selection toggle', () => {
    it('should add entry to selection when checkbox is clicked and entry is not selected', async () => {
      await usingAsync(new CollectionService<TestEntry>(), async (service) => {
        const entry = { id: 1, name: 'Test' }
        await usingAsync(await renderSelectionCell(entry, service), async ({ getCheckbox }) => {
          expect(service.selection.getValue()).toEqual([])

          const checkbox = getCheckbox()
          checkbox?.dispatchEvent(new Event('change', { bubbles: true }))
          await sleepAsync(50)

          expect(service.selection.getValue()).toContain(entry)
        })
      })
    })

    it('should remove entry from selection when checkbox is clicked and entry is selected', async () => {
      await usingAsync(new CollectionService<TestEntry>(), async (service) => {
        const entry = { id: 1, name: 'Test' }
        service.selection.setValue([entry])
        await usingAsync(await renderSelectionCell(entry, service), async ({ getCheckbox }) => {
          expect(service.selection.getValue()).toContain(entry)

          const checkbox = getCheckbox()
          checkbox?.dispatchEvent(new Event('change', { bubbles: true }))
          await sleepAsync(50)

          expect(service.selection.getValue()).not.toContain(entry)
        })
      })
    })

    it('should preserve other selected entries when toggling', async () => {
      await usingAsync(new CollectionService<TestEntry>(), async (service) => {
        const entry = { id: 1, name: 'Test' }
        const otherEntry = { id: 2, name: 'Other' }
        service.selection.setValue([otherEntry])
        await usingAsync(await renderSelectionCell(entry, service), async ({ getCheckbox }) => {
          const checkbox = getCheckbox()
          checkbox?.dispatchEvent(new Event('change', { bubbles: true }))
          await sleepAsync(50)

          expect(service.selection.getValue()).toContain(entry)
          expect(service.selection.getValue()).toContain(otherEntry)
        })
      })
    })
  })
})
