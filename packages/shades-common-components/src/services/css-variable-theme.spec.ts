import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { cssVariableTheme, getCssVariable, setCssVariable, useThemeCssVariables } from './css-variable-theme.js'

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

  describe('useThemeCssVariables', () => {
    let root: HTMLElement

    beforeEach(() => {
      root = document.documentElement
    })

    afterEach(() => {
      root.style.cssText = ''
    })

    it('should set text color CSS variables from theme', () => {
      useThemeCssVariables({
        text: {
          primary: '#ffffff',
          secondary: '#cccccc',
        },
      })

      expect(root.style.getPropertyValue('--shades-theme-text-primary')).toBe('#ffffff')
      expect(root.style.getPropertyValue('--shades-theme-text-secondary')).toBe('#cccccc')
    })

    it('should set background CSS variables from theme', () => {
      useThemeCssVariables({
        background: {
          default: '#000000',
          paper: '#111111',
        },
      })

      expect(root.style.getPropertyValue('--shades-theme-background-default')).toBe('#000000')
      expect(root.style.getPropertyValue('--shades-theme-background-paper')).toBe('#111111')
    })

    it('should set button CSS variables from theme', () => {
      useThemeCssVariables({
        button: {
          active: '#ff0000',
          hover: '#00ff00',
        },
      })

      expect(root.style.getPropertyValue('--shades-theme-button-active')).toBe('#ff0000')
      expect(root.style.getPropertyValue('--shades-theme-button-hover')).toBe('#00ff00')
    })

    it('should set deeply nested palette CSS variables from theme', () => {
      useThemeCssVariables({
        palette: {
          primary: {
            main: '#1976d2',
            light: '#42a5f5',
            dark: '#1565c0',
          },
          error: {
            main: '#d32f2f',
          },
        },
      })

      expect(root.style.getPropertyValue('--shades-theme-palette-primary-main')).toBe('#1976d2')
      expect(root.style.getPropertyValue('--shades-theme-palette-primary-light')).toBe('#42a5f5')
      expect(root.style.getPropertyValue('--shades-theme-palette-primary-dark')).toBe('#1565c0')
      expect(root.style.getPropertyValue('--shades-theme-palette-error-main')).toBe('#d32f2f')
    })

    it('should set divider CSS variable from theme', () => {
      useThemeCssVariables({
        divider: 'rgba(255, 255, 255, 0.12)',
      })

      expect(root.style.getPropertyValue('--shades-theme-divider')).toBe('rgba(255, 255, 255, 0.12)')
    })

    it('should handle partial theme with mixed nesting levels', () => {
      useThemeCssVariables({
        text: {
          primary: '#fff',
        },
        divider: '#333',
        palette: {
          success: {
            main: '#2e7d32',
          },
        },
      })

      expect(root.style.getPropertyValue('--shades-theme-text-primary')).toBe('#fff')
      expect(root.style.getPropertyValue('--shades-theme-divider')).toBe('#333')
      expect(root.style.getPropertyValue('--shades-theme-palette-success-main')).toBe('#2e7d32')
    })

    it('should allow overriding previously set CSS variables', () => {
      useThemeCssVariables({
        text: {
          primary: '#aaa',
        },
      })

      expect(root.style.getPropertyValue('--shades-theme-text-primary')).toBe('#aaa')

      useThemeCssVariables({
        text: {
          primary: '#bbb',
        },
      })

      expect(root.style.getPropertyValue('--shades-theme-text-primary')).toBe('#bbb')
    })
  })
})
