import type { FindOptions } from '@furystack/core'
import { Injector } from '@furystack/inject'
import { createComponent, initializeShadeRoot } from '@furystack/shades'
import { ObservableValue, sleepAsync } from '@furystack/utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
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

  describe('rendering', () => {
    it('should render with custom element', async () => {
      const injector = new Injector()
      const rootElement = document.getElementById('root') as HTMLDivElement
      const findOptions = createFindOptions()

      initializeShadeRoot({
        injector,
        rootElement,
        jsxElement: <DataGridHeader field="name" findOptions={findOptions} />,
      })

      await sleepAsync(50)

      const header = document.querySelector('data-grid-header')
      expect(header).not.toBeNull()
    })

    it('should render field name', async () => {
      const injector = new Injector()
      const rootElement = document.getElementById('root') as HTMLDivElement
      const findOptions = createFindOptions()

      initializeShadeRoot({
        injector,
        rootElement,
        jsxElement: <DataGridHeader field="name" findOptions={findOptions} />,
      })

      await sleepAsync(50)

      const header = document.querySelector('data-grid-header')
      const fieldName = header?.querySelector('.header-field-name')
      expect(fieldName?.textContent).toBe('name')
    })

    it('should render order button', async () => {
      const injector = new Injector()
      const rootElement = document.getElementById('root') as HTMLDivElement
      const findOptions = createFindOptions()

      initializeShadeRoot({
        injector,
        rootElement,
        jsxElement: <DataGridHeader field="name" findOptions={findOptions} />,
      })

      await sleepAsync(50)

      const orderButton = document.querySelector('data-grid-order-button')
      expect(orderButton).not.toBeNull()
    })

    it('should render search button', async () => {
      const injector = new Injector()
      const rootElement = document.getElementById('root') as HTMLDivElement
      const findOptions = createFindOptions()

      initializeShadeRoot({
        injector,
        rootElement,
        jsxElement: <DataGridHeader field="name" findOptions={findOptions} />,
      })

      await sleepAsync(50)

      const searchButton = document.querySelector('data-grid-search-button')
      expect(searchButton).not.toBeNull()
    })

    it('should render search form', async () => {
      const injector = new Injector()
      const rootElement = document.getElementById('root') as HTMLDivElement
      const findOptions = createFindOptions()

      initializeShadeRoot({
        injector,
        rootElement,
        jsxElement: <DataGridHeader field="name" findOptions={findOptions} />,
      })

      await sleepAsync(50)

      const searchForm = document.querySelector('data-grid-search-form')
      expect(searchForm).not.toBeNull()
    })
  })

  describe('OrderButton', () => {
    it('should show neutral icon when no order is set', async () => {
      const injector = new Injector()
      const rootElement = document.getElementById('root') as HTMLDivElement
      const findOptions = createFindOptions()

      initializeShadeRoot({
        injector,
        rootElement,
        jsxElement: <OrderButton field="name" findOptions={findOptions} />,
      })

      await sleepAsync(50)

      const button = document.querySelector('data-grid-order-button')
      expect(button?.textContent).toContain('↕')
    })

    it('should show descending icon when ASC order is set for field', async () => {
      const injector = new Injector()
      const rootElement = document.getElementById('root') as HTMLDivElement
      const findOptions = createFindOptions({ order: { name: 'ASC' } })

      initializeShadeRoot({
        injector,
        rootElement,
        jsxElement: <OrderButton field="name" findOptions={findOptions} />,
      })

      await sleepAsync(50)

      const button = document.querySelector('data-grid-order-button')
      expect(button?.textContent).toContain('⬇')
    })

    it('should show ascending icon when DESC order is set for field', async () => {
      const injector = new Injector()
      const rootElement = document.getElementById('root') as HTMLDivElement
      const findOptions = createFindOptions({ order: { name: 'DESC' } })

      initializeShadeRoot({
        injector,
        rootElement,
        jsxElement: <OrderButton field="name" findOptions={findOptions} />,
      })

      await sleepAsync(50)

      const button = document.querySelector('data-grid-order-button')
      expect(button?.textContent).toContain('⬆')
    })

    it('should show neutral icon when order is set for different field', async () => {
      const injector = new Injector()
      const rootElement = document.getElementById('root') as HTMLDivElement
      const findOptions = createFindOptions({ order: { id: 'ASC' } })

      initializeShadeRoot({
        injector,
        rootElement,
        jsxElement: <OrderButton field="name" findOptions={findOptions} />,
      })

      await sleepAsync(50)

      const button = document.querySelector('data-grid-order-button')
      expect(button?.textContent).toContain('↕')
    })

    it('should toggle order to ASC when clicking on unsorted field', async () => {
      const injector = new Injector()
      const rootElement = document.getElementById('root') as HTMLDivElement
      const findOptions = createFindOptions()

      initializeShadeRoot({
        injector,
        rootElement,
        jsxElement: <OrderButton field="name" findOptions={findOptions} />,
      })

      await sleepAsync(50)

      const button = document.querySelector('data-grid-order-button')?.querySelector('button')
      button?.click()

      await sleepAsync(50)

      const updatedOptions = findOptions.getValue()
      expect(updatedOptions.order).toEqual({ name: 'ASC' })
    })

    it('should toggle order from ASC to DESC when clicking', async () => {
      const injector = new Injector()
      const rootElement = document.getElementById('root') as HTMLDivElement
      const findOptions = createFindOptions({ order: { name: 'ASC' } })

      initializeShadeRoot({
        injector,
        rootElement,
        jsxElement: <OrderButton field="name" findOptions={findOptions} />,
      })

      await sleepAsync(50)

      const button = document.querySelector('data-grid-order-button')?.querySelector('button')
      button?.click()

      await sleepAsync(50)

      const updatedOptions = findOptions.getValue()
      expect(updatedOptions.order).toEqual({ name: 'DESC' })
    })

    it('should toggle order from DESC to ASC when clicking', async () => {
      const injector = new Injector()
      const rootElement = document.getElementById('root') as HTMLDivElement
      const findOptions = createFindOptions({ order: { name: 'DESC' } })

      initializeShadeRoot({
        injector,
        rootElement,
        jsxElement: <OrderButton field="name" findOptions={findOptions} />,
      })

      await sleepAsync(50)

      const button = document.querySelector('data-grid-order-button')?.querySelector('button')
      button?.click()

      await sleepAsync(50)

      const updatedOptions = findOptions.getValue()
      expect(updatedOptions.order).toEqual({ name: 'ASC' })
    })

    it('should react to external findOptions changes', async () => {
      const injector = new Injector()
      const rootElement = document.getElementById('root') as HTMLDivElement
      const findOptions = createFindOptions()

      initializeShadeRoot({
        injector,
        rootElement,
        jsxElement: <OrderButton field="name" findOptions={findOptions} />,
      })

      await sleepAsync(50)

      let button = document.querySelector('data-grid-order-button')
      expect(button?.textContent).toContain('↕')

      findOptions.setValue({ order: { name: 'ASC' } })
      await sleepAsync(50)

      button = document.querySelector('data-grid-order-button')
      expect(button?.textContent).toContain('⬇')
    })
  })

  describe('SearchButton', () => {
    it('should show inactive icon when no filter is set', async () => {
      const injector = new Injector()
      const rootElement = document.getElementById('root') as HTMLDivElement
      const findOptions = createFindOptions()

      initializeShadeRoot({
        injector,
        rootElement,
        jsxElement: <DataGridHeader field="name" findOptions={findOptions} />,
      })

      await sleepAsync(50)

      const searchButton = document.querySelector('data-grid-search-button')
      expect(searchButton?.textContent).toContain('🔎')
    })

    it('should show active icon when filter is set for field', async () => {
      const injector = new Injector()
      const rootElement = document.getElementById('root') as HTMLDivElement
      const findOptions = createFindOptions({ filter: { name: { $regex: 'test' } } })

      initializeShadeRoot({
        injector,
        rootElement,
        jsxElement: <DataGridHeader field="name" findOptions={findOptions} />,
      })

      await sleepAsync(50)

      const searchButton = document.querySelector('data-grid-search-button')
      expect(searchButton?.textContent).toContain('🔍')
    })

    it('should show inactive icon when filter is set for different field', async () => {
      const injector = new Injector()
      const rootElement = document.getElementById('root') as HTMLDivElement
      const findOptions = createFindOptions({ filter: { email: { $regex: 'test' } } })

      initializeShadeRoot({
        injector,
        rootElement,
        jsxElement: <DataGridHeader field="name" findOptions={findOptions} />,
      })

      await sleepAsync(50)

      const searchButton = document.querySelector('data-grid-search-button')
      expect(searchButton?.textContent).toContain('🔎')
    })
  })

  describe('SearchForm', () => {
    it('should expand search form when search button is clicked', async () => {
      const injector = new Injector()
      const rootElement = document.getElementById('root') as HTMLDivElement
      const findOptions = createFindOptions()

      initializeShadeRoot({
        injector,
        rootElement,
        jsxElement: <DataGridHeader field="name" findOptions={findOptions} />,
      })

      await sleepAsync(50)

      const searchButton = document.querySelector('data-grid-search-button')?.querySelector('button')
      searchButton?.click()

      await sleepAsync(150)

      const searchForm = document.querySelector('.search-form') as HTMLElement
      expect(searchForm.style.display).toBe('flex')
    })

    it('should update findOptions when search is submitted', async () => {
      const injector = new Injector()
      const rootElement = document.getElementById('root') as HTMLDivElement
      const findOptions = createFindOptions()

      initializeShadeRoot({
        injector,
        rootElement,
        jsxElement: <DataGridHeader field="name" findOptions={findOptions} />,
      })

      await sleepAsync(50)

      const searchButton = document.querySelector('data-grid-search-button')?.querySelector('button')
      searchButton?.click()

      await sleepAsync(150)

      const input = document.querySelector('.search-form input') as HTMLInputElement
      input.value = 'test-search'
      input.dispatchEvent(new Event('input', { bubbles: true }))

      const form = document.querySelector('.search-form') as HTMLFormElement
      form.dispatchEvent(new Event('submit', { bubbles: true }))

      await sleepAsync(50)

      const updatedOptions = findOptions.getValue()
      expect(updatedOptions.filter).toEqual({ name: { $regex: 'test-search' } })
    })

    it('should clear filter when clear button is clicked', async () => {
      const injector = new Injector()
      const rootElement = document.getElementById('root') as HTMLDivElement
      const findOptions = createFindOptions({ filter: { name: { $regex: 'existing' } } })

      initializeShadeRoot({
        injector,
        rootElement,
        jsxElement: <DataGridHeader field="name" findOptions={findOptions} />,
      })

      await sleepAsync(50)

      const searchButton = document.querySelector('data-grid-search-button')?.querySelector('button')
      searchButton?.click()

      await sleepAsync(150)

      const clearButton = document.querySelector('.search-form button[type="reset"]') as HTMLButtonElement
      clearButton?.click()

      await sleepAsync(50)

      const updatedOptions = findOptions.getValue()
      expect(updatedOptions.filter?.name).toBeUndefined()
    })

    it('should preserve filters for other fields when submitting search', async () => {
      const injector = new Injector()
      const rootElement = document.getElementById('root') as HTMLDivElement
      const findOptions = createFindOptions({ filter: { email: { $regex: 'existing' } } })

      initializeShadeRoot({
        injector,
        rootElement,
        jsxElement: <DataGridHeader field="name" findOptions={findOptions} />,
      })

      await sleepAsync(50)

      const searchButton = document.querySelector('data-grid-search-button')?.querySelector('button')
      searchButton?.click()

      await sleepAsync(150)

      const input = document.querySelector('.search-form input') as HTMLInputElement
      input.value = 'new-search'
      input.dispatchEvent(new Event('input', { bubbles: true }))

      const form = document.querySelector('.search-form') as HTMLFormElement
      form.dispatchEvent(new Event('submit', { bubbles: true }))

      await sleepAsync(50)

      const updatedOptions = findOptions.getValue()
      expect(updatedOptions.filter).toEqual({
        email: { $regex: 'existing' },
        name: { $regex: 'new-search' },
      })
    })

    it('should preserve other findOptions properties when updating filter', async () => {
      const injector = new Injector()
      const rootElement = document.getElementById('root') as HTMLDivElement
      const findOptions = createFindOptions({
        order: { id: 'ASC' },
        top: 10,
        skip: 20,
      })

      initializeShadeRoot({
        injector,
        rootElement,
        jsxElement: <DataGridHeader field="name" findOptions={findOptions} />,
      })

      await sleepAsync(50)

      const searchButton = document.querySelector('data-grid-search-button')?.querySelector('button')
      searchButton?.click()

      await sleepAsync(150)

      const input = document.querySelector('.search-form input') as HTMLInputElement
      input.value = 'search-value'
      input.dispatchEvent(new Event('input', { bubbles: true }))

      const form = document.querySelector('.search-form') as HTMLFormElement
      form.dispatchEvent(new Event('submit', { bubbles: true }))

      await sleepAsync(50)

      const updatedOptions = findOptions.getValue()
      expect(updatedOptions.order).toEqual({ id: 'ASC' })
      expect(updatedOptions.top).toBe(10)
      expect(updatedOptions.skip).toBe(20)
      expect(updatedOptions.filter).toEqual({ name: { $regex: 'search-value' } })
    })

    it('should show current filter value in search input', async () => {
      const injector = new Injector()
      const rootElement = document.getElementById('root') as HTMLDivElement
      const findOptions = createFindOptions({ filter: { name: { $regex: 'current-filter' } } })

      initializeShadeRoot({
        injector,
        rootElement,
        jsxElement: <DataGridHeader field="name" findOptions={findOptions} />,
      })

      await sleepAsync(50)

      const searchButton = document.querySelector('data-grid-search-button')?.querySelector('button')
      searchButton?.click()

      await sleepAsync(150)

      const input = document.querySelector('.search-form input') as HTMLInputElement
      expect(input.value).toBe('current-filter')
    })
  })

  describe('integration', () => {
    it('should support both sorting and filtering simultaneously', async () => {
      const injector = new Injector()
      const rootElement = document.getElementById('root') as HTMLDivElement
      const findOptions = createFindOptions()

      initializeShadeRoot({
        injector,
        rootElement,
        jsxElement: <DataGridHeader field="name" findOptions={findOptions} />,
      })

      await sleepAsync(50)

      const orderButton = document.querySelector('data-grid-order-button')?.querySelector('button')
      orderButton?.click()

      await sleepAsync(50)

      const searchButton = document.querySelector('data-grid-search-button')?.querySelector('button')
      searchButton?.click()

      await sleepAsync(150)

      const input = document.querySelector('.search-form input') as HTMLInputElement
      input.value = 'filter-value'
      input.dispatchEvent(new Event('input', { bubbles: true }))

      const form = document.querySelector('.search-form') as HTMLFormElement
      form.dispatchEvent(new Event('submit', { bubbles: true }))

      await sleepAsync(50)

      const updatedOptions = findOptions.getValue()
      expect(updatedOptions.order).toEqual({ name: 'ASC' })
      expect(updatedOptions.filter).toEqual({ name: { $regex: 'filter-value' } })
    })
  })
})
