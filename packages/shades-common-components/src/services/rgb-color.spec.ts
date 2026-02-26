import { describe, expect, it } from 'vitest'
import { RgbColor } from './rgb-color.js'

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
