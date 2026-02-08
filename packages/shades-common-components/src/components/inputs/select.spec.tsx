import { Injector } from '@furystack/inject'
import { createComponent, initializeShadeRoot } from '@furystack/shades'
import { sleepAsync, usingAsync } from '@furystack/utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { SelectOption, SelectOptionGroup, SelectProps, SelectState } from './select.js'
import { Select } from './select.js'

describe('Select', () => {
  beforeEach(() => {
    document.body.innerHTML = '<div id="root"></div>'
  })

  afterEach(() => {
    document.body.innerHTML = ''
    vi.restoreAllMocks()
  })

  const defaultOptions: SelectOption[] = [
    { value: 'a', label: 'Alpha' },
    { value: 'b', label: 'Beta' },
    { value: 'c', label: 'Gamma' },
  ]

  const renderSelect = async (props: SelectProps = { options: defaultOptions }) => {
    const injector = new Injector()
    const root = document.getElementById('root')!
    initializeShadeRoot({
      injector,
      rootElement: root,
      jsxElement: <Select {...props} />,
    })
    await sleepAsync(100)
    return {
      injector,
      select: document.querySelector('shade-select') as HTMLElement,
      [Symbol.asyncDispose]: () => injector[Symbol.asyncDispose](),
    }
  }

  describe('types', () => {
    describe('SelectOption', () => {
      it('Should accept a basic option', () => {
        const option: SelectOption = { value: 'a', label: 'Alpha' }
        expect(option.value).toBe('a')
        expect(option.label).toBe('Alpha')
        expect(option.disabled).toBeUndefined()
      })

      it('Should accept a disabled option', () => {
        const option: SelectOption = { value: 'a', label: 'Alpha', disabled: true }
        expect(option.disabled).toBe(true)
      })
    })

    describe('SelectOptionGroup', () => {
      it('Should accept a group with label and options', () => {
        const group: SelectOptionGroup = {
          label: 'Fruits',
          options: [
            { value: 'apple', label: 'Apple' },
            { value: 'banana', label: 'Banana' },
          ],
        }
        expect(group.label).toBe('Fruits')
        expect(group.options).toHaveLength(2)
      })

      it('Should accept an empty group', () => {
        const group: SelectOptionGroup = {
          label: 'Empty',
          options: [],
        }
        expect(group.options).toHaveLength(0)
      })
    })

    describe('SelectState', () => {
      it('Should have all required state fields for single mode', () => {
        const state: SelectState = {
          value: 'test',
          isOpen: false,
          highlightedIndex: -1,
          searchText: '',
        }
        expect(state.value).toBe('test')
        expect(state.isOpen).toBe(false)
        expect(state.highlightedIndex).toBe(-1)
        expect(state.searchText).toBe('')
      })

      it('Should accept string[] value for multiple mode', () => {
        const state: SelectState = {
          value: ['a', 'b', 'c'],
          isOpen: true,
          highlightedIndex: 0,
          searchText: 'search',
        }
        expect(state.value).toEqual(['a', 'b', 'c'])
        expect(state.searchText).toBe('search')
      })
    })

    describe('SelectProps', () => {
      it('Should accept minimal props', () => {
        const props: SelectProps = {
          options: [{ value: 'a', label: 'Alpha' }],
        }
        expect(props.options).toHaveLength(1)
      })

      it('Should accept full single-select props', () => {
        const props: SelectProps = {
          options: [
            { value: 'a', label: 'Alpha' },
            { value: 'b', label: 'Beta', disabled: true },
          ],
          value: 'a',
          placeholder: 'Choose...',
          disabled: false,
          required: true,
          labelTitle: 'My Select',
          variant: 'outlined',
          defaultColor: 'primary',
          name: 'mySelect',
          showSearch: false,
          onValueChange: () => {},
          getValidationResult: () => ({ isValid: true }),
          getHelperText: () => 'Pick one',
        }
        expect(props.options).toHaveLength(2)
        expect(props.value).toBe('a')
        expect(props.variant).toBe('outlined')
        expect(props.required).toBe(true)
      })

      it('Should accept multiple mode props', () => {
        const onMultiValueChange = vi.fn()
        const props: SelectProps = {
          options: [
            { value: 'a', label: 'Alpha' },
            { value: 'b', label: 'Beta' },
            { value: 'c', label: 'Gamma' },
          ],
          mode: 'multiple',
          value: ['a', 'c'],
          placeholder: 'Select multiple...',
          onMultiValueChange,
        }
        expect(props.mode).toBe('multiple')
        expect(props.value).toEqual(['a', 'c'])
      })

      it('Should accept searchable props', () => {
        const filterOption = vi.fn().mockReturnValue(true)
        const props: SelectProps = {
          options: [{ value: 'a', label: 'Alpha' }],
          showSearch: true,
          filterOption,
        }
        expect(props.showSearch).toBe(true)

        const result = props.filterOption!('test', { value: 'a', label: 'Alpha' })
        expect(result).toBe(true)
        expect(filterOption).toHaveBeenCalledWith('test', { value: 'a', label: 'Alpha' })
      })

      it('Should accept optionGroups', () => {
        const props: SelectProps = {
          optionGroups: [
            {
              label: 'Fruits',
              options: [
                { value: 'apple', label: 'Apple' },
                { value: 'banana', label: 'Banana' },
              ],
            },
            {
              label: 'Vegetables',
              options: [
                { value: 'carrot', label: 'Carrot' },
                { value: 'potato', label: 'Potato' },
              ],
            },
          ],
        }
        expect(props.optionGroups).toHaveLength(2)
        expect(props.optionGroups![0].label).toBe('Fruits')
        expect(props.optionGroups![0].options).toHaveLength(2)
      })

      it('Should accept combined options and optionGroups', () => {
        const props: SelectProps = {
          options: [{ value: 'none', label: 'None' }],
          optionGroups: [
            {
              label: 'Group A',
              options: [{ value: 'a1', label: 'A1' }],
            },
          ],
        }
        expect(props.options).toHaveLength(1)
        expect(props.optionGroups).toHaveLength(1)
      })

      it('Should accept all enhancements together', () => {
        const props: SelectProps = {
          optionGroups: [
            {
              label: 'Group 1',
              options: [{ value: 'g1a', label: 'G1-A' }],
            },
          ],
          mode: 'multiple',
          showSearch: true,
          value: ['g1a'],
          filterOption: (text, opt) => opt.label.startsWith(text),
          onMultiValueChange: () => {},
          onValueChange: () => {},
        }
        expect(props.mode).toBe('multiple')
        expect(props.showSearch).toBe(true)
        expect(props.optionGroups).toHaveLength(1)
      })
    })
  })

  describe('rendering', () => {
    it('should render the select element', async () => {
      await usingAsync(await renderSelect(), async ({ select }) => {
        expect(select).not.toBeNull()
        expect(select.tagName.toLowerCase()).toBe('shade-select')
      })
    })

    it('should render a hidden input for form integration', async () => {
      await usingAsync(await renderSelect({ options: defaultOptions, name: 'myField' }), async ({ select }) => {
        const input = select.querySelector('input[type="hidden"]') as HTMLInputElement
        expect(input).not.toBeNull()
        expect(input.name).toBe('myField')
      })
    })

    it('should render a label title', async () => {
      await usingAsync(
        await renderSelect({ options: defaultOptions, labelTitle: 'Choose one' }),
        async ({ select }) => {
          expect(select.textContent).toContain('Choose one')
        },
      )
    })

    it('should show placeholder when no value is selected', async () => {
      await usingAsync(
        await renderSelect({ options: defaultOptions, placeholder: 'Pick something' }),
        async ({ select }) => {
          const valueEl = select.querySelector('.select-value')
          expect(valueEl?.textContent).toContain('Pick something')
          expect(valueEl?.hasAttribute('data-placeholder')).toBe(true)
        },
      )
    })

    it('should show the selected value label', async () => {
      await usingAsync(await renderSelect({ options: defaultOptions, value: 'b' }), async ({ select }) => {
        const valueEl = select.querySelector('.select-value')
        expect(valueEl?.textContent).toContain('Beta')
        expect(valueEl?.hasAttribute('data-placeholder')).toBe(false)
      })
    })

    it('should render the arrow indicator', async () => {
      await usingAsync(await renderSelect(), async ({ select }) => {
        const arrow = select.querySelector('.select-arrow')
        expect(arrow).not.toBeNull()
      })
    })
  })

  describe('variant and data attributes', () => {
    it('should set data-variant="outlined" when variant is outlined', async () => {
      await usingAsync(await renderSelect({ options: defaultOptions, variant: 'outlined' }), async ({ select }) => {
        expect(select.getAttribute('data-variant')).toBe('outlined')
      })
    })

    it('should set data-variant="contained" when variant is contained', async () => {
      await usingAsync(await renderSelect({ options: defaultOptions, variant: 'contained' }), async ({ select }) => {
        expect(select.getAttribute('data-variant')).toBe('contained')
      })
    })

    it('should not set data-variant when no variant is provided', async () => {
      await usingAsync(await renderSelect({ options: defaultOptions }), async ({ select }) => {
        expect(select.hasAttribute('data-variant')).toBe(false)
      })
    })
  })

  describe('disabled state', () => {
    it('should set data-disabled when disabled', async () => {
      await usingAsync(await renderSelect({ options: defaultOptions, disabled: true }), async ({ select }) => {
        expect(select.hasAttribute('data-disabled')).toBe(true)
      })
    })

    it('should not set data-disabled when not disabled', async () => {
      await usingAsync(await renderSelect({ options: defaultOptions, disabled: false }), async ({ select }) => {
        expect(select.hasAttribute('data-disabled')).toBe(false)
      })
    })

    it('should not open dropdown when disabled and trigger is clicked', async () => {
      await usingAsync(await renderSelect({ options: defaultOptions, disabled: true }), async ({ select }) => {
        const trigger = select.querySelector('.select-trigger') as HTMLElement
        trigger.click()
        await sleepAsync(50)
        expect(select.hasAttribute('data-open')).toBe(false)
      })
    })
  })

  describe('opening and closing dropdown', () => {
    it('should open dropdown when trigger is clicked', async () => {
      await usingAsync(await renderSelect(), async ({ select }) => {
        const trigger = select.querySelector('.select-trigger') as HTMLElement
        trigger.click()
        await sleepAsync(50)
        expect(select.hasAttribute('data-open')).toBe(true)
        const dropdown = select.querySelector('.dropdown')
        expect(dropdown).not.toBeNull()
      })
    })

    it('should show options when open', async () => {
      await usingAsync(await renderSelect(), async ({ select }) => {
        const trigger = select.querySelector('.select-trigger') as HTMLElement
        trigger.click()
        await sleepAsync(50)
        const items = select.querySelectorAll('.dropdown-item')
        expect(items.length).toBe(3)
      })
    })

    it('should close dropdown when backdrop is clicked', async () => {
      await usingAsync(await renderSelect(), async ({ select }) => {
        const trigger = select.querySelector('.select-trigger') as HTMLElement
        trigger.click()
        await sleepAsync(50)
        expect(select.hasAttribute('data-open')).toBe(true)

        const backdrop = select.querySelector('.dropdown-backdrop') as HTMLElement
        backdrop.click()
        await sleepAsync(50)
        expect(select.hasAttribute('data-open')).toBe(false)
      })
    })

    it('should close on trigger click when open in single mode', async () => {
      await usingAsync(await renderSelect(), async ({ select }) => {
        const trigger = select.querySelector('.select-trigger') as HTMLElement
        trigger.click()
        await sleepAsync(50)
        expect(select.hasAttribute('data-open')).toBe(true)

        // Re-query after re-render
        const trigger2 = select.querySelector('.select-trigger') as HTMLElement
        trigger2.click()
        await sleepAsync(50)
        expect(select.hasAttribute('data-open')).toBe(false)
      })
    })
  })

  describe('single selection', () => {
    it('should call onValueChange when an option is clicked', async () => {
      const onValueChange = vi.fn()
      await usingAsync(await renderSelect({ options: defaultOptions, onValueChange }), async ({ select }) => {
        const trigger = select.querySelector('.select-trigger') as HTMLElement
        trigger.click()
        await sleepAsync(50)

        const items = select.querySelectorAll('.dropdown-item')
        ;(items[1] as HTMLElement).click()
        await sleepAsync(50)

        expect(onValueChange).toHaveBeenCalledWith('b')
      })
    })

    it('should close dropdown after single selection', async () => {
      const onValueChange = vi.fn()
      await usingAsync(await renderSelect({ options: defaultOptions, onValueChange }), async ({ select }) => {
        const trigger = select.querySelector('.select-trigger') as HTMLElement
        trigger.click()
        await sleepAsync(50)

        const items = select.querySelectorAll('.dropdown-item')
        ;(items[0] as HTMLElement).click()
        await sleepAsync(50)

        expect(select.hasAttribute('data-open')).toBe(false)
      })
    })

    it('should not select disabled options', async () => {
      const options: SelectOption[] = [
        { value: 'a', label: 'Alpha' },
        { value: 'b', label: 'Beta', disabled: true },
      ]
      const onValueChange = vi.fn()
      await usingAsync(await renderSelect({ options, onValueChange }), async ({ select }) => {
        const trigger = select.querySelector('.select-trigger') as HTMLElement
        trigger.click()
        await sleepAsync(50)

        const items = select.querySelectorAll('.dropdown-item')
        ;(items[1] as HTMLElement).click()
        await sleepAsync(50)

        expect(onValueChange).not.toHaveBeenCalled()
      })
    })

    it('should mark selected option with data-selected', async () => {
      await usingAsync(await renderSelect({ options: defaultOptions, value: 'b' }), async ({ select }) => {
        const trigger = select.querySelector('.select-trigger') as HTMLElement
        trigger.click()
        await sleepAsync(50)

        const selected = select.querySelector('.dropdown-item[data-selected]')
        expect(selected).not.toBeNull()
        expect(selected?.textContent).toContain('Beta')
      })
    })
  })

  describe('multiple selection', () => {
    it('should render chips for selected values', async () => {
      await usingAsync(
        await renderSelect({ options: defaultOptions, mode: 'multiple', value: ['a', 'c'] }),
        async ({ select }) => {
          const chips = select.querySelectorAll('.select-chip')
          expect(chips.length).toBe(2)
          expect(chips[0].textContent).toContain('Alpha')
          expect(chips[1].textContent).toContain('Gamma')
        },
      )
    })

    it('should show placeholder when no values are selected in multi mode', async () => {
      await usingAsync(
        await renderSelect({ options: defaultOptions, mode: 'multiple', value: [], placeholder: 'Pick many' }),
        async ({ select }) => {
          const valueEl = select.querySelector('.select-value')
          expect(valueEl?.textContent).toContain('Pick many')
        },
      )
    })

    it('should set data-multiple attribute', async () => {
      await usingAsync(await renderSelect({ options: defaultOptions, mode: 'multiple' }), async ({ select }) => {
        expect(select.hasAttribute('data-multiple')).toBe(true)
      })
    })

    it('should toggle selection in multiple mode', async () => {
      const onMultiValueChange = vi.fn()
      await usingAsync(
        await renderSelect({
          options: defaultOptions,
          mode: 'multiple',
          value: ['a'],
          onMultiValueChange,
        }),
        async ({ select }) => {
          const trigger = select.querySelector('.select-trigger') as HTMLElement
          trigger.click()
          await sleepAsync(50)

          const items = select.querySelectorAll('.dropdown-item')
          ;(items[1] as HTMLElement).click()
          await sleepAsync(50)

          expect(onMultiValueChange).toHaveBeenCalledWith(['a', 'b'])
        },
      )
    })

    it('should deselect an already selected value in multiple mode', async () => {
      const onMultiValueChange = vi.fn()
      await usingAsync(
        await renderSelect({
          options: defaultOptions,
          mode: 'multiple',
          value: ['a', 'b'],
          onMultiValueChange,
        }),
        async ({ select }) => {
          const trigger = select.querySelector('.select-trigger') as HTMLElement
          trigger.click()
          await sleepAsync(50)

          const items = select.querySelectorAll('.dropdown-item')
          ;(items[0] as HTMLElement).click()
          await sleepAsync(50)

          expect(onMultiValueChange).toHaveBeenCalledWith(['b'])
        },
      )
    })

    it('should remove chip when remove button is clicked', async () => {
      const onMultiValueChange = vi.fn()
      await usingAsync(
        await renderSelect({
          options: defaultOptions,
          mode: 'multiple',
          value: ['a', 'b'],
          onMultiValueChange,
        }),
        async ({ select }) => {
          const chipRemoves = select.querySelectorAll('.select-chip-remove')
          expect(chipRemoves.length).toBe(2)
          ;(chipRemoves[0] as HTMLElement).click()
          await sleepAsync(50)

          expect(onMultiValueChange).toHaveBeenCalledWith(['b'])
        },
      )
    })

    it('should not show chip remove buttons when disabled', async () => {
      await usingAsync(
        await renderSelect({ options: defaultOptions, mode: 'multiple', value: ['a'], disabled: true }),
        async ({ select }) => {
          const chipRemoves = select.querySelectorAll('.select-chip-remove')
          expect(chipRemoves.length).toBe(0)
        },
      )
    })
  })

  describe('keyboard navigation', () => {
    it('should open dropdown on Enter key', async () => {
      await usingAsync(await renderSelect(), async ({ select }) => {
        const trigger = select.querySelector('.select-trigger') as HTMLElement
        trigger.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }))
        await sleepAsync(50)

        expect(select.hasAttribute('data-open')).toBe(true)
      })
    })

    it('should open dropdown on Space key', async () => {
      await usingAsync(await renderSelect(), async ({ select }) => {
        const trigger = select.querySelector('.select-trigger') as HTMLElement
        trigger.dispatchEvent(new KeyboardEvent('keydown', { key: ' ', bubbles: true }))
        await sleepAsync(50)

        expect(select.hasAttribute('data-open')).toBe(true)
      })
    })

    it('should open dropdown on ArrowDown key', async () => {
      await usingAsync(await renderSelect(), async ({ select }) => {
        const trigger = select.querySelector('.select-trigger') as HTMLElement
        trigger.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }))
        await sleepAsync(50)

        expect(select.hasAttribute('data-open')).toBe(true)
      })
    })

    it('should open dropdown on ArrowUp key', async () => {
      await usingAsync(await renderSelect(), async ({ select }) => {
        const trigger = select.querySelector('.select-trigger') as HTMLElement
        trigger.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp', bubbles: true }))
        await sleepAsync(50)

        expect(select.hasAttribute('data-open')).toBe(true)
      })
    })

    it('should close dropdown on Escape key', async () => {
      await usingAsync(await renderSelect(), async ({ select }) => {
        const trigger = select.querySelector('.select-trigger') as HTMLElement
        trigger.click()
        await sleepAsync(50)
        expect(select.hasAttribute('data-open')).toBe(true)

        trigger.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))
        await sleepAsync(50)

        expect(select.hasAttribute('data-open')).toBe(false)
      })
    })

    it('should select highlighted option on Enter when open', async () => {
      const onValueChange = vi.fn()
      await usingAsync(await renderSelect({ options: defaultOptions, onValueChange }), async ({ select }) => {
        const trigger = select.querySelector('.select-trigger') as HTMLElement
        trigger.click()
        await sleepAsync(50)

        // Re-query trigger after re-render, then navigate and select
        const trigger2 = select.querySelector('.select-trigger') as HTMLElement
        trigger2.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }))
        await sleepAsync(50)
        const trigger3 = select.querySelector('.select-trigger') as HTMLElement
        trigger3.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }))
        await sleepAsync(50)

        expect(onValueChange).toHaveBeenCalled()
      })
    })

    it('should navigate to Home and End', async () => {
      const onValueChange = vi.fn()
      await usingAsync(await renderSelect({ options: defaultOptions, onValueChange }), async ({ select }) => {
        const trigger = select.querySelector('.select-trigger') as HTMLElement
        trigger.click()
        await sleepAsync(50)

        // Re-query trigger after re-render
        const trigger2 = select.querySelector('.select-trigger') as HTMLElement
        trigger2.dispatchEvent(new KeyboardEvent('keydown', { key: 'End', bubbles: true }))
        await sleepAsync(50)
        const trigger3 = select.querySelector('.select-trigger') as HTMLElement
        trigger3.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }))
        await sleepAsync(50)

        expect(onValueChange).toHaveBeenCalledWith('c')
      })
    })

    it('should not respond to keyboard when disabled', async () => {
      await usingAsync(await renderSelect({ options: defaultOptions, disabled: true }), async ({ select }) => {
        const trigger = select.querySelector('.select-trigger') as HTMLElement
        trigger.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }))
        await sleepAsync(50)

        expect(select.hasAttribute('data-open')).toBe(false)
      })
    })
  })

  describe('search / filter', () => {
    it('should show search input when showSearch is true', async () => {
      await usingAsync(await renderSelect({ options: defaultOptions, showSearch: true }), async ({ select }) => {
        const trigger = select.querySelector('.select-trigger') as HTMLElement
        trigger.click()
        await sleepAsync(50)

        const searchInput = select.querySelector('.dropdown-search')
        expect(searchInput).not.toBeNull()
      })
    })

    it('should not show search input when showSearch is false', async () => {
      await usingAsync(await renderSelect({ options: defaultOptions, showSearch: false }), async ({ select }) => {
        const trigger = select.querySelector('.select-trigger') as HTMLElement
        trigger.click()
        await sleepAsync(50)

        const searchInput = select.querySelector('.dropdown-search')
        expect(searchInput).toBeNull()
      })
    })

    it('should filter options based on search text', async () => {
      await usingAsync(await renderSelect({ options: defaultOptions, showSearch: true }), async ({ select }) => {
        const trigger = select.querySelector('.select-trigger') as HTMLElement
        trigger.click()
        await sleepAsync(50)

        const searchInput = select.querySelector('.dropdown-search') as HTMLInputElement
        searchInput.value = 'alp'
        searchInput.dispatchEvent(new Event('input', { bubbles: true }))
        await sleepAsync(100)

        const items = select.querySelectorAll('.dropdown-item')
        expect(items.length).toBe(1)
        expect(items[0].textContent).toContain('Alpha')
      })
    })

    it('should show no results when nothing matches', async () => {
      await usingAsync(await renderSelect({ options: defaultOptions, showSearch: true }), async ({ select }) => {
        const trigger = select.querySelector('.select-trigger') as HTMLElement
        trigger.click()
        await sleepAsync(50)

        const searchInput = select.querySelector('.dropdown-search') as HTMLInputElement
        searchInput.value = 'zzz'
        searchInput.dispatchEvent(new Event('input', { bubbles: true }))
        await sleepAsync(100)

        const noResults = select.querySelector('.dropdown-no-results')
        expect(noResults).not.toBeNull()
        expect(noResults?.textContent).toContain('No results found')
      })
    })

    it('should use custom filter function', async () => {
      const filterOption = (_searchText: string, option: SelectOption) => option.value.startsWith('a')
      await usingAsync(
        await renderSelect({ options: defaultOptions, showSearch: true, filterOption }),
        async ({ select }) => {
          const trigger = select.querySelector('.select-trigger') as HTMLElement
          trigger.click()
          await sleepAsync(50)

          const searchInput = select.querySelector('.dropdown-search') as HTMLInputElement
          searchInput.value = 'anything'
          searchInput.dispatchEvent(new Event('input', { bubbles: true }))
          await sleepAsync(100)

          const items = select.querySelectorAll('.dropdown-item')
          expect(items.length).toBe(1)
          expect(items[0].textContent).toContain('Alpha')
        },
      )
    })
  })

  describe('option groups', () => {
    it('should render grouped options with group labels', async () => {
      const optionGroups: SelectOptionGroup[] = [
        {
          label: 'Fruits',
          options: [
            { value: 'apple', label: 'Apple' },
            { value: 'banana', label: 'Banana' },
          ],
        },
        {
          label: 'Vegetables',
          options: [{ value: 'carrot', label: 'Carrot' }],
        },
      ]
      await usingAsync(await renderSelect({ optionGroups }), async ({ select }) => {
        const trigger = select.querySelector('.select-trigger') as HTMLElement
        trigger.click()
        await sleepAsync(50)

        const groupLabels = select.querySelectorAll('.dropdown-group-label')
        expect(groupLabels.length).toBe(2)
        expect(groupLabels[0].textContent).toContain('Fruits')
        expect(groupLabels[1].textContent).toContain('Vegetables')

        const items = select.querySelectorAll('.dropdown-item')
        expect(items.length).toBe(3)
      })
    })

    it('should filter grouped options when searching', async () => {
      const optionGroups: SelectOptionGroup[] = [
        {
          label: 'Fruits',
          options: [
            { value: 'apple', label: 'Apple' },
            { value: 'banana', label: 'Banana' },
          ],
        },
        {
          label: 'Vegetables',
          options: [{ value: 'carrot', label: 'Carrot' }],
        },
      ]
      await usingAsync(await renderSelect({ optionGroups, showSearch: true }), async ({ select }) => {
        const trigger = select.querySelector('.select-trigger') as HTMLElement
        trigger.click()
        await sleepAsync(50)

        const searchInput = select.querySelector('.dropdown-search') as HTMLInputElement
        searchInput.value = 'apple'
        searchInput.dispatchEvent(new Event('input', { bubbles: true }))
        await sleepAsync(100)

        const items = select.querySelectorAll('.dropdown-item')
        expect(items.length).toBe(1)
        expect(items[0].textContent).toContain('Apple')
      })
    })
  })

  describe('validation', () => {
    it('should set data-invalid when getValidationResult returns invalid', async () => {
      await usingAsync(
        await renderSelect({
          options: defaultOptions,
          required: true,
          getValidationResult: () => ({ isValid: false, message: 'Required' }),
        }),
        async ({ select }) => {
          expect(select.hasAttribute('data-invalid')).toBe(true)
        },
      )
    })

    it('should not set data-invalid when validation is valid', async () => {
      await usingAsync(
        await renderSelect({
          options: defaultOptions,
          value: 'a',
          getValidationResult: () => ({ isValid: true }),
        }),
        async ({ select }) => {
          expect(select.hasAttribute('data-invalid')).toBe(false)
        },
      )
    })

    it('should display helper text from getHelperText', async () => {
      await usingAsync(
        await renderSelect({
          options: defaultOptions,
          getHelperText: () => 'Select an option',
        }),
        async ({ select }) => {
          const helperText = select.querySelector('.helperText')
          expect(helperText?.textContent).toContain('Select an option')
        },
      )
    })

    it('should display validation message as helper text when invalid', async () => {
      await usingAsync(
        await renderSelect({
          options: defaultOptions,
          getValidationResult: () => ({ isValid: false, message: 'This field is required' }),
        }),
        async ({ select }) => {
          const helperText = select.querySelector('.helperText')
          expect(helperText?.textContent).toContain('This field is required')
        },
      )
    })
  })

  describe('focus management', () => {
    it('should set data-focused when trigger receives focus', async () => {
      await usingAsync(await renderSelect(), async ({ select }) => {
        const trigger = select.querySelector('.select-trigger') as HTMLElement
        trigger.dispatchEvent(new FocusEvent('focus', { bubbles: true }))
        await sleepAsync(50)

        expect(select.hasAttribute('data-focused')).toBe(true)
      })
    })

    it('should remove data-focused on blur when not open', async () => {
      await usingAsync(await renderSelect(), async ({ select }) => {
        const trigger = select.querySelector('.select-trigger') as HTMLElement
        trigger.dispatchEvent(new FocusEvent('focus', { bubbles: true }))
        await sleepAsync(50)
        expect(select.hasAttribute('data-focused')).toBe(true)

        trigger.dispatchEvent(new FocusEvent('blur', { bubbles: true }))
        await sleepAsync(50)
        expect(select.hasAttribute('data-focused')).toBe(false)
      })
    })
  })

  describe('value normalization', () => {
    it('should normalize string value to array in multiple mode', async () => {
      await usingAsync(
        await renderSelect({ options: defaultOptions, mode: 'multiple', value: 'a' }),
        async ({ select }) => {
          const chips = select.querySelectorAll('.select-chip')
          expect(chips.length).toBe(1)
          expect(chips[0].textContent).toContain('Alpha')
        },
      )
    })

    it('should normalize array value to string in single mode', async () => {
      await usingAsync(
        await renderSelect({ options: defaultOptions, mode: 'single', value: ['a'] as unknown as string }),
        async ({ select }) => {
          const valueEl = select.querySelector('.select-value')
          expect(valueEl?.textContent).toContain('Alpha')
        },
      )
    })

    it('should handle undefined value in single mode', async () => {
      await usingAsync(await renderSelect({ options: defaultOptions }), async ({ select }) => {
        const hidden = select.querySelector('input[type="hidden"]') as HTMLInputElement
        // hidden input should exist even without name, the value should be empty
        expect(select.querySelector('.select-value')).not.toBeNull()
      })
    })
  })

  describe('hidden input value', () => {
    it('should set hidden input value to selected option value in single mode', async () => {
      await usingAsync(
        await renderSelect({ options: defaultOptions, name: 'myField', value: 'b' }),
        async ({ select }) => {
          const input = select.querySelector('input[type="hidden"]') as HTMLInputElement
          expect(input.value).toBe('b')
        },
      )
    })

    it('should set hidden input value to comma-separated values in multiple mode', async () => {
      await usingAsync(
        await renderSelect({ options: defaultOptions, name: 'myField', mode: 'multiple', value: ['a', 'c'] }),
        async ({ select }) => {
          const input = select.querySelector('input[type="hidden"]') as HTMLInputElement
          expect(input.value).toBe('a,c')
        },
      )
    })

    it('should set required attribute on hidden input when required', async () => {
      await usingAsync(
        await renderSelect({ options: defaultOptions, name: 'myField', required: true }),
        async ({ select }) => {
          const input = select.querySelector('input[type="hidden"]') as HTMLInputElement
          expect(input.required).toBe(true)
        },
      )
    })
  })

  describe('ARIA attributes', () => {
    it('should have combobox role on trigger', async () => {
      await usingAsync(await renderSelect(), async ({ select }) => {
        const trigger = select.querySelector('.select-trigger')
        expect(trigger?.getAttribute('role')).toBe('combobox')
      })
    })

    it('should set aria-expanded to false when closed', async () => {
      await usingAsync(await renderSelect(), async ({ select }) => {
        const trigger = select.querySelector('.select-trigger')
        expect(trigger?.getAttribute('aria-expanded')).toBe('false')
      })
    })

    it('should set aria-expanded to true when open', async () => {
      await usingAsync(await renderSelect(), async ({ select }) => {
        const trigger = select.querySelector('.select-trigger') as HTMLElement
        trigger.click()
        await sleepAsync(50)

        // Re-query after re-render
        const trigger2 = select.querySelector('.select-trigger') as HTMLElement
        expect(trigger2.getAttribute('aria-expanded')).toBe('true')
      })
    })

    it('should have listbox role on dropdown', async () => {
      await usingAsync(await renderSelect(), async ({ select }) => {
        const trigger = select.querySelector('.select-trigger') as HTMLElement
        trigger.click()
        await sleepAsync(50)

        const dropdown = select.querySelector('.dropdown')
        expect(dropdown?.getAttribute('role')).toBe('listbox')
      })
    })

    it('should have option role on items', async () => {
      await usingAsync(await renderSelect(), async ({ select }) => {
        const trigger = select.querySelector('.select-trigger') as HTMLElement
        trigger.click()
        await sleepAsync(50)

        const items = select.querySelectorAll('.dropdown-item')
        items.forEach((item) => {
          expect(item.getAttribute('role')).toBe('option')
        })
      })
    })

    it('should set aria-multiselectable on listbox in multiple mode', async () => {
      await usingAsync(await renderSelect({ options: defaultOptions, mode: 'multiple' }), async ({ select }) => {
        const trigger = select.querySelector('.select-trigger') as HTMLElement
        trigger.click()
        await sleepAsync(50)

        const dropdown = select.querySelector('.dropdown')
        expect(dropdown?.getAttribute('aria-multiselectable')).toBe('true')
      })
    })
  })

  describe('Backspace in multi mode with search', () => {
    it('should remove last chip on Backspace when search is empty', async () => {
      const onMultiValueChange = vi.fn()
      await usingAsync(
        await renderSelect({
          options: defaultOptions,
          mode: 'multiple',
          value: ['a', 'b'],
          showSearch: true,
          onMultiValueChange,
        }),
        async ({ select }) => {
          const trigger = select.querySelector('.select-trigger') as HTMLElement
          trigger.click()
          await sleepAsync(50)

          const searchInput = select.querySelector('.dropdown-search') as HTMLInputElement
          searchInput.dispatchEvent(new KeyboardEvent('keydown', { key: 'Backspace', bubbles: true }))
          await sleepAsync(50)

          expect(onMultiValueChange).toHaveBeenCalledWith(['a'])
        },
      )
    })
  })
})
