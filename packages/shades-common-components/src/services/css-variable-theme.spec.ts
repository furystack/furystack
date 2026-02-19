import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import {
  buildTransition,
  cssVariableTheme,
  getCssVariable,
  setCssVariable,
  useThemeCssVariables,
} from './css-variable-theme.js'

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

    it('should have action properties with CSS variable references', () => {
      expect(cssVariableTheme.action.hoverBackground).toBe('var(--shades-theme-action-hover-background)')
      expect(cssVariableTheme.action.selectedBackground).toBe('var(--shades-theme-action-selected-background)')
      expect(cssVariableTheme.action.activeBackground).toBe('var(--shades-theme-action-active-background)')
      expect(cssVariableTheme.action.focusRing).toBe('var(--shades-theme-action-focus-ring)')
      expect(cssVariableTheme.action.disabledOpacity).toBe('var(--shades-theme-action-disabled-opacity)')
      expect(cssVariableTheme.action.backdrop).toBe('var(--shades-theme-action-backdrop)')
      expect(cssVariableTheme.action.subtleBorder).toBe('var(--shades-theme-action-subtle-border)')
    })

    it('should have shape properties with CSS variable references', () => {
      expect(cssVariableTheme.shape.borderRadius.xs).toBe('var(--shades-theme-shape-border-radius-xs)')
      expect(cssVariableTheme.shape.borderRadius.sm).toBe('var(--shades-theme-shape-border-radius-sm)')
      expect(cssVariableTheme.shape.borderRadius.md).toBe('var(--shades-theme-shape-border-radius-md)')
      expect(cssVariableTheme.shape.borderRadius.lg).toBe('var(--shades-theme-shape-border-radius-lg)')
      expect(cssVariableTheme.shape.borderRadius.full).toBe('var(--shades-theme-shape-border-radius-full)')
    })

    it('should have shadow properties with CSS variable references', () => {
      expect(cssVariableTheme.shadows.none).toBe('var(--shades-theme-shadows-none)')
      expect(cssVariableTheme.shadows.sm).toBe('var(--shades-theme-shadows-sm)')
      expect(cssVariableTheme.shadows.md).toBe('var(--shades-theme-shadows-md)')
      expect(cssVariableTheme.shadows.lg).toBe('var(--shades-theme-shadows-lg)')
      expect(cssVariableTheme.shadows.xl).toBe('var(--shades-theme-shadows-xl)')
    })

    it('should have typography properties with CSS variable references', () => {
      expect(cssVariableTheme.typography.fontFamily).toBe('var(--shades-theme-typography-font-family)')
      expect(cssVariableTheme.typography.fontSize.xs).toBe('var(--shades-theme-typography-font-size-xs)')
      expect(cssVariableTheme.typography.fontSize.md).toBe('var(--shades-theme-typography-font-size-md)')
      expect(cssVariableTheme.typography.fontSize.xxl).toBe('var(--shades-theme-typography-font-size-xxl)')
      expect(cssVariableTheme.typography.fontSize.xxxl).toBe('var(--shades-theme-typography-font-size-xxxl)')
      expect(cssVariableTheme.typography.fontSize.xxxxl).toBe('var(--shades-theme-typography-font-size-xxxxl)')
      expect(cssVariableTheme.typography.fontWeight.normal).toBe('var(--shades-theme-typography-font-weight-normal)')
      expect(cssVariableTheme.typography.fontWeight.bold).toBe('var(--shades-theme-typography-font-weight-bold)')
      expect(cssVariableTheme.typography.lineHeight.tight).toBe('var(--shades-theme-typography-line-height-tight)')
      expect(cssVariableTheme.typography.lineHeight.normal).toBe('var(--shades-theme-typography-line-height-normal)')
    })

    it('should have transition properties with CSS variable references', () => {
      expect(cssVariableTheme.transitions.duration.fast).toBe('var(--shades-theme-transitions-duration-fast)')
      expect(cssVariableTheme.transitions.duration.normal).toBe('var(--shades-theme-transitions-duration-normal)')
      expect(cssVariableTheme.transitions.duration.slow).toBe('var(--shades-theme-transitions-duration-slow)')
      expect(cssVariableTheme.transitions.easing.default).toBe('var(--shades-theme-transitions-easing-default)')
      expect(cssVariableTheme.transitions.easing.easeOut).toBe('var(--shades-theme-transitions-easing-ease-out)')
      expect(cssVariableTheme.transitions.easing.easeInOut).toBe('var(--shades-theme-transitions-easing-ease-in-out)')
    })

    it('should have spacing properties with CSS variable references', () => {
      expect(cssVariableTheme.spacing.xs).toBe('var(--shades-theme-spacing-xs)')
      expect(cssVariableTheme.spacing.sm).toBe('var(--shades-theme-spacing-sm)')
      expect(cssVariableTheme.spacing.md).toBe('var(--shades-theme-spacing-md)')
      expect(cssVariableTheme.spacing.lg).toBe('var(--shades-theme-spacing-lg)')
      expect(cssVariableTheme.spacing.xl).toBe('var(--shades-theme-spacing-xl)')
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

    it('should set action CSS variables from theme', () => {
      useThemeCssVariables({
        action: {
          hoverBackground: 'rgba(255, 255, 255, 0.08)',
          focusRing: '0 0 0 3px rgba(255, 255, 255, 0.15)',
        },
      })

      expect(root.style.getPropertyValue('--shades-theme-action-hover-background')).toBe('rgba(255, 255, 255, 0.08)')
      expect(root.style.getPropertyValue('--shades-theme-action-focus-ring')).toBe(
        '0 0 0 3px rgba(255, 255, 255, 0.15)',
      )
    })

    it('should set shape CSS variables from theme', () => {
      useThemeCssVariables({
        shape: {
          borderRadius: {
            md: '8px',
            full: '50%',
          },
        },
      })

      expect(root.style.getPropertyValue('--shades-theme-shape-border-radius-md')).toBe('8px')
      expect(root.style.getPropertyValue('--shades-theme-shape-border-radius-full')).toBe('50%')
    })

    it('should set typography CSS variables from theme', () => {
      useThemeCssVariables({
        typography: {
          fontFamily: 'monospace',
          fontSize: {
            md: '14px',
          },
          fontWeight: {
            bold: '700',
          },
        },
      })

      expect(root.style.getPropertyValue('--shades-theme-typography-font-family')).toBe('monospace')
      expect(root.style.getPropertyValue('--shades-theme-typography-font-size-md')).toBe('14px')
      expect(root.style.getPropertyValue('--shades-theme-typography-font-weight-bold')).toBe('700')
    })

    it('should set transition CSS variables from theme', () => {
      useThemeCssVariables({
        transitions: {
          duration: {
            fast: '0.15s',
          },
          easing: {
            default: 'ease',
          },
        },
      })

      expect(root.style.getPropertyValue('--shades-theme-transitions-duration-fast')).toBe('0.15s')
      expect(root.style.getPropertyValue('--shades-theme-transitions-easing-default')).toBe('ease')
    })

    it('should set spacing CSS variables from theme', () => {
      useThemeCssVariables({
        spacing: {
          xs: '4px',
          md: '16px',
          xl: '32px',
        },
      })

      expect(root.style.getPropertyValue('--shades-theme-spacing-xs')).toBe('4px')
      expect(root.style.getPropertyValue('--shades-theme-spacing-md')).toBe('16px')
      expect(root.style.getPropertyValue('--shades-theme-spacing-xl')).toBe('32px')
    })
  })

  describe('buildTransition', () => {
    it('should build a single transition string', () => {
      expect(buildTransition(['background', '0.2s', 'ease'])).toBe('background 0.2s ease')
    })

    it('should join multiple transitions with commas', () => {
      expect(buildTransition(['background', '0.2s', 'ease'], ['opacity', '0.15s', 'ease-out'])).toBe(
        'background 0.2s ease, opacity 0.15s ease-out',
      )
    })

    it('should handle three or more transitions', () => {
      const result = buildTransition(
        ['background', '0.2s', 'ease'],
        ['color', '0.3s', 'linear'],
        ['transform', '0.1s', 'ease-in-out'],
      )
      expect(result).toBe('background 0.2s ease, color 0.3s linear, transform 0.1s ease-in-out')
    })

    it('should work with CSS variable references', () => {
      expect(
        buildTransition([
          'background',
          cssVariableTheme.transitions.duration.normal,
          cssVariableTheme.transitions.easing.default,
        ]),
      ).toBe(
        'background var(--shades-theme-transitions-duration-normal) var(--shades-theme-transitions-easing-default)',
      )
    })
  })
})
