import { describe, expect, it } from 'vitest'
import { getLuminance } from './get-luminance.js'
import { RgbColor } from './rgb-color.js'

describe('getLuminance', () => {
  const lightBackground = new RgbColor(255, 255, 255, 1)
  const darkBackground = new RgbColor(0, 0, 0, 1)

  it('Should return the right value for black', () => {
    const blackColor = new RgbColor(0, 0, 0, 1)
    expect(getLuminance(blackColor, lightBackground)).toMatchInlineSnapshot(`0`)
    expect(getLuminance(blackColor, darkBackground)).toMatchInlineSnapshot(`0`)
    expect(getLuminance(blackColor)).toMatchInlineSnapshot(`0`)
  })

  it('Should return the right value to 50% transparent black', () => {
    const transparentBlack = new RgbColor(0, 0, 0, 0.5)
    expect(getLuminance(transparentBlack, lightBackground)).toMatchInlineSnapshot(`0.21404114048223255`)
    expect(getLuminance(transparentBlack, darkBackground)).toMatchInlineSnapshot(`0`)
    expect(getLuminance(transparentBlack)).toMatchInlineSnapshot(`0.21404114048223255`)
  })

  it('Should return the right value for red', () => {
    const red = new RgbColor(255, 0, 0, 1)
    expect(getLuminance(red, lightBackground)).toMatchInlineSnapshot(`0.2126`)
  })

  it('Should return the right value for transparent red', () => {
    const transparentRed = new RgbColor(255, 0, 0, 0.5)
    expect(getLuminance(transparentRed, lightBackground)).toMatchInlineSnapshot(`0.3811359940157099`)
    expect(getLuminance(transparentRed, darkBackground)).toMatchInlineSnapshot(`0.04550514646652264`)
  })

  it('Should return the right value for light gray', () => {
    const lightGray = new RgbColor(192, 192, 192, 1)
    expect(getLuminance(lightGray, lightBackground)).toMatchInlineSnapshot(`0.5271151257058131`)
  })

  it('Should return the right value for 50% transparent light gray', () => {
    const lightGray = new RgbColor(192, 192, 192, 0.5)
    expect(getLuminance(lightGray, lightBackground)).toMatchInlineSnapshot(`0.7416517879925734`)
    expect(getLuminance(lightGray, darkBackground)).toMatchInlineSnapshot(`0.11697066775851084`)
    expect(getLuminance(lightGray)).toMatchInlineSnapshot(`0.7416517879925734`)
  })
})
