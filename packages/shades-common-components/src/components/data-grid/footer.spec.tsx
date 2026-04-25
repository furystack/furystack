import type { FindOptions } from '@furystack/core'
import { createInjector } from '@furystack/inject'
import { createComponent, flushUpdates, initializeShadeRoot } from '@furystack/shades'
import { usingAsync } from '@furystack/utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
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

  const createFindOptions = (top: number = 10, skip: number = 0): FindOptions<TestItem, Array<keyof TestItem>> => {
    return { top, skip }
  }

  it('should render with custom element', async () => {
    await usingAsync(createInjector(), async (injector) => {
      const rootElement = document.getElementById('root') as HTMLDivElement
      const service = createService()
      const findOptions = createFindOptions()
      const onFindOptionsChange = vi.fn()

      initializeShadeRoot({
        injector,
        rootElement,
        jsxElement: (
          <DataGridFooter service={service} findOptions={findOptions} onFindOptionsChange={onFindOptionsChange} />
        ),
      })

      await flushUpdates()

      const footer = document.querySelector('shade-data-grid-footer')
      expect(footer).not.toBeNull()
    })
  })

  it('should render items per page select', async () => {
    await usingAsync(createInjector(), async (injector) => {
      const rootElement = document.getElementById('root') as HTMLDivElement
      const service = createService()
      const findOptions = createFindOptions()
      const onFindOptionsChange = vi.fn()

      initializeShadeRoot({
        injector,
        rootElement,
        jsxElement: (
          <DataGridFooter service={service} findOptions={findOptions} onFindOptionsChange={onFindOptionsChange} />
        ),
      })

      await flushUpdates()

      const footer = document.querySelector('shade-data-grid-footer')
      const rowsPerPageSelect = footer?.querySelector('.pager-section select')

      expect(rowsPerPageSelect).not.toBeNull()
    })
  })

  it('should render all items per page options', async () => {
    await usingAsync(createInjector(), async (injector) => {
      const rootElement = document.getElementById('root') as HTMLDivElement
      const service = createService()
      const findOptions = createFindOptions()
      const onFindOptionsChange = vi.fn()

      initializeShadeRoot({
        injector,
        rootElement,
        jsxElement: (
          <DataGridFooter service={service} findOptions={findOptions} onFindOptionsChange={onFindOptionsChange} />
        ),
      })

      await flushUpdates()

      const footer = document.querySelector('shade-data-grid-footer')
      const selects = Array.from(footer?.querySelectorAll('select') ?? [])
      const itemsPerPageSelect = selects.find((s) => {
        const parent = s.closest('.pager-section')
        return parent?.textContent?.includes('Rows per page')
      })

      expect(itemsPerPageSelect).toBeDefined()
      const options = itemsPerPageSelect?.querySelectorAll('option')
      expect(options?.length).toBe(dataGridItemsPerPage.length)
    })
  })

  it('should show Pagination component when pagination is enabled', async () => {
    await usingAsync(createInjector(), async (injector) => {
      const rootElement = document.getElementById('root') as HTMLDivElement
      const service = createService([], 100)
      const findOptions = createFindOptions(10, 0)
      const onFindOptionsChange = vi.fn()

      initializeShadeRoot({
        injector,
        rootElement,
        jsxElement: (
          <DataGridFooter service={service} findOptions={findOptions} onFindOptionsChange={onFindOptionsChange} />
        ),
      })

      await flushUpdates()

      const footer = document.querySelector('shade-data-grid-footer')
      const pagination = footer?.querySelector('shade-pagination')
      expect(pagination).not.toBeNull()
    })
  })

  it('should hide Pagination when showing all items (Infinity)', async () => {
    await usingAsync(createInjector(), async (injector) => {
      const rootElement = document.getElementById('root') as HTMLDivElement
      const service = createService([], 50)
      const findOptions = createFindOptions(Infinity, 0)
      const onFindOptionsChange = vi.fn()

      initializeShadeRoot({
        injector,
        rootElement,
        jsxElement: (
          <DataGridFooter service={service} findOptions={findOptions} onFindOptionsChange={onFindOptionsChange} />
        ),
      })

      await flushUpdates()

      const footer = document.querySelector('shade-data-grid-footer')
      const pagination = footer?.querySelector('shade-pagination')
      expect(pagination).toBeNull()
    })
  })

  it('should render page buttons in Pagination based on data count and items per page', async () => {
    await usingAsync(createInjector(), async (injector) => {
      const rootElement = document.getElementById('root') as HTMLDivElement
      const service = createService([], 100)
      const findOptions = createFindOptions(25, 0)
      const onFindOptionsChange = vi.fn()

      initializeShadeRoot({
        injector,
        rootElement,
        jsxElement: (
          <DataGridFooter service={service} findOptions={findOptions} onFindOptionsChange={onFindOptionsChange} />
        ),
      })

      await flushUpdates()

      const footer = document.querySelector('shade-data-grid-footer')
      const pagination = footer?.querySelector('shade-pagination')
      expect(pagination).not.toBeNull()

      const pageButtons = Array.from(pagination?.querySelectorAll('.pagination-item') ?? []).filter((btn) =>
        btn.getAttribute('aria-label')?.startsWith('Go to page'),
      )
      expect(pageButtons.length).toBe(4)
    })
  })

  it('should call onFindOptionsChange when page is changed via Pagination', async () => {
    await usingAsync(createInjector(), async (injector) => {
      const rootElement = document.getElementById('root') as HTMLDivElement
      const service = createService([], 100)
      const findOptions = createFindOptions(10, 0)
      const onFindOptionsChange = vi.fn()

      initializeShadeRoot({
        injector,
        rootElement,
        jsxElement: (
          <DataGridFooter service={service} findOptions={findOptions} onFindOptionsChange={onFindOptionsChange} />
        ),
      })

      await flushUpdates()

      const footer = document.querySelector('shade-data-grid-footer')
      const pagination = footer?.querySelector('shade-pagination')
      const nextButton = pagination?.querySelector('[aria-label="Go to next page"]') as HTMLButtonElement | null

      expect(nextButton).not.toBeNull()
      nextButton!.click()

      await flushUpdates()

      expect(onFindOptionsChange).toHaveBeenCalledWith(expect.objectContaining({ skip: 10 }))
    })
  })

  it('should call onFindOptionsChange when items per page is changed', async () => {
    await usingAsync(createInjector(), async (injector) => {
      const rootElement = document.getElementById('root') as HTMLDivElement
      const service = createService([], 100)
      const findOptions = createFindOptions(10, 0)
      const onFindOptionsChange = vi.fn()

      initializeShadeRoot({
        injector,
        rootElement,
        jsxElement: (
          <DataGridFooter service={service} findOptions={findOptions} onFindOptionsChange={onFindOptionsChange} />
        ),
      })

      await flushUpdates()

      const footer = document.querySelector('shade-data-grid-footer')
      const selects = Array.from(footer?.querySelectorAll('select') ?? [])
      const itemsPerPageSelect = selects.find((s) => {
        const parent = s.closest('.pager-section')
        return parent?.textContent?.includes('Rows per page')
      })

      expect(itemsPerPageSelect).toBeDefined()

      itemsPerPageSelect!.value = '25'
      itemsPerPageSelect!.dispatchEvent(new Event('change', { bubbles: true }))

      await flushUpdates()

      expect(onFindOptionsChange).toHaveBeenCalledWith(expect.objectContaining({ top: 25 }))
    })
  })

  it('should preserve current page position when changing items per page', async () => {
    await usingAsync(createInjector(), async (injector) => {
      const rootElement = document.getElementById('root') as HTMLDivElement
      const service = createService([], 100)
      const findOptions = createFindOptions(10, 20)
      const onFindOptionsChange = vi.fn()

      initializeShadeRoot({
        injector,
        rootElement,
        jsxElement: (
          <DataGridFooter service={service} findOptions={findOptions} onFindOptionsChange={onFindOptionsChange} />
        ),
      })

      await flushUpdates()

      const footer = document.querySelector('shade-data-grid-footer')
      const selects = Array.from(footer?.querySelectorAll('select') ?? [])
      const itemsPerPageSelect = selects.find((s) => {
        const parent = s.closest('.pager-section')
        return parent?.textContent?.includes('Rows per page')
      })

      expect(itemsPerPageSelect).toBeDefined()

      itemsPerPageSelect!.value = '25'
      itemsPerPageSelect!.dispatchEvent(new Event('change', { bubbles: true }))

      await flushUpdates()

      expect(onFindOptionsChange).toHaveBeenCalledWith(expect.objectContaining({ top: 25, skip: 50 }))
    })
  })

  it('should highlight the correct current page in Pagination', async () => {
    await usingAsync(createInjector(), async (injector) => {
      const rootElement = document.getElementById('root') as HTMLDivElement
      const service = createService([], 100)
      const findOptions = createFindOptions(10, 30)
      const onFindOptionsChange = vi.fn()

      initializeShadeRoot({
        injector,
        rootElement,
        jsxElement: (
          <DataGridFooter service={service} findOptions={findOptions} onFindOptionsChange={onFindOptionsChange} />
        ),
      })

      await flushUpdates()

      const footer = document.querySelector('shade-data-grid-footer')
      const pagination = footer?.querySelector('shade-pagination')
      const selectedButton = pagination?.querySelector('.pagination-item[data-selected]')

      expect(selectedButton).not.toBeNull()
      expect(selectedButton?.textContent?.trim()).toBe('4')
    })
  })

  it('should select the correct items per page option', async () => {
    await usingAsync(createInjector(), async (injector) => {
      const rootElement = document.getElementById('root') as HTMLDivElement
      const service = createService([], 100)
      const findOptions = createFindOptions(25, 0)
      const onFindOptionsChange = vi.fn()

      initializeShadeRoot({
        injector,
        rootElement,
        jsxElement: (
          <DataGridFooter service={service} findOptions={findOptions} onFindOptionsChange={onFindOptionsChange} />
        ),
      })

      await flushUpdates()

      const footer = document.querySelector('shade-data-grid-footer')
      const selects = Array.from(footer?.querySelectorAll('select') ?? [])
      const itemsPerPageSelect = selects.find((s) => {
        const parent = s.closest('.pager-section')
        return parent?.textContent?.includes('Rows per page')
      })

      expect(itemsPerPageSelect).toBeDefined()
      expect(itemsPerPageSelect?.value).toBe('25')
    })
  })

  it('should react to data count changes', async () => {
    await usingAsync(createInjector(), async (injector) => {
      const rootElement = document.getElementById('root') as HTMLDivElement
      const service = createService([], 30)
      const findOptions = createFindOptions(10, 0)
      const onFindOptionsChange = vi.fn()

      initializeShadeRoot({
        injector,
        rootElement,
        jsxElement: (
          <DataGridFooter service={service} findOptions={findOptions} onFindOptionsChange={onFindOptionsChange} />
        ),
      })

      await flushUpdates()

      let footer = document.querySelector('shade-data-grid-footer')
      let pagination = footer?.querySelector('shade-pagination')
      let pageButtons = Array.from(pagination?.querySelectorAll('.pagination-item') ?? []).filter((btn) =>
        btn.getAttribute('aria-label')?.startsWith('Go to page'),
      )
      expect(pageButtons.length).toBe(3)

      service.data.setValue({ entries: [], count: 50 })

      await flushUpdates()

      footer = document.querySelector('shade-data-grid-footer')
      pagination = footer?.querySelector('shade-pagination')
      pageButtons = Array.from(pagination?.querySelectorAll('.pagination-item') ?? []).filter((btn) =>
        btn.getAttribute('aria-label')?.startsWith('Go to page'),
      )
      expect(pageButtons.length).toBe(5)
    })
  })

  it('should export dataGridItemsPerPage constant', () => {
    expect(dataGridItemsPerPage).toEqual([10, 20, 25, 50, 100, Infinity])
  })

  it('should render custom paginationOptions', async () => {
    await usingAsync(createInjector(), async (injector) => {
      const rootElement = document.getElementById('root') as HTMLDivElement
      const service = createService()
      const findOptions = createFindOptions()
      const onFindOptionsChange = vi.fn()

      initializeShadeRoot({
        injector,
        rootElement,
        jsxElement: (
          <DataGridFooter
            service={service}
            findOptions={findOptions}
            onFindOptionsChange={onFindOptionsChange}
            paginationOptions={[5, 15, 30]}
          />
        ),
      })

      await flushUpdates()

      const footer = document.querySelector('shade-data-grid-footer')
      const itemsPerPageSelect = footer?.querySelector('.pager-section select')

      expect(itemsPerPageSelect).not.toBeNull()
      const options = itemsPerPageSelect?.querySelectorAll('option')
      expect(options?.length).toBe(3)
      expect(options?.[0]?.textContent).toBe('5')
      expect(options?.[1]?.textContent).toBe('15')
      expect(options?.[2]?.textContent).toBe('30')
    })
  })

  it('should hide the rows-per-page selector when only one paginationOption is provided', async () => {
    await usingAsync(createInjector(), async (injector) => {
      const rootElement = document.getElementById('root') as HTMLDivElement
      const service = createService([], 50)
      const findOptions = createFindOptions(10, 0)
      const onFindOptionsChange = vi.fn()

      initializeShadeRoot({
        injector,
        rootElement,
        jsxElement: (
          <DataGridFooter
            service={service}
            findOptions={findOptions}
            onFindOptionsChange={onFindOptionsChange}
            paginationOptions={[10]}
          />
        ),
      })

      await flushUpdates()

      const footer = document.querySelector('shade-data-grid-footer')
      const pagerSection = footer?.querySelector('.pager-section')
      expect(pagerSection).toBeNull()
    })
  })

  it('should use default dataGridItemsPerPage when paginationOptions is not provided', async () => {
    await usingAsync(createInjector(), async (injector) => {
      const rootElement = document.getElementById('root') as HTMLDivElement
      const service = createService()
      const findOptions = createFindOptions()
      const onFindOptionsChange = vi.fn()

      initializeShadeRoot({
        injector,
        rootElement,
        jsxElement: (
          <DataGridFooter service={service} findOptions={findOptions} onFindOptionsChange={onFindOptionsChange} />
        ),
      })

      await flushUpdates()

      const footer = document.querySelector('shade-data-grid-footer')
      const options = footer?.querySelectorAll('.pager-section select option')
      expect(options?.length).toBe(dataGridItemsPerPage.length)
    })
  })
})
