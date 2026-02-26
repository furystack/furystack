import { describe, expect, it } from 'vitest'
import { getRgbFromColorString } from './get-rgb-from-color-string.js'

describe('getRgbFromColorString', () => {
  describe('hex colors', () => {
    it('should parse 6-digit hex color', () => {
      const result = getRgbFromColorString('#ff8040')
      expect(result.r).toBe(255)
      expect(result.g).toBe(128)
      expect(result.b).toBe(64)
    })

    it('should parse 6-digit hex color with lowercase', () => {
      const result = getRgbFromColorString('#3f51b5')
      expect(result.r).toBe(63)
      expect(result.g).toBe(81)
      expect(result.b).toBe(181)
    })

    it('should parse 6-digit hex color with uppercase', () => {
      const result = getRgbFromColorString('#FF0000')
      expect(result.r).toBe(255)
      expect(result.g).toBe(0)
      expect(result.b).toBe(0)
    })

    it('should parse 3-digit hex color', () => {
      const result = getRgbFromColorString('#f80')
      expect(result.r).toBe(255)
      expect(result.g).toBe(136)
      expect(result.b).toBe(0)
    })

    it('should parse 3-digit hex white', () => {
      const result = getRgbFromColorString('#fff')
      expect(result.r).toBe(255)
      expect(result.g).toBe(255)
      expect(result.b).toBe(255)
    })

    it('should parse 3-digit hex black', () => {
      const result = getRgbFromColorString('#000')
      expect(result.r).toBe(0)
      expect(result.g).toBe(0)
      expect(result.b).toBe(0)
    })

    it('should throw error for invalid hex length', () => {
      expect(() => getRgbFromColorString('#12345')).toThrow()
    })
  })

  describe('rgb / rgba', () => {
    it('should parse rgb color', () => {
      const result = getRgbFromColorString('rgb(255, 0, 0)')
      expect(result.r).toBe(255)
      expect(result.g).toBe(0)
      expect(result.b).toBe(0)
      expect(result.a).toBe(1)
    })

    it('should parse rgb color without spaces', () => {
      const result = getRgbFromColorString('rgb(10,20,30)')
      expect(result.r).toBe(10)
      expect(result.g).toBe(20)
      expect(result.b).toBe(30)
      expect(result.a).toBe(1)
    })

    it('should parse rgba color', () => {
      const result = getRgbFromColorString('rgba(255,128,64,0.5)')
      expect(result.r).toBe(255)
      expect(result.g).toBe(128)
      expect(result.b).toBe(64)
      expect(result.a).toBe(0.5)
    })

    it('should parse rgba color with spaces', () => {
      const result = getRgbFromColorString('rgba(100, 150, 200, 1)')
      expect(result.r).toBe(100)
      expect(result.g).toBe(150)
      expect(result.b).toBe(200)
      expect(result.a).toBe(1)
    })
  })

  describe('named colors', () => {
    it('should parse "red"', () => {
      const result = getRgbFromColorString('red')
      expect(result.r).toBe(255)
      expect(result.g).toBe(0)
      expect(result.b).toBe(0)
    })

    it('should parse "black"', () => {
      const result = getRgbFromColorString('black')
      expect(result.r).toBe(0)
      expect(result.g).toBe(0)
      expect(result.b).toBe(0)
    })

    it('should parse "white"', () => {
      const result = getRgbFromColorString('white')
      expect(result.r).toBe(255)
      expect(result.g).toBe(255)
      expect(result.b).toBe(255)
    })

    it('should parse named colors case-insensitively', () => {
      const result = getRgbFromColorString('DodgerBlue')
      expect(result.r).toBe(30)
      expect(result.g).toBe(144)
      expect(result.b).toBe(255)
    })
  })

  describe('unsupported formats', () => {
    it('should throw error for unsupported color format', () => {
      expect(() => getRgbFromColorString('not-a-color')).toThrow("Color format 'not-a-color' is not supported.")
    })
  })
})
