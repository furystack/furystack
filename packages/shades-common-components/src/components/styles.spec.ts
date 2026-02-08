import { describe, expect, it } from 'vitest'
import { cssVariableTheme } from '../services/css-variable-theme.js'
import { colors, styles } from './styles.js'

describe('styles', () => {
  describe('colors', () => {
    describe('primary', () => {
      it('should reference theme palette primary light', () => {
        expect(colors.primary.light).toBe(cssVariableTheme.palette.primary.light)
      })

      it('should reference theme palette primary main', () => {
        expect(colors.primary.main).toBe(cssVariableTheme.palette.primary.main)
      })

      it('should reference theme palette primary dark', () => {
        expect(colors.primary.dark).toBe(cssVariableTheme.palette.primary.dark)
      })

      it('should reference theme palette primary mainContrast', () => {
        expect(colors.primary.contrastText).toBe(cssVariableTheme.palette.primary.mainContrast)
      })
    })

    describe('secondary', () => {
      it('should reference theme palette secondary light', () => {
        expect(colors.secondary.light).toBe(cssVariableTheme.palette.secondary.light)
      })

      it('should reference theme palette secondary main', () => {
        expect(colors.secondary.main).toBe(cssVariableTheme.palette.secondary.main)
      })

      it('should reference theme palette secondary dark', () => {
        expect(colors.secondary.dark).toBe(cssVariableTheme.palette.secondary.dark)
      })

      it('should reference theme palette secondary mainContrast', () => {
        expect(colors.secondary.contrastText).toBe(cssVariableTheme.palette.secondary.mainContrast)
      })
    })

    describe('error', () => {
      it('should reference theme palette error main', () => {
        expect(colors.error.main).toBe(cssVariableTheme.palette.error.main)
      })
    })
  })

  describe('styles', () => {
    describe('glassBox', () => {
      it('should have backdropFilter using theme blur token', () => {
        expect(styles.glassBox.backdropFilter).toBe(`blur(${cssVariableTheme.effects.blurSm})`)
      })

      it('should have borderRadius using theme token', () => {
        expect(styles.glassBox.borderRadius).toBe(cssVariableTheme.shape.borderRadius.sm)
      })

      it('should have border using theme subtleBorder', () => {
        expect(styles.glassBox.border).toBe(`1px solid ${cssVariableTheme.action.subtleBorder}`)
      })

      it('should have boxShadow using theme shadow', () => {
        expect(styles.glassBox.boxShadow).toBe(cssVariableTheme.shadows.md)
      })
    })
  })
})
