import { describe, expect, it, beforeEach, afterEach } from 'vitest'
import { setCssVariable, getCssVariable, cssVariableTheme } from './css-variable-theme.js'

describe('css-variable-theme', () => {
  describe('cssVariableTheme', () => {
    it('should have a name property', () => {
      expect(cssVariableTheme.name).toBe('css-variable-theme')
    })

    it('should have text properties with CSS variable references', () => {
      expect(cssVariableTheme.text.primary).toBe('var(--shades-theme-text-primary)')
      expect(cssVariableTheme.text.secondary).toBe('var(--shades-theme-text-secondary)')
      expect(cssVariableTheme.text.disabled).toBe('var(--shades-theme-text-disabled)')
    })

    it('should have background properties with CSS variable references', () => {
      expect(cssVariableTheme.background.default).toBe('var(--shades-theme-background-default)')
      expect(cssVariableTheme.background.paper).toBe('var(--shades-theme-background-paper)')
    })

    it('should have palette with color variants', () => {
      expect(cssVariableTheme.palette.primary.main).toBe('var(--shades-theme-palette-primary-main)')
      expect(cssVariableTheme.palette.error.main).toBe('var(--shades-theme-palette-error-main)')
    })
  })

  describe('setCssVariable', () => {
    let testElement: HTMLElement

    beforeEach(() => {
      testElement = document.createElement('div')
      document.body.appendChild(testElement)
    })

    afterEach(() => {
      testElement.remove()
    })

    it('should set CSS variable on element', () => {
      setCssVariable('--test-color', 'red', testElement)
      expect(testElement.style.getPropertyValue('--test-color')).toBe('red')
    })

    it('should handle var() wrapper in key name', () => {
      setCssVariable('var(--test-padding)', '10px', testElement)
      expect(testElement.style.getPropertyValue('--test-padding')).toBe('10px')
    })

    it('should set multiple CSS variables on same element', () => {
      setCssVariable('--color-a', 'blue', testElement)
      setCssVariable('--color-b', 'green', testElement)
      expect(testElement.style.getPropertyValue('--color-a')).toBe('blue')
      expect(testElement.style.getPropertyValue('--color-b')).toBe('green')
    })

    it('should override existing CSS variable', () => {
      setCssVariable('--test-value', 'first', testElement)
      setCssVariable('--test-value', 'second', testElement)
      expect(testElement.style.getPropertyValue('--test-value')).toBe('second')
    })
  })

  describe('getCssVariable', () => {
    let testElement: HTMLElement

    beforeEach(() => {
      testElement = document.createElement('div')
      document.body.appendChild(testElement)
    })

    afterEach(() => {
      testElement.remove()
    })

    it('should get CSS variable from element', () => {
      testElement.style.setProperty('--test-color', 'red')
      const result = getCssVariable('--test-color', testElement)
      expect(result).toBe('red')
    })

    it('should handle var() wrapper in key name', () => {
      testElement.style.setProperty('--test-padding', '20px')
      const result = getCssVariable('var(--test-padding)', testElement)
      expect(result).toBe('20px')
    })

    it('should return empty string for non-existent variable', () => {
      const result = getCssVariable('--non-existent', testElement)
      expect(result).toBe('')
    })
  })
})
