import { Injector } from '@furystack/inject'
import { createComponent, flushUpdates, initializeShadeRoot } from '@furystack/shades'
import { usingAsync } from '@furystack/utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { FilterableFindOptions } from '../data-grid.js'
import { StringFilter } from './string-filter.js'

describe('StringFilter', () => {
  beforeEach(() => {
    document.body.innerHTML = '<div id="root"></div>'
  })

  afterEach(() => {
    document.body.innerHTML = ''
  })

  const createFindOptions = (options: Partial<FilterableFindOptions> = {}): FilterableFindOptions => {
    return options as FilterableFindOptions
  }

  const renderStringFilter = async (
    findOptions: FilterableFindOptions,
    field = 'name',
    onClose = vi.fn(),
    onFindOptionsChange = vi.fn(),
  ) => {
    const injector = new Injector()
    const rootElement = document.getElementById('root')!
    initializeShadeRoot({
      injector,
      rootElement,
      jsxElement: (
        <StringFilter
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
    await usingAsync((await renderStringFilter(findOptions)).injector, async () => {
      const control = document.querySelector('shade-segmented-control')
      expect(control).not.toBeNull()

      const input = document.querySelector('[data-testid="string-filter-value"]')
      expect(input).not.toBeNull()
    })
  })

  it('should apply $regex filter on submit', async () => {
    const findOptions = createFindOptions()
    const { injector, onClose, onFindOptionsChange } = await renderStringFilter(findOptions)
    await usingAsync(injector, async () => {
      const input = document.querySelector('[data-testid="string-filter-value"]') as HTMLInputElement
      input.value = 'test-value'
      input.dispatchEvent(new Event('input', { bubbles: true }))

      const form = document.querySelector('form') as HTMLFormElement
      form.dispatchEvent(new Event('submit', { bubbles: true }))
      await flushUpdates()

      expect(onFindOptionsChange).toHaveBeenCalledWith(
        expect.objectContaining({ filter: { name: { $regex: 'test-value' } } }),
      )
      expect(onClose).toHaveBeenCalled()
    })
  })

  it('should clear filter when Clear button is clicked', async () => {
    const findOptions = createFindOptions({ filter: { name: { $regex: 'existing' } } })
    const { injector, onClose, onFindOptionsChange } = await renderStringFilter(findOptions)
    await usingAsync(injector, async () => {
      const clearButton = Array.from(document.querySelectorAll('button')).find((b) => b.textContent?.trim() === 'Clear')
      clearButton?.click()
      await flushUpdates()

      const updatedOptions = onFindOptionsChange.mock.lastCall?.[0] as FilterableFindOptions
      expect(updatedOptions.filter?.name).toBeUndefined()
      expect(onClose).toHaveBeenCalled()
    })
  })

  it('should remove filter when submitting empty value', async () => {
    const findOptions = createFindOptions({ filter: { name: { $regex: 'existing' } } })
    const { injector, onClose, onFindOptionsChange } = await renderStringFilter(findOptions)
    await usingAsync(injector, async () => {
      const input = document.querySelector('[data-testid="string-filter-value"]') as HTMLInputElement
      input.value = ''
      input.dispatchEvent(new Event('input', { bubbles: true }))

      const form = document.querySelector('form') as HTMLFormElement
      form.dispatchEvent(new Event('submit', { bubbles: true }))
      await flushUpdates()

      const updatedOptions = onFindOptionsChange.mock.lastCall?.[0] as FilterableFindOptions
      expect(updatedOptions.filter?.name).toBeUndefined()
      expect(onClose).toHaveBeenCalled()
    })
  })

  it('should preserve filters on other fields', async () => {
    const findOptions = createFindOptions({ filter: { name: { $regex: 'old' }, email: { $regex: 'keep' } } })
    const { injector, onFindOptionsChange } = await renderStringFilter(findOptions)
    await usingAsync(injector, async () => {
      const input = document.querySelector('[data-testid="string-filter-value"]') as HTMLInputElement
      input.value = 'new-value'
      input.dispatchEvent(new Event('input', { bubbles: true }))

      const form = document.querySelector('form') as HTMLFormElement
      form.dispatchEvent(new Event('submit', { bubbles: true }))
      await flushUpdates()

      const updatedOptions = onFindOptionsChange.mock.lastCall?.[0] as FilterableFindOptions
      expect(updatedOptions.filter?.name).toEqual({ $regex: 'new-value' })
      expect(updatedOptions.filter?.email).toEqual({ $regex: 'keep' })
    })
  })

  it('should apply selected operator', async () => {
    const findOptions = createFindOptions()
    const { injector, onClose, onFindOptionsChange } = await renderStringFilter(findOptions)
    await usingAsync(injector, async () => {
      const eqButton = document.querySelector('shade-segmented-control button[data-value="$eq"]') as HTMLButtonElement
      eqButton?.click()
      await flushUpdates()

      const input = document.querySelector('[data-testid="string-filter-value"]') as HTMLInputElement
      input.value = 'exact'
      input.dispatchEvent(new Event('input', { bubbles: true }))

      const form = document.querySelector('form') as HTMLFormElement
      form.dispatchEvent(new Event('submit', { bubbles: true }))
      await flushUpdates()

      expect(onFindOptionsChange).toHaveBeenCalledWith(expect.objectContaining({ filter: { name: { $eq: 'exact' } } }))
      expect(onClose).toHaveBeenCalled()
    })
  })

  it('should reset skip to 0 when applying filter', async () => {
    const findOptions = createFindOptions({ skip: 20 })
    const { injector, onFindOptionsChange } = await renderStringFilter(findOptions)
    await usingAsync(injector, async () => {
      const input = document.querySelector('[data-testid="string-filter-value"]') as HTMLInputElement
      input.value = 'test'
      input.dispatchEvent(new Event('input', { bubbles: true }))

      const form = document.querySelector('form') as HTMLFormElement
      form.dispatchEvent(new Event('submit', { bubbles: true }))
      await flushUpdates()

      expect(onFindOptionsChange).toHaveBeenCalledWith(expect.objectContaining({ skip: 0 }))
    })
  })

  it('should show current filter value in input', async () => {
    const findOptions = createFindOptions({ filter: { name: { $regex: 'current-value' } } })
    await usingAsync((await renderStringFilter(findOptions)).injector, async () => {
      const input = document.querySelector('[data-testid="string-filter-value"]') as HTMLInputElement
      expect(input.value).toBe('current-value')
    })
  })
})
