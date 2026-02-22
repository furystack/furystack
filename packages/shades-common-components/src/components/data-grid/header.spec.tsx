import type { FindOptions } from '@furystack/core'
import { Injector } from '@furystack/inject'
import { createComponent, flushUpdates, initializeShadeRoot } from '@furystack/shades'
import { ObservableValue, usingAsync } from '@furystack/utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { FilterableFindOptions } from './data-grid.js'
import { DataGridHeader, OrderButton } from './header.js'

type TestItem = { id: number; name: string; email: string }

describe('DataGridHeader', () => {
  let originalAnimate: typeof Element.prototype.animate

  beforeEach(() => {
    document.body.innerHTML = '<div id="root"></div>'

    originalAnimate = Element.prototype.animate

    Element.prototype.animate = vi.fn(() => {
      const mockAnimation = {
        onfinish: null as ((event: AnimationPlaybackEvent) => void) | null,
        oncancel: null as ((event: AnimationPlaybackEvent) => void) | null,
        cancel: vi.fn(),
        play: vi.fn(),
        pause: vi.fn(),
        finish: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      }

      setTimeout(() => {
        mockAnimation.onfinish?.({} as AnimationPlaybackEvent)
      }, 0)

      return mockAnimation as unknown as Animation
    }) as typeof Element.prototype.animate
  })

  afterEach(() => {
    document.body.innerHTML = ''
    Element.prototype.animate = originalAnimate
  })

  const createFindOptions = (
    options: Partial<FindOptions<TestItem, Array<keyof TestItem>>> = {},
  ): ObservableValue<FindOptions<TestItem, Array<keyof TestItem>>> => {
    return new ObservableValue<FindOptions<TestItem, Array<keyof TestItem>>>(options)
  }

  const createFilterableFindOptions = (
    options: Partial<FilterableFindOptions> = {},
  ): ObservableValue<FilterableFindOptions> => {
    return new ObservableValue<FilterableFindOptions>(options)
  }

  describe('rendering', () => {
    it('should render with custom element', async () => {
      await usingAsync(new Injector(), async (injector) => {
        const rootElement = document.getElementById('root') as HTMLDivElement
        const findOptions = createFindOptions()

        initializeShadeRoot({
          injector,
          rootElement,
          jsxElement: <DataGridHeader field="name" findOptions={findOptions} />,
        })

        await flushUpdates()

        const header = document.querySelector('data-grid-header')
        expect(header).not.toBeNull()
      })
    })

    it('should render field name', async () => {
      await usingAsync(new Injector(), async (injector) => {
        const rootElement = document.getElementById('root') as HTMLDivElement
        const findOptions = createFindOptions()

        initializeShadeRoot({
          injector,
          rootElement,
          jsxElement: <DataGridHeader field="name" findOptions={findOptions} />,
        })

        await flushUpdates()

        const header = document.querySelector('data-grid-header')
        const fieldName = header?.querySelector('.header-field-name')
        expect(fieldName?.textContent).toBe('name')
      })
    })

    it('should render order button', async () => {
      await usingAsync(new Injector(), async (injector) => {
        const rootElement = document.getElementById('root') as HTMLDivElement
        const findOptions = createFindOptions()

        initializeShadeRoot({
          injector,
          rootElement,
          jsxElement: <DataGridHeader field="name" findOptions={findOptions} />,
        })

        await flushUpdates()

        const orderButton = document.querySelector('data-grid-order-button')
        expect(orderButton).not.toBeNull()
      })
    })

    it('should not render filter button when no filterConfig is provided', async () => {
      await usingAsync(new Injector(), async (injector) => {
        const rootElement = document.getElementById('root') as HTMLDivElement
        const findOptions = createFindOptions()

        initializeShadeRoot({
          injector,
          rootElement,
          jsxElement: <DataGridHeader field="name" findOptions={findOptions} />,
        })

        await flushUpdates()

        const filterButton = document.querySelector('data-grid-filter-button')
        expect(filterButton).toBeNull()
      })
    })

    it('should render filter button when filterConfig is provided', async () => {
      await usingAsync(new Injector(), async (injector) => {
        const rootElement = document.getElementById('root') as HTMLDivElement
        const findOptions = createFindOptions()

        initializeShadeRoot({
          injector,
          rootElement,
          jsxElement: <DataGridHeader field="name" findOptions={findOptions} filterConfig={{ type: 'string' }} />,
        })

        await flushUpdates()

        const filterButton = document.querySelector('data-grid-filter-button')
        expect(filterButton).not.toBeNull()
      })
    })
  })

  describe('OrderButton', () => {
    it('should show neutral icon when no order is set', async () => {
      await usingAsync(new Injector(), async (injector) => {
        const rootElement = document.getElementById('root') as HTMLDivElement
        const findOptions = createFilterableFindOptions()

        initializeShadeRoot({
          injector,
          rootElement,
          jsxElement: <OrderButton field="name" findOptions={findOptions} />,
        })

        await flushUpdates()

        const button = document.querySelector('data-grid-order-button')
        expect(button?.querySelector('shade-icon')).not.toBeNull()
      })
    })

    it('should toggle order to ASC when clicking on unsorted field', async () => {
      await usingAsync(new Injector(), async (injector) => {
        const rootElement = document.getElementById('root') as HTMLDivElement
        const findOptions = createFilterableFindOptions()

        initializeShadeRoot({
          injector,
          rootElement,
          jsxElement: <OrderButton field="name" findOptions={findOptions} />,
        })

        await flushUpdates()

        const button = document.querySelector('data-grid-order-button')?.querySelector('button')
        button?.click()

        await flushUpdates()

        const updatedOptions = findOptions.getValue()
        expect(updatedOptions.order).toEqual({ name: 'ASC' })
      })
    })

    it('should toggle order from ASC to DESC when clicking', async () => {
      await usingAsync(new Injector(), async (injector) => {
        const rootElement = document.getElementById('root') as HTMLDivElement
        const findOptions = createFilterableFindOptions({ order: { name: 'ASC' } })

        initializeShadeRoot({
          injector,
          rootElement,
          jsxElement: <OrderButton field="name" findOptions={findOptions} />,
        })

        await flushUpdates()

        const button = document.querySelector('data-grid-order-button')?.querySelector('button')
        button?.click()

        await flushUpdates()

        const updatedOptions = findOptions.getValue()
        expect(updatedOptions.order).toEqual({ name: 'DESC' })
      })
    })

    it('should toggle order from DESC to ASC when clicking', async () => {
      await usingAsync(new Injector(), async (injector) => {
        const rootElement = document.getElementById('root') as HTMLDivElement
        const findOptions = createFilterableFindOptions({ order: { name: 'DESC' } })

        initializeShadeRoot({
          injector,
          rootElement,
          jsxElement: <OrderButton field="name" findOptions={findOptions} />,
        })

        await flushUpdates()

        const button = document.querySelector('data-grid-order-button')?.querySelector('button')
        button?.click()

        await flushUpdates()

        const updatedOptions = findOptions.getValue()
        expect(updatedOptions.order).toEqual({ name: 'ASC' })
      })
    })

    it('should react to external findOptions changes', async () => {
      await usingAsync(new Injector(), async (injector) => {
        const rootElement = document.getElementById('root') as HTMLDivElement
        const findOptions = createFilterableFindOptions()

        initializeShadeRoot({
          injector,
          rootElement,
          jsxElement: <OrderButton field="name" findOptions={findOptions} />,
        })

        await flushUpdates()

        let button = document.querySelector('data-grid-order-button')
        expect(button?.querySelector('shade-icon')).not.toBeNull()

        findOptions.setValue({ order: { name: 'ASC' } })
        await flushUpdates()

        button = document.querySelector('data-grid-order-button')
        expect(button?.querySelector('shade-icon')).not.toBeNull()
      })
    })
  })

  describe('FilterButton', () => {
    it('should show inactive state when no filter is set', async () => {
      await usingAsync(new Injector(), async (injector) => {
        const rootElement = document.getElementById('root') as HTMLDivElement
        const findOptions = createFindOptions()

        initializeShadeRoot({
          injector,
          rootElement,
          jsxElement: <DataGridHeader field="name" findOptions={findOptions} filterConfig={{ type: 'string' }} />,
        })

        await flushUpdates()
        await flushUpdates()

        const filterButton = document.querySelector('data-grid-filter-button')
        expect(filterButton?.querySelector('shade-icon')).not.toBeNull()
      })
    })

    it('should show active state when filter is set for field', async () => {
      await usingAsync(new Injector(), async (injector) => {
        const rootElement = document.getElementById('root') as HTMLDivElement
        const findOptions = createFindOptions({ filter: { name: { $regex: 'test' } } })

        initializeShadeRoot({
          injector,
          rootElement,
          jsxElement: <DataGridHeader field="name" findOptions={findOptions} filterConfig={{ type: 'string' }} />,
        })

        await flushUpdates()
        await flushUpdates()

        const filterButton = document.querySelector('data-grid-filter-button')
        expect(filterButton?.querySelector('shade-icon')).not.toBeNull()
      })
    })

    it('should transition from active to inactive when filter is externally cleared', async () => {
      await usingAsync(new Injector(), async (injector) => {
        const rootElement = document.getElementById('root') as HTMLDivElement
        const findOptions = createFindOptions({ filter: { name: { $regex: 'test' } } })

        initializeShadeRoot({
          injector,
          rootElement,
          jsxElement: <DataGridHeader field="name" findOptions={findOptions} filterConfig={{ type: 'string' }} />,
        })

        // Parent renders, then child FilterButton renders
        await flushUpdates()
        await flushUpdates()

        const filterButton = document.querySelector('data-grid-filter-button button')
        expect(filterButton?.hasAttribute('data-selected')).toBe(true)

        findOptions.setValue({ filter: {} })
        await flushUpdates()
        await flushUpdates()

        const updatedButton = document.querySelector('data-grid-filter-button button')
        expect(updatedButton?.hasAttribute('data-selected')).toBe(false)
      })
    })

    it('should open filter dropdown when clicked', async () => {
      await usingAsync(new Injector(), async (injector) => {
        const rootElement = document.getElementById('root') as HTMLDivElement
        const findOptions = createFindOptions()

        initializeShadeRoot({
          injector,
          rootElement,
          jsxElement: <DataGridHeader field="name" findOptions={findOptions} filterConfig={{ type: 'string' }} />,
        })

        await flushUpdates()

        const filterButton = document.querySelector('data-grid-filter-button')?.querySelector('button')
        filterButton?.click()

        await flushUpdates()

        const dropdown = document.querySelector('data-grid-filter-dropdown')
        expect(dropdown).not.toBeNull()
      })
    })
  })

  describe('filter type routing', () => {
    it('should render StringFilter for string filterConfig', async () => {
      await usingAsync(new Injector(), async (injector) => {
        const rootElement = document.getElementById('root') as HTMLDivElement
        const findOptions = createFindOptions()

        initializeShadeRoot({
          injector,
          rootElement,
          jsxElement: <DataGridHeader field="name" findOptions={findOptions} filterConfig={{ type: 'string' }} />,
        })

        await flushUpdates()

        const filterButton = document.querySelector('data-grid-filter-button')?.querySelector('button')
        filterButton?.click()

        await flushUpdates()

        const stringFilter = document.querySelector('data-grid-string-filter')
        expect(stringFilter).not.toBeNull()
      })
    })

    it('should render NumberFilter for number filterConfig', async () => {
      await usingAsync(new Injector(), async (injector) => {
        const rootElement = document.getElementById('root') as HTMLDivElement
        const findOptions = createFindOptions()

        initializeShadeRoot({
          injector,
          rootElement,
          jsxElement: <DataGridHeader field="id" findOptions={findOptions} filterConfig={{ type: 'number' }} />,
        })

        await flushUpdates()

        const filterButton = document.querySelector('data-grid-filter-button')?.querySelector('button')
        filterButton?.click()

        await flushUpdates()

        const numberFilter = document.querySelector('data-grid-number-filter')
        expect(numberFilter).not.toBeNull()
      })
    })

    it('should render BooleanFilter for boolean filterConfig', async () => {
      await usingAsync(new Injector(), async (injector) => {
        const rootElement = document.getElementById('root') as HTMLDivElement
        const findOptions = createFindOptions()

        initializeShadeRoot({
          injector,
          rootElement,
          jsxElement: <DataGridHeader field="name" findOptions={findOptions} filterConfig={{ type: 'boolean' }} />,
        })

        await flushUpdates()

        const filterButton = document.querySelector('data-grid-filter-button')?.querySelector('button')
        filterButton?.click()

        await flushUpdates()

        const booleanFilter = document.querySelector('data-grid-boolean-filter')
        expect(booleanFilter).not.toBeNull()
      })
    })

    it('should render EnumFilter for enum filterConfig', async () => {
      await usingAsync(new Injector(), async (injector) => {
        const rootElement = document.getElementById('root') as HTMLDivElement
        const findOptions = createFindOptions()

        initializeShadeRoot({
          injector,
          rootElement,
          jsxElement: (
            <DataGridHeader
              field="name"
              findOptions={findOptions}
              filterConfig={{ type: 'enum', values: [{ label: 'A', value: 'a' }] }}
            />
          ),
        })

        await flushUpdates()

        const filterButton = document.querySelector('data-grid-filter-button')?.querySelector('button')
        filterButton?.click()

        await flushUpdates()

        const enumFilter = document.querySelector('data-grid-enum-filter')
        expect(enumFilter).not.toBeNull()
      })
    })

    it('should render DateFilter for date filterConfig', async () => {
      await usingAsync(new Injector(), async (injector) => {
        const rootElement = document.getElementById('root') as HTMLDivElement
        const findOptions = createFindOptions()

        initializeShadeRoot({
          injector,
          rootElement,
          jsxElement: <DataGridHeader field="name" findOptions={findOptions} filterConfig={{ type: 'date' }} />,
        })

        await flushUpdates()

        const filterButton = document.querySelector('data-grid-filter-button')?.querySelector('button')
        filterButton?.click()

        await flushUpdates()

        const dateFilter = document.querySelector('data-grid-date-filter')
        expect(dateFilter).not.toBeNull()
      })
    })
  })

  describe('integration', () => {
    it('should support both sorting and filtering simultaneously', async () => {
      await usingAsync(new Injector(), async (injector) => {
        const rootElement = document.getElementById('root') as HTMLDivElement
        const findOptions = createFindOptions()

        initializeShadeRoot({
          injector,
          rootElement,
          jsxElement: <DataGridHeader field="name" findOptions={findOptions} filterConfig={{ type: 'string' }} />,
        })

        await flushUpdates()

        const orderButton = document.querySelector('data-grid-order-button')?.querySelector('button')
        orderButton?.click()

        await flushUpdates()

        expect(findOptions.getValue().order).toEqual({ name: 'ASC' })

        const filterButton = document.querySelector('data-grid-filter-button')?.querySelector('button')
        filterButton?.click()

        await flushUpdates()

        const dropdown = document.querySelector('data-grid-filter-dropdown')
        expect(dropdown).not.toBeNull()
      })
    })
  })
})
