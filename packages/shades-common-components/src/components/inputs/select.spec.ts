import { describe, expect, it } from 'vitest'
import type { SelectOption, SelectProps, SelectState } from './select.js'

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

  describe('SelectState', () => {
    it('Should have all required state fields', () => {
      const state: SelectState = {
        value: 'test',
        isOpen: false,
        highlightedIndex: -1,
      }
      expect(state.value).toBe('test')
      expect(state.isOpen).toBe(false)
      expect(state.highlightedIndex).toBe(-1)
    })
  })

  describe('SelectProps', () => {
    it('Should accept minimal props', () => {
      const props: SelectProps = {
        options: [{ value: 'a', label: 'Alpha' }],
      }
      expect(props.options).toHaveLength(1)
    })

    it('Should accept full props', () => {
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
        onValueChange: () => {},
        getValidationResult: () => ({ isValid: true }),
        getHelperText: () => 'Pick one',
      }
      expect(props.options).toHaveLength(2)
      expect(props.value).toBe('a')
      expect(props.variant).toBe('outlined')
      expect(props.required).toBe(true)
    })
  })
})
