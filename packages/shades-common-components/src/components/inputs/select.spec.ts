import { describe, expect, it, vi } from 'vitest'
import type { SelectOption, SelectOptionGroup, SelectProps, SelectState } from './select.js'

describe('Select types', () => {
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
