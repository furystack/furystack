import { beforeEach, describe, expect, it } from 'vitest'
import { RgbColor, ThemeProviderService } from './theme-provider-service.js'

describe('theme-provider-service', () => {
  describe('RgbColor', () => {
    describe('constructor', () => {
      it('should create RgbColor with r, g, b values', () => {
        const color = new RgbColor(255, 128, 64)
        expect(color.r).toBe(255)
        expect(color.g).toBe(128)
        expect(color.b).toBe(64)
        expect(color.a).toBe(1)
      })

      it('should create RgbColor with alpha value', () => {
        const color = new RgbColor(255, 128, 64, 0.5)
        expect(color.r).toBe(255)
        expect(color.g).toBe(128)
        expect(color.b).toBe(64)
        expect(color.a).toBe(0.5)
      })

      it('should default alpha to 1', () => {
        const color = new RgbColor(100, 100, 100)
        expect(color.a).toBe(1)
      })
    })

    describe('update', () => {
      it('should update r value and return self', () => {
        const color = new RgbColor(100, 100, 100)
        const result = color.update('r', 200)
        expect(result).toBe(color)
        expect(color.r).toBe(200)
      })

      it('should update g value', () => {
        const color = new RgbColor(100, 100, 100)
        color.update('g', 150)
        expect(color.g).toBe(150)
      })

      it('should update b value', () => {
        const color = new RgbColor(100, 100, 100)
        color.update('b', 50)
        expect(color.b).toBe(50)
      })

      it('should update a value', () => {
        const color = new RgbColor(100, 100, 100, 1)
        color.update('a', 0.7)
        expect(color.a).toBe(0.7)
      })

      it('should allow chained updates', () => {
        const color = new RgbColor(0, 0, 0)
        color.update('r', 255).update('g', 128).update('b', 64)
        expect(color.r).toBe(255)
        expect(color.g).toBe(128)
        expect(color.b).toBe(64)
      })
    })

    describe('toString', () => {
      it('should return rgba format string', () => {
        const color = new RgbColor(255, 128, 64, 0.5)
        expect(color.toString()).toBe('rgba(255,128,64,0.5)')
      })

      it('should handle full opacity', () => {
        const color = new RgbColor(0, 0, 0, 1)
        expect(color.toString()).toBe('rgba(0,0,0,1)')
      })

      it('should handle zero alpha', () => {
        const color = new RgbColor(255, 255, 255, 0)
        expect(color.toString()).toBe('rgba(255,255,255,0)')
      })
    })
  })

  describe('ThemeProviderService', () => {
    let service: ThemeProviderService

    beforeEach(() => {
      service = new ThemeProviderService()
    })

    describe('getRgbFromColorString', () => {
      it('should parse 6-digit hex color', () => {
        const result = service.getRgbFromColorString('#ff8040')
        expect(result.r).toBe(255)
        expect(result.g).toBe(128)
        expect(result.b).toBe(64)
      })

      it('should parse 6-digit hex color with lowercase', () => {
        const result = service.getRgbFromColorString('#3f51b5')
        expect(result.r).toBe(63)
        expect(result.g).toBe(81)
        expect(result.b).toBe(181)
      })

      it('should parse 6-digit hex color with uppercase', () => {
        const result = service.getRgbFromColorString('#FF0000')
        expect(result.r).toBe(255)
        expect(result.g).toBe(0)
        expect(result.b).toBe(0)
      })

      it('should parse 3-digit hex color', () => {
        const result = service.getRgbFromColorString('#f80')
        expect(result.r).toBe(255)
        expect(result.g).toBe(136)
        expect(result.b).toBe(0)
      })

      it('should parse 3-digit hex white', () => {
        const result = service.getRgbFromColorString('#fff')
        expect(result.r).toBe(255)
        expect(result.g).toBe(255)
        expect(result.b).toBe(255)
      })

      it('should parse 3-digit hex black', () => {
        const result = service.getRgbFromColorString('#000')
        expect(result.r).toBe(0)
        expect(result.g).toBe(0)
        expect(result.b).toBe(0)
      })

      it('should parse rgba color', () => {
        const result = service.getRgbFromColorString('rgba(255,128,64,0.5)')
        expect(result.r).toBe(255)
        expect(result.g).toBe(128)
        expect(result.b).toBe(64)
        expect(result.a).toBe(0)
      })

      it('should parse rgba color with spaces', () => {
        const result = service.getRgbFromColorString('rgba(100, 150, 200, 1)')
        expect(result.r).toBe(100)
        expect(result.g).toBe(150)
        expect(result.b).toBe(200)
        expect(result.a).toBe(1)
      })

      it('should throw error for unsupported color format', () => {
        expect(() => service.getRgbFromColorString('red')).toThrow("Color format 'red' is not supported.'")
      })

      it('should throw error for rgb format without alpha', () => {
        expect(() => service.getRgbFromColorString('rgb(255, 0, 0)')).toThrow()
      })

      it('should throw error for invalid hex length', () => {
        expect(() => service.getRgbFromColorString('#12345')).toThrow()
      })
    })

    describe('getTextColor', () => {
      it('should return dark text for light background', () => {
        const result = service.getTextColor('#ffffff')
        expect(result).toBe('#000000')
      })

      it('should return light text for dark background', () => {
        const result = service.getTextColor('#000000')
        expect(result).toBe('#FFFFFF')
      })

      it('should return custom bright color for light background', () => {
        const result = service.getTextColor('#ffffff', '#333333', '#eeeeee')
        expect(result).toBe('#333333')
      })

      it('should return custom dark color for dark background', () => {
        const result = service.getTextColor('#000000', '#333333', '#eeeeee')
        expect(result).toBe('#eeeeee')
      })
    })

    describe('theme management', () => {
      it('should have initial theme assigned', () => {
        expect(service.getAssignedTheme()).toBeDefined()
        expect(service.getAssignedTheme().name).toBe('css-variable-theme')
      })

      it('should expose cssVariableTheme as theme property', () => {
        expect(service.theme).toBeDefined()
        expect(service.theme.name).toBe('css-variable-theme')
      })
    })
  })
})
