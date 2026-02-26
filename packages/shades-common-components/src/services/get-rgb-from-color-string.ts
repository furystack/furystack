import { getCssVariable } from './css-variable-theme.js'
import { RgbColor } from './rgb-color.js'

const NAMED_COLORS: Record<string, [r: number, g: number, b: number]> = {
  aqua: [0, 255, 255],
  black: [0, 0, 0],
  blue: [0, 0, 255],
  brown: [165, 42, 42],
  coral: [255, 127, 80],
  crimson: [220, 20, 60],
  cyan: [0, 255, 255],
  darkblue: [0, 0, 139],
  darkgray: [169, 169, 169],
  darkgreen: [0, 100, 0],
  darkgrey: [169, 169, 169],
  darkred: [139, 0, 0],
  deeppink: [255, 20, 147],
  dodgerblue: [30, 144, 255],
  fuchsia: [255, 0, 255],
  gold: [255, 215, 0],
  gray: [128, 128, 128],
  green: [0, 128, 0],
  grey: [128, 128, 128],
  hotpink: [255, 105, 180],
  indigo: [75, 0, 130],
  ivory: [255, 255, 240],
  khaki: [240, 230, 140],
  lavender: [230, 230, 250],
  lime: [0, 255, 0],
  limegreen: [50, 205, 50],
  magenta: [255, 0, 255],
  maroon: [128, 0, 0],
  navy: [0, 0, 128],
  olive: [128, 128, 0],
  orange: [255, 165, 0],
  orangered: [255, 69, 0],
  pink: [255, 192, 203],
  purple: [128, 0, 128],
  red: [255, 0, 0],
  royalblue: [65, 105, 225],
  salmon: [250, 128, 114],
  silver: [192, 192, 192],
  skyblue: [135, 206, 235],
  steelblue: [70, 130, 180],
  teal: [0, 128, 128],
  tomato: [255, 99, 71],
  turquoise: [64, 224, 208],
  violet: [238, 130, 238],
  white: [255, 255, 255],
  yellow: [255, 255, 0],
}

/**
 * Parses a CSS color string and returns its RGBA representation.
 * Supports hex (#rgb, #rrggbb), rgb(), rgba(), CSS variables (var(--…)),
 * and common named colors.
 * @param color The color string to parse
 * @returns The parsed RGBA values
 */
export const getRgbFromColorString = (color: string): RgbColor => {
  if (color.startsWith('var(--')) {
    return getRgbFromColorString(getCssVariable(color))
  }

  if (color.startsWith('#')) {
    if (color.length === 7) {
      const r = parseInt(color.substring(1, 3), 16)
      const g = parseInt(color.substring(3, 5), 16)
      const b = parseInt(color.substring(5, 7), 16)
      return new RgbColor(r, g, b)
    }
    if (color.length === 4) {
      const r = parseInt(color[1] + color[1], 16)
      const g = parseInt(color[2] + color[2], 16)
      const b = parseInt(color[3] + color[3], 16)
      return new RgbColor(r, g, b)
    }
  }

  const rgbaMatch = /^rgba?\(\s*(?<red>\d+),\s*(?<green>\d+),\s*(?<blue>\d+)(?:,\s*(?<alpha>[\d.]+))?\s*\)$/.exec(color)
  if (rgbaMatch?.groups) {
    return new RgbColor(
      parseInt(rgbaMatch.groups.red, 10),
      parseInt(rgbaMatch.groups.green, 10),
      parseInt(rgbaMatch.groups.blue, 10),
      rgbaMatch.groups.alpha !== undefined ? parseFloat(rgbaMatch.groups.alpha) : 1,
    )
  }

  const named = NAMED_COLORS[color.toLowerCase()]
  if (named) {
    return new RgbColor(named[0], named[1], named[2])
  }

  throw Error(`Color format '${color}' is not supported.`)
}
