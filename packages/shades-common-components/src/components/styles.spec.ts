import { describe, expect, it } from 'vitest'
import { colors, styles } from './styles.js'

describe('styles', () => {
  describe('colors', () => {
    describe('primary', () => {
      it('should have light color', () => {
        expect(colors.primary.light).toBe('#82e9de')
      })

      it('should have main color', () => {
        expect(colors.primary.main).toBe('#4db6ac')
      })

      it('should have dark color', () => {
        expect(colors.primary.dark).toBe('#00867d')
      })

      it('should have contrastText color', () => {
        expect(colors.primary.contrastText).toBe('#000')
      })
    })

    describe('secondary', () => {
      it('should have light color', () => {
        expect(colors.secondary.light).toBe('#62727b')
      })

      it('should have main color', () => {
        expect(colors.secondary.main).toBe('#37474f')
      })

      it('should have dark color', () => {
        expect(colors.secondary.dark).toBe('#102027')
      })

      it('should have contrastText color', () => {
        expect(colors.secondary.contrastText).toBe('#fff')
      })
    })

    describe('error', () => {
      it('should have main color', () => {
        expect(colors.error.main).toBe('red')
      })
    })
  })

  describe('styles', () => {
    describe('glassBox', () => {
      it('should have backdropFilter', () => {
        expect(styles.glassBox.backdropFilter).toBe('blur(4px)')
      })

      it('should have borderRadius', () => {
        expect(styles.glassBox.borderRadius).toBe('5px')
      })

      it('should have border', () => {
        expect(styles.glassBox.border).toBe('1px solid rgba(128, 128, 128, 0.3)')
      })

      it('should have boxShadow', () => {
        expect(styles.glassBox.boxShadow).toBe(
          'rgba(0, 0, 0, 0.3) 2px 2px 2px, 1px 1px 3px -2px rgba(255,255,255,0.3) inset',
        )
      })
    })
  })
})
