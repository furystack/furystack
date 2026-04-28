import { createInjector } from '@furystack/inject'
import { createComponent, flushUpdates, initializeShadeRoot } from '@furystack/shades'
import { usingAsync } from '@furystack/utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { FilterableFindOptions } from '../data-grid.js'
import { EnumFilter } from './enum-filter.js'

const enumValues = [
  { label: 'Admin', value: 'admin' },
  { label: 'User', value: 'user' },
  { label: 'Guest', value: 'guest' },
]

describe('EnumFilter', () => {
  beforeEach(() => {
    document.body.innerHTML = '<div id="root"></div>'
  })

  afterEach(() => {
    document.body.innerHTML = ''
  })

  const createFindOptions = (options: Partial<FilterableFindOptions> = {}): FilterableFindOptions => {
    return options
  }

  const renderEnumFilter = async (
    findOptions: FilterableFindOptions,
    field = 'role',
    values = enumValues,
    onClose = vi.fn(),
    onFindOptionsChange = vi.fn(),
  ) => {
    const injector = createInjector()
    const rootElement = document.getElementById('root')!
    initializeShadeRoot({
      injector,
      rootElement,
      jsxElement: (
        <EnumFilter
          field={field}
          values={values}
          findOptions={findOptions}
          onFindOptionsChange={onFindOptionsChange}
          onClose={onClose}
        />
      ),
    })
    await flushUpdates()
    return { injector, onClose, onFindOptionsChange }
  }

  it('should render mode control and checkboxes for each value', async () => {
    const findOptions = createFindOptions()
    await usingAsync((await renderEnumFilter(findOptions)).injector, async () => {
      const control = document.querySelector('shade-segmented-control')
      expect(control).not.toBeNull()

      const checkboxes = document.querySelectorAll('shade-checkbox')
      expect(checkboxes.length).toBe(3)
    })
  })

  it('should apply $in filter when values are selected and Apply is clicked', async () => {
    const findOptions = createFindOptions()
    const { injector, onClose, onFindOptionsChange } = await renderEnumFilter(findOptions)
    await usingAsync(injector, async () => {
      const checkboxes = document.querySelectorAll('shade-checkbox input[type="checkbox"]')
      const adminCheckbox = checkboxes[0] as HTMLInputElement
      adminCheckbox.checked = true
      adminCheckbox.dispatchEvent(new Event('change', { bubbles: true }))

      const applyButton = Array.from(document.querySelectorAll('button')).find((b) => b.textContent?.trim() === 'Apply')
      applyButton?.click()
      await flushUpdates()

      expect(onFindOptionsChange).toHaveBeenCalledWith(
        expect.objectContaining({ filter: { role: { $in: ['admin'] } } }),
      )
      expect(onClose).toHaveBeenCalled()
    })
  })

  it('should apply $nin filter when exclude mode is selected', async () => {
    const findOptions = createFindOptions()
    const { injector, onClose, onFindOptionsChange } = await renderEnumFilter(findOptions)
    await usingAsync(injector, async () => {
      const excludeButton = document.querySelector(
        'shade-segmented-control button[data-value="exclude"]',
      ) as HTMLButtonElement
      excludeButton?.click()
      await flushUpdates()

      const checkboxes = document.querySelectorAll('shade-checkbox input[type="checkbox"]')
      const guestCheckbox = checkboxes[2] as HTMLInputElement
      guestCheckbox.checked = true
      guestCheckbox.dispatchEvent(new Event('change', { bubbles: true }))

      const applyButton = Array.from(document.querySelectorAll('button')).find((b) => b.textContent?.trim() === 'Apply')
      applyButton?.click()
      await flushUpdates()

      expect(onFindOptionsChange).toHaveBeenCalledWith(
        expect.objectContaining({ filter: { role: { $nin: ['guest'] } } }),
      )
      expect(onClose).toHaveBeenCalled()
    })
  })

  it('should remove filter when no values are selected', async () => {
    const findOptions = createFindOptions({ filter: { role: { $in: ['admin'] } } })
    const { injector, onClose, onFindOptionsChange } = await renderEnumFilter(findOptions)
    await usingAsync(injector, async () => {
      const checkboxes = document.querySelectorAll('shade-checkbox input[type="checkbox"]')
      const adminCheckbox = checkboxes[0] as HTMLInputElement
      adminCheckbox.checked = false
      adminCheckbox.dispatchEvent(new Event('change', { bubbles: true }))

      const applyButton = Array.from(document.querySelectorAll('button')).find((b) => b.textContent?.trim() === 'Apply')
      applyButton?.click()
      await flushUpdates()

      const updatedOptions = onFindOptionsChange.mock.lastCall?.[0] as FilterableFindOptions
      expect(updatedOptions.filter?.role).toBeUndefined()
      expect(onClose).toHaveBeenCalled()
    })
  })

  it('should clear filter when Clear button is clicked', async () => {
    const findOptions = createFindOptions({ filter: { role: { $in: ['admin', 'user'] } } })
    const { injector, onClose, onFindOptionsChange } = await renderEnumFilter(findOptions)
    await usingAsync(injector, async () => {
      const clearButton = Array.from(document.querySelectorAll('button')).find((b) => b.textContent?.trim() === 'Clear')
      clearButton?.click()
      await flushUpdates()

      const updatedOptions = onFindOptionsChange.mock.lastCall?.[0] as FilterableFindOptions
      expect(updatedOptions.filter?.role).toBeUndefined()
      expect(onClose).toHaveBeenCalled()
    })
  })

  it('should preserve filters on other fields', async () => {
    const findOptions = createFindOptions({ filter: { role: { $in: ['admin'] }, name: { $regex: 'keep' } } })
    const { injector, onFindOptionsChange } = await renderEnumFilter(findOptions)
    await usingAsync(injector, async () => {
      const clearButton = Array.from(document.querySelectorAll('button')).find((b) => b.textContent?.trim() === 'Clear')
      clearButton?.click()
      await flushUpdates()

      const updatedOptions = onFindOptionsChange.mock.lastCall?.[0] as FilterableFindOptions
      expect(updatedOptions.filter?.role).toBeUndefined()
      expect(updatedOptions.filter?.name).toEqual({ $regex: 'keep' })
    })
  })

  it('should reset skip to 0 when applying filter', async () => {
    const findOptions = createFindOptions({ skip: 20 })
    const { injector, onFindOptionsChange } = await renderEnumFilter(findOptions)
    await usingAsync(injector, async () => {
      const checkboxes = document.querySelectorAll('shade-checkbox input[type="checkbox"]')
      const checkbox = checkboxes[0] as HTMLInputElement
      checkbox.checked = true
      checkbox.dispatchEvent(new Event('change', { bubbles: true }))

      const applyButton = Array.from(document.querySelectorAll('button')).find((b) => b.textContent?.trim() === 'Apply')
      applyButton?.click()
      await flushUpdates()

      expect(onFindOptionsChange).toHaveBeenCalledWith(expect.objectContaining({ skip: 0 }))
    })
  })

  it('should pre-check existing $in filter values', async () => {
    const findOptions = createFindOptions({ filter: { role: { $in: ['admin', 'guest'] } } })
    await usingAsync((await renderEnumFilter(findOptions)).injector, async () => {
      const checkboxes = document.querySelectorAll('shade-checkbox input[type="checkbox"]')
      expect((checkboxes[0] as HTMLInputElement).checked).toBe(true)
      expect((checkboxes[1] as HTMLInputElement).checked).toBe(false)
      expect((checkboxes[2] as HTMLInputElement).checked).toBe(true)
    })
  })
})
