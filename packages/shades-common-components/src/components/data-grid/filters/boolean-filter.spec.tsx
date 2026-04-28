import { createInjector } from '@furystack/inject'
import { createComponent, flushUpdates, initializeShadeRoot } from '@furystack/shades'
import { usingAsync } from '@furystack/utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { FilterableFindOptions } from '../data-grid.js'
import { BooleanFilter } from './boolean-filter.js'

describe('BooleanFilter', () => {
  beforeEach(() => {
    document.body.innerHTML = '<div id="root"></div>'
  })

  afterEach(() => {
    document.body.innerHTML = ''
  })

  const createFindOptions = (options: Partial<FilterableFindOptions> = {}): FilterableFindOptions => {
    return options
  }

  const renderBooleanFilter = async (
    findOptions: FilterableFindOptions,
    field = 'isActive',
    onClose = vi.fn(),
    onFindOptionsChange = vi.fn(),
  ) => {
    const injector = createInjector()
    const rootElement = document.getElementById('root')!
    initializeShadeRoot({
      injector,
      rootElement,
      jsxElement: (
        <BooleanFilter
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

  it('should render three options: True, False, Any', async () => {
    const findOptions = createFindOptions()
    await usingAsync((await renderBooleanFilter(findOptions)).injector, async () => {
      const buttons = document.querySelectorAll('shade-segmented-control button[data-value]')
      expect(buttons.length).toBe(3)
      const values = Array.from(buttons).map((b) => b.getAttribute('data-value'))
      expect(values).toEqual(['true', 'false', 'any'])
    })
  })

  it('should select "any" when no filter is set', async () => {
    const findOptions = createFindOptions()
    await usingAsync((await renderBooleanFilter(findOptions)).injector, async () => {
      const selected = document.querySelector('shade-segmented-control button[data-selected]')
      expect(selected?.getAttribute('data-value')).toBe('any')
    })
  })

  it('should select "true" when filter is $eq: true', async () => {
    const findOptions = createFindOptions({ filter: { isActive: { $eq: true } } })
    await usingAsync((await renderBooleanFilter(findOptions)).injector, async () => {
      const selected = document.querySelector('shade-segmented-control button[data-selected]')
      expect(selected?.getAttribute('data-value')).toBe('true')
    })
  })

  it('should select "false" when filter is $eq: false', async () => {
    const findOptions = createFindOptions({ filter: { isActive: { $eq: false } } })
    await usingAsync((await renderBooleanFilter(findOptions)).injector, async () => {
      const selected = document.querySelector('shade-segmented-control button[data-selected]')
      expect(selected?.getAttribute('data-value')).toBe('false')
    })
  })

  it('should set filter to $eq: true when "True" is clicked', async () => {
    const findOptions = createFindOptions()
    const { injector, onClose, onFindOptionsChange } = await renderBooleanFilter(findOptions)
    await usingAsync(injector, async () => {
      const trueButton = document.querySelector(
        'shade-segmented-control button[data-value="true"]',
      ) as HTMLButtonElement
      trueButton?.click()
      await flushUpdates()

      expect(onFindOptionsChange).toHaveBeenCalledWith(expect.objectContaining({ filter: { isActive: { $eq: true } } }))
      expect(onClose).toHaveBeenCalled()
    })
  })

  it('should set filter to $eq: false when "False" is clicked', async () => {
    const findOptions = createFindOptions()
    const { injector, onClose, onFindOptionsChange } = await renderBooleanFilter(findOptions)
    await usingAsync(injector, async () => {
      const falseButton = document.querySelector(
        'shade-segmented-control button[data-value="false"]',
      ) as HTMLButtonElement
      falseButton?.click()
      await flushUpdates()

      expect(onFindOptionsChange).toHaveBeenCalledWith(
        expect.objectContaining({ filter: { isActive: { $eq: false } } }),
      )
      expect(onClose).toHaveBeenCalled()
    })
  })

  it('should remove filter when "Any" is clicked', async () => {
    const findOptions = createFindOptions({ filter: { isActive: { $eq: true } } })
    const { injector, onClose, onFindOptionsChange } = await renderBooleanFilter(findOptions)
    await usingAsync(injector, async () => {
      const anyButton = document.querySelector('shade-segmented-control button[data-value="any"]') as HTMLButtonElement
      anyButton?.click()
      await flushUpdates()

      const updatedOptions = onFindOptionsChange.mock.lastCall?.[0] as FilterableFindOptions
      expect(updatedOptions.filter?.isActive).toBeUndefined()
      expect(onClose).toHaveBeenCalled()
    })
  })

  it('should preserve filters on other fields', async () => {
    const findOptions = createFindOptions({ filter: { isActive: { $eq: true }, name: { $regex: 'test' } } })
    const { injector, onClose, onFindOptionsChange } = await renderBooleanFilter(findOptions)
    await usingAsync(injector, async () => {
      const anyButton = document.querySelector('shade-segmented-control button[data-value="any"]') as HTMLButtonElement
      anyButton?.click()
      await flushUpdates()

      const updatedOptions = onFindOptionsChange.mock.lastCall?.[0] as FilterableFindOptions
      expect(updatedOptions.filter?.isActive).toBeUndefined()
      expect(updatedOptions.filter?.name).toEqual({ $regex: 'test' })
      expect(onClose).toHaveBeenCalled()
    })
  })

  it('should reset skip to 0 when applying filter', async () => {
    const findOptions = createFindOptions({ skip: 20 })
    const { injector, onFindOptionsChange } = await renderBooleanFilter(findOptions)
    await usingAsync(injector, async () => {
      const trueButton = document.querySelector(
        'shade-segmented-control button[data-value="true"]',
      ) as HTMLButtonElement
      trueButton?.click()
      await flushUpdates()

      expect(onFindOptionsChange).toHaveBeenCalledWith(expect.objectContaining({ skip: 0 }))
    })
  })
})
