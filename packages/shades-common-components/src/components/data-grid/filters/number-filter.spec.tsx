import { createInjector } from '@furystack/inject'
import { createComponent, flushUpdates, initializeShadeRoot } from '@furystack/shades'
import { usingAsync } from '@furystack/utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { FilterableFindOptions } from '../data-grid.js'
import { NumberFilter } from './number-filter.js'

describe('NumberFilter', () => {
  beforeEach(() => {
    document.body.innerHTML = '<div id="root"></div>'
  })

  afterEach(() => {
    document.body.innerHTML = ''
  })

  const createFindOptions = (options: Partial<FilterableFindOptions> = {}): FilterableFindOptions => {
    return options as FilterableFindOptions
  }

  const renderNumberFilter = async (
    findOptions: FilterableFindOptions,
    field = 'level',
    onClose = vi.fn(),
    onFindOptionsChange = vi.fn(),
  ) => {
    const injector = createInjector()
    const rootElement = document.getElementById('root')!
    initializeShadeRoot({
      injector,
      rootElement,
      jsxElement: (
        <NumberFilter
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

  it('should render operator segmented control and input', async () => {
    const findOptions = createFindOptions()
    await usingAsync((await renderNumberFilter(findOptions)).injector, async () => {
      const control = document.querySelector('shade-segmented-control')
      expect(control).not.toBeNull()

      const input = document.querySelector('[data-testid="number-filter-value"]')
      expect(input).not.toBeNull()
    })
  })

  it('should apply $eq filter on submit', async () => {
    const findOptions = createFindOptions()
    const { injector, onClose, onFindOptionsChange } = await renderNumberFilter(findOptions)
    await usingAsync(injector, async () => {
      const input = document.querySelector('[data-testid="number-filter-value"]') as HTMLInputElement
      input.value = '42'
      input.dispatchEvent(new Event('input', { bubbles: true }))

      const form = document.querySelector('form') as HTMLFormElement
      form.dispatchEvent(new Event('submit', { bubbles: true }))
      await flushUpdates()

      expect(onFindOptionsChange).toHaveBeenCalledWith(expect.objectContaining({ filter: { level: { $eq: 42 } } }))
      expect(onClose).toHaveBeenCalled()
    })
  })

  it('should apply $gt operator when selected', async () => {
    const findOptions = createFindOptions()
    const { injector, onClose, onFindOptionsChange } = await renderNumberFilter(findOptions)
    await usingAsync(injector, async () => {
      const gtButton = document.querySelector('shade-segmented-control button[data-value="$gt"]') as HTMLButtonElement
      gtButton?.click()
      await flushUpdates()

      const input = document.querySelector('[data-testid="number-filter-value"]') as HTMLInputElement
      input.value = '10'
      input.dispatchEvent(new Event('input', { bubbles: true }))

      const form = document.querySelector('form') as HTMLFormElement
      form.dispatchEvent(new Event('submit', { bubbles: true }))
      await flushUpdates()

      expect(onFindOptionsChange).toHaveBeenCalledWith(expect.objectContaining({ filter: { level: { $gt: 10 } } }))
      expect(onClose).toHaveBeenCalled()
    })
  })

  it('should apply $lte operator when selected', async () => {
    const findOptions = createFindOptions()
    const { injector, onClose, onFindOptionsChange } = await renderNumberFilter(findOptions)
    await usingAsync(injector, async () => {
      const lteButton = document.querySelector('shade-segmented-control button[data-value="$lte"]') as HTMLButtonElement
      lteButton?.click()
      await flushUpdates()

      const input = document.querySelector('[data-testid="number-filter-value"]') as HTMLInputElement
      input.value = '99.5'
      input.dispatchEvent(new Event('input', { bubbles: true }))

      const form = document.querySelector('form') as HTMLFormElement
      form.dispatchEvent(new Event('submit', { bubbles: true }))
      await flushUpdates()

      expect(onFindOptionsChange).toHaveBeenCalledWith(expect.objectContaining({ filter: { level: { $lte: 99.5 } } }))
      expect(onClose).toHaveBeenCalled()
    })
  })

  it('should clear filter when Clear button is clicked', async () => {
    const findOptions = createFindOptions({ filter: { level: { $eq: 5 } } })
    const { injector, onClose, onFindOptionsChange } = await renderNumberFilter(findOptions)
    await usingAsync(injector, async () => {
      const clearButton = Array.from(document.querySelectorAll('button')).find((b) => b.textContent?.trim() === 'Clear')
      clearButton?.click()
      await flushUpdates()

      const updatedOptions = onFindOptionsChange.mock.lastCall?.[0] as FilterableFindOptions
      expect(updatedOptions.filter?.level).toBeUndefined()
      expect(onClose).toHaveBeenCalled()
    })
  })

  it('should remove filter when submitting NaN value', async () => {
    const findOptions = createFindOptions({ filter: { level: { $eq: 5 } } })
    const { injector, onClose, onFindOptionsChange } = await renderNumberFilter(findOptions)
    await usingAsync(injector, async () => {
      const input = document.querySelector('[data-testid="number-filter-value"]') as HTMLInputElement
      input.value = ''
      input.dispatchEvent(new Event('input', { bubbles: true }))

      const form = document.querySelector('form') as HTMLFormElement
      form.dispatchEvent(new Event('submit', { bubbles: true }))
      await flushUpdates()

      const updatedOptions = onFindOptionsChange.mock.lastCall?.[0] as FilterableFindOptions
      expect(updatedOptions.filter?.level).toBeUndefined()
      expect(onClose).toHaveBeenCalled()
    })
  })

  it('should preserve filters on other fields', async () => {
    const findOptions = createFindOptions({ filter: { level: { $gt: 10 }, name: { $regex: 'keep' } } })
    const { injector, onFindOptionsChange } = await renderNumberFilter(findOptions)
    await usingAsync(injector, async () => {
      const clearButton = Array.from(document.querySelectorAll('button')).find((b) => b.textContent?.trim() === 'Clear')
      clearButton?.click()
      await flushUpdates()

      const updatedOptions = onFindOptionsChange.mock.lastCall?.[0] as FilterableFindOptions
      expect(updatedOptions.filter?.level).toBeUndefined()
      expect(updatedOptions.filter?.name).toEqual({ $regex: 'keep' })
    })
  })

  it('should reset skip to 0 when applying filter', async () => {
    const findOptions = createFindOptions({ skip: 20 })
    const { injector, onFindOptionsChange } = await renderNumberFilter(findOptions)
    await usingAsync(injector, async () => {
      const input = document.querySelector('[data-testid="number-filter-value"]') as HTMLInputElement
      input.value = '5'
      input.dispatchEvent(new Event('input', { bubbles: true }))

      const form = document.querySelector('form') as HTMLFormElement
      form.dispatchEvent(new Event('submit', { bubbles: true }))
      await flushUpdates()

      expect(onFindOptionsChange).toHaveBeenCalledWith(expect.objectContaining({ skip: 0 }))
    })
  })

  it('should show current filter value in input', async () => {
    const findOptions = createFindOptions({ filter: { level: { $eq: 25 } } })
    await usingAsync((await renderNumberFilter(findOptions)).injector, async () => {
      const input = document.querySelector('[data-testid="number-filter-value"]') as HTMLInputElement
      expect(input.value).toBe('25')
    })
  })
})
