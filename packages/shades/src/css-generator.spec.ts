import { describe, expect, it } from 'vitest'
import { camelToKebab, generateCSS, generateCSSRule, isSelectorKey, propertiesToCSSString } from './css-generator.js'
import type { CSSProperties } from './models/css-object.js'

describe('css-generator', () => {
  describe('camelToKebab', () => {
    it('should convert camelCase to kebab-case', () => {
      expect(camelToKebab('backgroundColor')).toBe('background-color')
      expect(camelToKebab('fontSize')).toBe('font-size')
      expect(camelToKebab('borderTopLeftRadius')).toBe('border-top-left-radius')
    })

    it('should handle single word properties', () => {
      expect(camelToKebab('color')).toBe('color')
      expect(camelToKebab('margin')).toBe('margin')
    })

    it('should handle empty string', () => {
      expect(camelToKebab('')).toBe('')
    })
  })

  describe('isSelectorKey', () => {
    it('should return true for selector keys starting with &', () => {
      expect(isSelectorKey('&:hover')).toBe(true)
      expect(isSelectorKey('&:active')).toBe(true)
      expect(isSelectorKey('& .className')).toBe(true)
      expect(isSelectorKey('& > div')).toBe(true)
    })

    it('should return false for regular CSS property keys', () => {
      expect(isSelectorKey('color')).toBe(false)
      expect(isSelectorKey('backgroundColor')).toBe(false)
      expect(isSelectorKey('fontSize')).toBe(false)
    })
  })

  describe('propertiesToCSSString', () => {
    it('should convert CSS properties object to CSS string', () => {
      const result = propertiesToCSSString({
        color: 'red',
        backgroundColor: 'blue',
      })
      expect(result).toBe('color: red; background-color: blue')
    })

    it('should skip undefined and null values', () => {
      const result = propertiesToCSSString({
        color: 'red',
        backgroundColor: undefined,
      })
      expect(result).toBe('color: red')
    })

    it('should skip empty string values', () => {
      const result = propertiesToCSSString({
        color: 'red',
        backgroundColor: '',
      })
      expect(result).toBe('color: red')
    })

    it('should return empty string for empty object', () => {
      const result = propertiesToCSSString({})
      expect(result).toBe('')
    })

    it('should ignore selector keys', () => {
      // Type assertion needed to test mixed object with selectors
      const mixedObject = {
        color: 'red',
        '&:hover': { color: 'blue' },
      }
      const result = propertiesToCSSString(mixedObject as unknown as CSSProperties)
      expect(result).toBe('color: red')
    })

    it('should filter out non-string values', () => {
      // Type assertion to test edge case with non-string values
      const mixedObject = {
        color: 'red',
        opacity: 0.5, // number - should be filtered
        display: 'flex',
        hidden: true, // boolean - should be filtered
      }
      const result = propertiesToCSSString(mixedObject as unknown as CSSProperties)
      expect(result).toBe('color: red; display: flex')
    })
  })

  describe('generateCSSRule', () => {
    it('should generate a complete CSS rule', () => {
      const result = generateCSSRule('my-component', {
        color: 'red',
        padding: '10px',
      })
      expect(result).toBe('my-component { color: red; padding: 10px; }')
    })

    it('should return empty string for empty properties', () => {
      const result = generateCSSRule('my-component', {})
      expect(result).toBe('')
    })
  })

  describe('generateCSS', () => {
    it('should generate CSS for base properties only', () => {
      const result = generateCSS('my-component', {
        color: 'red',
        padding: '10px',
      })
      expect(result).toBe('my-component { color: red; padding: 10px; }')
    })

    it('should generate CSS with pseudo-selectors', () => {
      const result = generateCSS('my-component', {
        color: 'red',
        '&:hover': { color: 'blue' },
      })
      expect(result).toContain('my-component { color: red; }')
      expect(result).toContain('my-component:hover { color: blue; }')
    })

    it('should generate CSS with nested class selectors', () => {
      const result = generateCSS('my-component', {
        padding: '10px',
        '& .inner': { fontWeight: 'bold' },
      })
      expect(result).toContain('my-component { padding: 10px; }')
      expect(result).toContain('my-component .inner { font-weight: bold; }')
    })

    it('should generate CSS with child selectors', () => {
      const result = generateCSS('my-component', {
        display: 'flex',
        '& > div': { margin: '5px' },
      })
      expect(result).toContain('my-component { display: flex; }')
      expect(result).toContain('my-component > div { margin: 5px; }')
    })

    it('should handle multiple pseudo-selectors', () => {
      const result = generateCSS('my-button', {
        backgroundColor: 'blue',
        '&:hover': { backgroundColor: 'darkblue' },
        '&:active': { backgroundColor: 'navy' },
        '&:disabled': { opacity: '0.5' },
      })
      expect(result).toContain('my-button { background-color: blue; }')
      expect(result).toContain('my-button:hover { background-color: darkblue; }')
      expect(result).toContain('my-button:active { background-color: navy; }')
      expect(result).toContain('my-button:disabled { opacity: 0.5; }')
    })

    it('should handle empty css object', () => {
      const result = generateCSS('my-component', {})
      expect(result).toBe('')
    })

    it('should handle css object with only selectors', () => {
      const result = generateCSS('my-component', {
        '&:hover': { color: 'blue' },
      })
      expect(result).toBe('my-component:hover { color: blue; }')
    })

    it('should skip selector keys with non-object values', () => {
      // Type assertion to test edge case with invalid selector values
      const cssObject = {
        color: 'red',
        '&:hover': 'invalid', // string instead of object - should be skipped
        '&:active': null, // null - should be skipped
        '&:focus': { backgroundColor: 'blue' }, // valid - should be included
      }
      const result = generateCSS('my-component', cssObject as unknown as Parameters<typeof generateCSS>[1])
      expect(result).toContain('my-component { color: red; }')
      expect(result).toContain('my-component:focus { background-color: blue; }')
      expect(result).not.toContain('invalid')
      expect(result).not.toContain(':hover')
      expect(result).not.toContain(':active')
    })
  })
})
