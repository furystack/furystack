import type { FindOptions } from '@furystack/core'
import { Injector } from '@furystack/inject'
import { createComponent, initializeShadeRoot } from '@furystack/shades'
import { ObservableValue, sleepAsync, usingAsync } from '@furystack/utils'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { CollectionService } from '../../services/collection-service.js'
import { DataGridFooter, dataGridItemsPerPage } from './footer.js'

type TestItem = { id: number; name: string }

describe('DataGridFooter', () => {
  beforeEach(() => {
    document.body.innerHTML = '<div id="root"></div>'
  })

  afterEach(() => {
    document.body.innerHTML = ''
  })

  const createService = (entries: TestItem[] = [], count?: number) => {
    const service = new CollectionService<TestItem>()
    service.data.setValue({ entries, count: count ?? entries.length })
    return service
  }

  const createFindOptions = (
    top: number = 10,
    skip: number = 0,
  ): ObservableValue<FindOptions<TestItem, Array<keyof TestItem>>> => {
    return new ObservableValue<FindOptions<TestItem, Array<keyof TestItem>>>({ top, skip })
  }

  it('should render with custom element', async () => {
    await usingAsync(new Injector(), async (injector) => {
      const rootElement = document.getElementById('root') as HTMLDivElement
      const service = createService()
      const findOptions = createFindOptions()

      initializeShadeRoot({
        injector,
        rootElement,
        jsxElement: <DataGridFooter service={service} findOptions={findOptions} />,
      })

      await sleepAsync(50)

      const footer = document.querySelector('shade-data-grid-footer')
      expect(footer).not.toBeNull()
    })
  })

  it('should render items per page select', async () => {
    await usingAsync(new Injector(), async (injector) => {
      const rootElement = document.getElementById('root') as HTMLDivElement
      const service = createService()
      const findOptions = createFindOptions()

      initializeShadeRoot({
        injector,
        rootElement,
        jsxElement: <DataGridFooter service={service} findOptions={findOptions} />,
      })

      await sleepAsync(50)

      const footer = document.querySelector('shade-data-grid-footer')
      const selects = footer?.querySelectorAll('select')

      expect(selects?.length).toBeGreaterThan(0)
    })
  })

  it('should render all items per page options', async () => {
    await usingAsync(new Injector(), async (injector) => {
      const rootElement = document.getElementById('root') as HTMLDivElement
      const service = createService()
      const findOptions = createFindOptions()

      initializeShadeRoot({
        injector,
        rootElement,
        jsxElement: <DataGridFooter service={service} findOptions={findOptions} />,
      })

      await sleepAsync(50)

      const footer = document.querySelector('shade-data-grid-footer')
      const selects = Array.from(footer?.querySelectorAll('select') ?? [])
      const itemsPerPageSelect = selects.find((s) => {
        const parent = s.parentElement
        return parent?.textContent?.includes('items per page')
      })

      expect(itemsPerPageSelect).toBeDefined()
      const options = itemsPerPageSelect?.querySelectorAll('option')
      expect(options?.length).toBe(dataGridItemsPerPage.length)
    })
  })

  it('should show page selector when pagination is enabled', async () => {
    await usingAsync(new Injector(), async (injector) => {
      const rootElement = document.getElementById('root') as HTMLDivElement
      const service = createService([], 100)
      const findOptions = createFindOptions(10, 0)

      initializeShadeRoot({
        injector,
        rootElement,
        jsxElement: <DataGridFooter service={service} findOptions={findOptions} />,
      })

      await sleepAsync(50)

      const footer = document.querySelector('shade-data-grid-footer')
      const pager = footer?.querySelector('.pager')
      expect(pager?.textContent).toContain('Goto page')
    })
  })

  it('should hide page selector when showing all items (Infinity)', async () => {
    await usingAsync(new Injector(), async (injector) => {
      const rootElement = document.getElementById('root') as HTMLDivElement
      const service = createService([], 50)
      const findOptions = createFindOptions(Infinity, 0)

      initializeShadeRoot({
        injector,
        rootElement,
        jsxElement: <DataGridFooter service={service} findOptions={findOptions} />,
      })

      await sleepAsync(50)

      const footer = document.querySelector('shade-data-grid-footer')
      const pager = footer?.querySelector('.pager')
      expect(pager?.textContent).not.toContain('Goto page')
    })
  })

  it('should render correct number of page options based on data count and items per page', async () => {
    await usingAsync(new Injector(), async (injector) => {
      const rootElement = document.getElementById('root') as HTMLDivElement
      const service = createService([], 100)
      const findOptions = createFindOptions(25, 0)

      initializeShadeRoot({
        injector,
        rootElement,
        jsxElement: <DataGridFooter service={service} findOptions={findOptions} />,
      })

      await sleepAsync(50)

      const footer = document.querySelector('shade-data-grid-footer')
      const selects = Array.from(footer?.querySelectorAll('select') ?? [])
      const pageSelect = selects.find((s) => {
        const parent = s.parentElement
        return parent?.textContent?.includes('Goto page')
      })

      expect(pageSelect).toBeDefined()
      const options = pageSelect?.querySelectorAll('option')
      expect(options?.length).toBe(4)
    })
  })

  it('should update findOptions when page is changed', async () => {
    await usingAsync(new Injector(), async (injector) => {
      const rootElement = document.getElementById('root') as HTMLDivElement
      const service = createService([], 100)
      const findOptions = createFindOptions(10, 0)

      initializeShadeRoot({
        injector,
        rootElement,
        jsxElement: <DataGridFooter service={service} findOptions={findOptions} />,
      })

      await sleepAsync(50)

      const footer = document.querySelector('shade-data-grid-footer')
      const selects = Array.from(footer?.querySelectorAll('select') ?? [])
      const pageSelect = selects.find((s) => {
        const parent = s.parentElement
        return parent?.textContent?.includes('Goto page')
      })

      expect(pageSelect).toBeDefined()

      pageSelect!.value = '2'
      pageSelect!.dispatchEvent(new Event('change', { bubbles: true }))

      await sleepAsync(50)

      const updatedOptions = findOptions.getValue()
      expect(updatedOptions.skip).toBe(20)
    })
  })

  it('should update findOptions when items per page is changed', async () => {
    await usingAsync(new Injector(), async (injector) => {
      const rootElement = document.getElementById('root') as HTMLDivElement
      const service = createService([], 100)
      const findOptions = createFindOptions(10, 0)

      initializeShadeRoot({
        injector,
        rootElement,
        jsxElement: <DataGridFooter service={service} findOptions={findOptions} />,
      })

      await sleepAsync(50)

      const footer = document.querySelector('shade-data-grid-footer')
      const selects = Array.from(footer?.querySelectorAll('select') ?? [])
      const itemsPerPageSelect = selects.find((s) => {
        const parent = s.parentElement
        return parent?.textContent?.includes('items per page')
      })

      expect(itemsPerPageSelect).toBeDefined()

      itemsPerPageSelect!.value = '25'
      itemsPerPageSelect!.dispatchEvent(new Event('change', { bubbles: true }))

      await sleepAsync(50)

      const updatedOptions = findOptions.getValue()
      expect(updatedOptions.top).toBe(25)
    })
  })

  it('should preserve current page position when changing items per page', async () => {
    await usingAsync(new Injector(), async (injector) => {
      const rootElement = document.getElementById('root') as HTMLDivElement
      const service = createService([], 100)
      const findOptions = createFindOptions(10, 20)

      initializeShadeRoot({
        injector,
        rootElement,
        jsxElement: <DataGridFooter service={service} findOptions={findOptions} />,
      })

      await sleepAsync(50)

      const footer = document.querySelector('shade-data-grid-footer')
      const selects = Array.from(footer?.querySelectorAll('select') ?? [])
      const itemsPerPageSelect = selects.find((s) => {
        const parent = s.parentElement
        return parent?.textContent?.includes('items per page')
      })

      expect(itemsPerPageSelect).toBeDefined()

      itemsPerPageSelect!.value = '25'
      itemsPerPageSelect!.dispatchEvent(new Event('change', { bubbles: true }))

      await sleepAsync(50)

      const updatedOptions = findOptions.getValue()
      expect(updatedOptions.top).toBe(25)
      expect(updatedOptions.skip).toBe(50)
    })
  })

  it('should select the correct current page in the page selector', async () => {
    await usingAsync(new Injector(), async (injector) => {
      const rootElement = document.getElementById('root') as HTMLDivElement
      const service = createService([], 100)
      const findOptions = createFindOptions(10, 30)

      initializeShadeRoot({
        injector,
        rootElement,
        jsxElement: <DataGridFooter service={service} findOptions={findOptions} />,
      })

      await sleepAsync(50)

      const footer = document.querySelector('shade-data-grid-footer')
      const selects = Array.from(footer?.querySelectorAll('select') ?? [])
      const pageSelect = selects.find((s) => {
        const parent = s.parentElement
        return parent?.textContent?.includes('Goto page')
      })

      expect(pageSelect).toBeDefined()
      expect(pageSelect?.value).toBe('3')
    })
  })

  it('should select the correct items per page option', async () => {
    await usingAsync(new Injector(), async (injector) => {
      const rootElement = document.getElementById('root') as HTMLDivElement
      const service = createService([], 100)
      const findOptions = createFindOptions(25, 0)

      initializeShadeRoot({
        injector,
        rootElement,
        jsxElement: <DataGridFooter service={service} findOptions={findOptions} />,
      })

      await sleepAsync(50)

      const footer = document.querySelector('shade-data-grid-footer')
      const selects = Array.from(footer?.querySelectorAll('select') ?? [])
      const itemsPerPageSelect = selects.find((s) => {
        const parent = s.parentElement
        return parent?.textContent?.includes('items per page')
      })

      expect(itemsPerPageSelect).toBeDefined()
      expect(itemsPerPageSelect?.value).toBe('25')
    })
  })

  it('should react to data count changes', async () => {
    await usingAsync(new Injector(), async (injector) => {
      const rootElement = document.getElementById('root') as HTMLDivElement
      const service = createService([], 50)
      const findOptions = createFindOptions(10, 0)

      initializeShadeRoot({
        injector,
        rootElement,
        jsxElement: <DataGridFooter service={service} findOptions={findOptions} />,
      })

      await sleepAsync(50)

      let footer = document.querySelector('shade-data-grid-footer')
      let selects = Array.from(footer?.querySelectorAll('select') ?? [])
      let pageSelect = selects.find((s) => s.parentElement?.textContent?.includes('Goto page'))
      let pageOptions = pageSelect?.querySelectorAll('option')

      expect(pageOptions?.length).toBe(5)

      service.data.setValue({ entries: [], count: 100 })

      await sleepAsync(50)

      footer = document.querySelector('shade-data-grid-footer')
      selects = Array.from(footer?.querySelectorAll('select') ?? [])
      pageSelect = selects.find((s) => s.parentElement?.textContent?.includes('Goto page'))
      pageOptions = pageSelect?.querySelectorAll('option')

      expect(pageOptions?.length).toBe(10)
    })
  })

  it('should export dataGridItemsPerPage constant', () => {
    expect(dataGridItemsPerPage).toEqual([10, 20, 25, 50, 100, Infinity])
  })
})
