import { RgbColor } from './rgb-color.js'

/**
 *
 * @param color The color to match
 * @param background An optional background color. When calculating with alpha, it will be blended to the original color. If not provided, a white color will be used
 * @returns A luminence value as a float number from 0 to 1. 0 is the darkest, 1 is the brightest
 */
export const getLuminance = (color: RgbColor, background: RgbColor = new RgbColor(255, 255, 255, 1)) => {
  // 1. Alpha compositing: Blend foreground over background
  const alpha = color.a ?? 1

  const rBlended = color.r * alpha + background.r * (1 - alpha)
  const gBlended = color.g * alpha + background.g * (1 - alpha)
  const bBlended = color.b * alpha + background.b * (1 - alpha)

  // 2. Convert blended 0-255 RGB values to a 0-1 scale
  const rScale = rBlended / 255
  const gScale = gBlended / 255
  const bScale = bBlended / 255

  // 3. Apply the sRGB linearized formula
  const R = rScale <= 0.03928 ? rScale / 12.92 : Math.pow((rScale + 0.055) / 1.055, 2.4)
  const G = gScale <= 0.03928 ? gScale / 12.92 : Math.pow((gScale + 0.055) / 1.055, 2.4)
  const B = bScale <= 0.03928 ? bScale / 12.92 : Math.pow((bScale + 0.055) / 1.055, 2.4)

  // 4. Calculate final WCAG relative luminance (0 to 1)
  return 0.2126 * R + 0.7152 * G + 0.0722 * B
}
