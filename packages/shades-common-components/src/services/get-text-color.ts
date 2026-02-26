import { getRgbFromColorString } from './get-rgb-from-color-string.js'

/**
 * Returns a contrasting text color (bright or dark) for a given background color.
 * Uses the YIQ luminance formula to determine whether the background is light or dark.
 * @param color The background color string
 * @param bright The color to return for light backgrounds (defaults to '#000000')
 * @param dark The color to return for dark backgrounds (defaults to '#FFFFFF')
 * @returns The bright or dark color that best contrasts the background
 */
export const getTextColor = (color: string, bright = '#000000', dark = '#FFFFFF'): string => {
  const { r, g, b } = getRgbFromColorString(color)
  const yiq = (r * 299 + g * 587 + b * 114) / 1000
  return yiq >= 128 ? bright : dark
}
