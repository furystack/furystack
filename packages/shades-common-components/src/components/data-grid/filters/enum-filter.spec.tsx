import { Injector } from '@furystack/inject'
import { createComponent, initializeShadeRoot } from '@furystack/shades'
import { ObservableValue, sleepAsync, usingAsync } from '@furystack/utils'
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

  const createFindOptions = (options: Partial<FilterableFindOptions> = {}): ObservableValue<FilterableFindOptions> => {
    return new ObservableValue<FilterableFindOptions>(options)
  }

  const renderEnumFilter = async (
    findOptions: ObservableValue<FilterableFindOptions>,
    field = 'role',
    values = enumValues,
    onClose = vi.fn(),
  ) => {
    const injector = new Injector()
    const rootElement = document.getElementById('root')!
    initializeShadeRoot({
      injector,
      rootElement,
      jsxElement: <EnumFilter field={field} values={values} findOptions={findOptions} onClose={onClose} />,
    })
    await sleepAsync(50)
    return { injector, onClose }
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
    const { injector, onClose } = await renderEnumFilter(findOptions)
    await usingAsync(injector, async () => {
      const checkboxes = document.querySelectorAll('shade-checkbox input[type="checkbox"]')
      const adminCheckbox = checkboxes[0] as HTMLInputElement
      adminCheckbox.checked = true
      adminCheckbox.dispatchEvent(new Event('change', { bubbles: true }))

      const applyButton = Array.from(document.querySelectorAll('button')).find((b) => b.textContent?.trim() === 'Apply')
      applyButton?.click()
      await sleepAsync(50)

      expect(findOptions.getValue().filter).toEqual({ role: { $in: ['admin'] } })
      expect(onClose).toHaveBeenCalled()
    })
  })

  it('should apply $nin filter when exclude mode is selected', async () => {
    const findOptions = createFindOptions()
    const { injector, onClose } = await renderEnumFilter(findOptions)
    await usingAsync(injector, async () => {
      const excludeButton = document.querySelector(
        'shade-segmented-control button[data-value="exclude"]',
      ) as HTMLButtonElement
      excludeButton?.click()
      await sleepAsync(50)

      const checkboxes = document.querySelectorAll('shade-checkbox input[type="checkbox"]')
      const guestCheckbox = checkboxes[2] as HTMLInputElement
      guestCheckbox.checked = true
      guestCheckbox.dispatchEvent(new Event('change', { bubbles: true }))

      const applyButton = Array.from(document.querySelectorAll('button')).find((b) => b.textContent?.trim() === 'Apply')
      applyButton?.click()
      await sleepAsync(50)

      expect(findOptions.getValue().filter).toEqual({ role: { $nin: ['guest'] } })
      expect(onClose).toHaveBeenCalled()
    })
  })

  it('should remove filter when no values are selected', async () => {
    const findOptions = createFindOptions({ filter: { role: { $in: ['admin'] } } })
    const { injector, onClose } = await renderEnumFilter(findOptions)
    await usingAsync(injector, async () => {
      const checkboxes = document.querySelectorAll('shade-checkbox input[type="checkbox"]')
      const adminCheckbox = checkboxes[0] as HTMLInputElement
      adminCheckbox.checked = false
      adminCheckbox.dispatchEvent(new Event('change', { bubbles: true }))

      const applyButton = Array.from(document.querySelectorAll('button')).find((b) => b.textContent?.trim() === 'Apply')
      applyButton?.click()
      await sleepAsync(50)

      expect(findOptions.getValue().filter?.role).toBeUndefined()
      expect(onClose).toHaveBeenCalled()
    })
  })

  it('should clear filter when Clear button is clicked', async () => {
    const findOptions = createFindOptions({ filter: { role: { $in: ['admin', 'user'] } } })
    const { injector, onClose } = await renderEnumFilter(findOptions)
    await usingAsync(injector, async () => {
      const clearButton = Array.from(document.querySelectorAll('button')).find((b) => b.textContent?.trim() === 'Clear')
      clearButton?.click()
      await sleepAsync(50)

      expect(findOptions.getValue().filter?.role).toBeUndefined()
      expect(onClose).toHaveBeenCalled()
    })
  })

  it('should preserve filters on other fields', async () => {
    const findOptions = createFindOptions({ filter: { role: { $in: ['admin'] }, name: { $regex: 'keep' } } })
    const { injector } = await renderEnumFilter(findOptions)
    await usingAsync(injector, async () => {
      const clearButton = Array.from(document.querySelectorAll('button')).find((b) => b.textContent?.trim() === 'Clear')
      clearButton?.click()
      await sleepAsync(50)

      const updatedFilter = findOptions.getValue().filter
      expect(updatedFilter?.role).toBeUndefined()
      expect(updatedFilter?.name).toEqual({ $regex: 'keep' })
    })
  })

  it('should reset skip to 0 when applying filter', async () => {
    const findOptions = createFindOptions({ skip: 20 })
    const { injector } = await renderEnumFilter(findOptions)
    await usingAsync(injector, async () => {
      const checkboxes = document.querySelectorAll('shade-checkbox input[type="checkbox"]')
      const checkbox = checkboxes[0] as HTMLInputElement
      checkbox.checked = true
      checkbox.dispatchEvent(new Event('change', { bubbles: true }))

      const applyButton = Array.from(document.querySelectorAll('button')).find((b) => b.textContent?.trim() === 'Apply')
      applyButton?.click()
      await sleepAsync(50)

      expect(findOptions.getValue().skip).toBe(0)
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
