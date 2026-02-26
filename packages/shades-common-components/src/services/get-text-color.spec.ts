import { describe, expect, it } from 'vitest'
import { getTextColor } from './get-text-color.js'

describe('getTextColor', () => {
  it('should return dark text for light background', () => {
    expect(getTextColor('#ffffff')).toBe('#000000')
  })

  it('should return light text for dark background', () => {
    expect(getTextColor('#000000')).toBe('#FFFFFF')
  })

  it('should return custom bright color for light background', () => {
    expect(getTextColor('#ffffff', '#333333', '#eeeeee')).toBe('#333333')
  })

  it('should return custom dark color for dark background', () => {
    expect(getTextColor('#000000', '#333333', '#eeeeee')).toBe('#eeeeee')
  })

  it('should work with named colors', () => {
    expect(getTextColor('white')).toBe('#000000')
    expect(getTextColor('black')).toBe('#FFFFFF')
  })
})
