import { Injector } from '@furystack/inject'
import { createComponent, flushUpdates, initializeShadeRoot } from '@furystack/shades'
import { usingAsync } from '@furystack/utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { FilterableFindOptions } from '../data-grid.js'
import { DateFilter } from './date-filter.js'

describe('DateFilter', () => {
  beforeEach(() => {
    document.body.innerHTML = '<div id="root"></div>'
  })

  afterEach(() => {
    document.body.innerHTML = ''
  })

  const createFindOptions = (options: Partial<FilterableFindOptions> = {}): FilterableFindOptions => {
    return options as FilterableFindOptions
  }

  const renderDateFilter = async (
    findOptions: FilterableFindOptions,
    field = 'createdAt',
    onClose = vi.fn(),
    onFindOptionsChange = vi.fn(),
  ) => {
    const injector = new Injector()
    const rootElement = document.getElementById('root')!
    initializeShadeRoot({
      injector,
      rootElement,
      jsxElement: (
        <DateFilter
          field={field}
          findOptions={findOptions}
          onFindOptionsChange={onFindOptionsChange}
          onClose={onClose}
        />
      ),
    })
    await flushUpdates()
    return { injector, onClose, onFindOptionsChange }
  }

  it('should render mode segmented control and date input', async () => {
    const findOptions = createFindOptions()
    await usingAsync((await renderDateFilter(findOptions)).injector, async () => {
      const control = document.querySelector('shade-segmented-control')
      expect(control).not.toBeNull()

      const input = document.querySelector('[data-testid="date-filter-value"]')
      expect(input).not.toBeNull()
    })
  })

  it('should apply "before" filter on submit', async () => {
    const findOptions = createFindOptions()
    const { injector, onClose, onFindOptionsChange } = await renderDateFilter(findOptions)
    await usingAsync(injector, async () => {
      const input = document.querySelector('[data-testid="date-filter-value"]') as HTMLInputElement
      input.value = '2025-06-15T10:30'
      input.dispatchEvent(new Event('input', { bubbles: true }))

      const form = document.querySelector('form') as HTMLFormElement
      form.dispatchEvent(new Event('submit', { bubbles: true }))
      await flushUpdates()

      const updatedOptions = onFindOptionsChange.mock.lastCall?.[0] as FilterableFindOptions
      const filter = updatedOptions.filter?.createdAt as Record<string, Date>
      expect(filter.$lt).toBeInstanceOf(Date)
      expect(filter.$lt.toISOString()).toBe(new Date('2025-06-15T10:30').toISOString())
      expect(onClose).toHaveBeenCalled()
    })
  })

  it('should apply "after" filter when mode is changed', async () => {
    const findOptions = createFindOptions()
    const { injector, onClose, onFindOptionsChange } = await renderDateFilter(findOptions)
    await usingAsync(injector, async () => {
      const afterButton = document.querySelector(
        'shade-segmented-control button[data-value="after"]',
      ) as HTMLButtonElement
      afterButton?.click()
      await flushUpdates()

      const input = document.querySelector('[data-testid="date-filter-value"]') as HTMLInputElement
      input.value = '2025-01-01T00:00'
      input.dispatchEvent(new Event('input', { bubbles: true }))

      const form = document.querySelector('form') as HTMLFormElement
      form.dispatchEvent(new Event('submit', { bubbles: true }))
      await flushUpdates()

      const updatedOptions = onFindOptionsChange.mock.lastCall?.[0] as FilterableFindOptions
      const filter = updatedOptions.filter?.createdAt as Record<string, Date>
      expect(filter.$gt).toBeInstanceOf(Date)
      expect(onClose).toHaveBeenCalled()
    })
  })

  it('should apply "between" filter with both dates', async () => {
    const findOptions = createFindOptions()
    const { injector, onClose, onFindOptionsChange } = await renderDateFilter(findOptions)
    await usingAsync(injector, async () => {
      const betweenButton = document.querySelector(
        'shade-segmented-control button[data-value="between"]',
      ) as HTMLButtonElement
      betweenButton?.click()
      await flushUpdates()

      const startInput = document.querySelector('[data-testid="date-filter-value"]') as HTMLInputElement
      startInput.value = '2025-01-01T00:00'
      startInput.dispatchEvent(new Event('input', { bubbles: true }))

      const endInput = document.querySelector('[data-testid="date-filter-value-end"]') as HTMLInputElement
      endInput.value = '2025-12-31T23:59'
      endInput.dispatchEvent(new Event('input', { bubbles: true }))

      const form = document.querySelector('form') as HTMLFormElement
      form.dispatchEvent(new Event('submit', { bubbles: true }))
      await flushUpdates()

      const updatedOptions = onFindOptionsChange.mock.lastCall?.[0] as FilterableFindOptions
      const filter = updatedOptions.filter?.createdAt as Record<string, Date>
      expect(filter.$gte).toBeInstanceOf(Date)
      expect(filter.$lte).toBeInstanceOf(Date)
      expect(onClose).toHaveBeenCalled()
    })
  })

  it('should clear filter when Clear button is clicked', async () => {
    const findOptions = createFindOptions({ filter: { createdAt: { $lt: new Date() } } })
    const { injector, onClose, onFindOptionsChange } = await renderDateFilter(findOptions)
    await usingAsync(injector, async () => {
      const clearButton = Array.from(document.querySelectorAll('button')).find((b) => b.textContent?.trim() === 'Clear')
      clearButton?.click()
      await flushUpdates()

      const updatedOptions = onFindOptionsChange.mock.lastCall?.[0] as FilterableFindOptions
      expect(updatedOptions.filter?.createdAt).toBeUndefined()
      expect(onClose).toHaveBeenCalled()
    })
  })

  it('should remove filter when submitting empty date', async () => {
    const findOptions = createFindOptions({ filter: { createdAt: { $lt: new Date() } } })
    const { injector, onClose, onFindOptionsChange } = await renderDateFilter(findOptions)
    await usingAsync(injector, async () => {
      const input = document.querySelector('[data-testid="date-filter-value"]') as HTMLInputElement
      input.value = ''
      input.dispatchEvent(new Event('input', { bubbles: true }))

      const form = document.querySelector('form') as HTMLFormElement
      form.dispatchEvent(new Event('submit', { bubbles: true }))
      await flushUpdates()

      const updatedOptions = onFindOptionsChange.mock.lastCall?.[0] as FilterableFindOptions
      expect(updatedOptions.filter?.createdAt).toBeUndefined()
      expect(onClose).toHaveBeenCalled()
    })
  })

  it('should preserve filters on other fields', async () => {
    const findOptions = createFindOptions({
      filter: { createdAt: { $lt: new Date() }, name: { $regex: 'keep' } },
    })
    const { injector, onFindOptionsChange } = await renderDateFilter(findOptions)
    await usingAsync(injector, async () => {
      const clearButton = Array.from(document.querySelectorAll('button')).find((b) => b.textContent?.trim() === 'Clear')
      clearButton?.click()
      await flushUpdates()

      const updatedOptions = onFindOptionsChange.mock.lastCall?.[0] as FilterableFindOptions
      expect(updatedOptions.filter?.createdAt).toBeUndefined()
      expect(updatedOptions.filter?.name).toEqual({ $regex: 'keep' })
    })
  })

  it('should reset skip to 0 when applying filter', async () => {
    const findOptions = createFindOptions({ skip: 20 })
    const { injector, onFindOptionsChange } = await renderDateFilter(findOptions)
    await usingAsync(injector, async () => {
      const input = document.querySelector('[data-testid="date-filter-value"]') as HTMLInputElement
      input.value = '2025-06-15T10:30'
      input.dispatchEvent(new Event('input', { bubbles: true }))

      const form = document.querySelector('form') as HTMLFormElement
      form.dispatchEvent(new Event('submit', { bubbles: true }))
      await flushUpdates()

      expect(onFindOptionsChange).toHaveBeenCalledWith(expect.objectContaining({ skip: 0 }))
    })
  })
})
