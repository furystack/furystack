import { Injectable } from '@furystack/inject'
import { DeepPartial, deepMerge, ObservableValue } from '@furystack/utils'
import { defaultDarkTheme } from './default-dark-theme'

export type ThemeType = 'light' | 'dark'

export type Color = string // `#${string}` | `rgba(${number},${number},${number},${number})` |

export type ColorVariants = {
  main: Color
  light: Color
  dark: Color
}

export interface Palette {
  primary: ColorVariants
  secondary: ColorVariants
  error: ColorVariants
  warning: ColorVariants
  success: ColorVariants
  info: ColorVariants
}

export interface Text {
  primary: Color
  secondary: Color
  disabled: Color
}

export interface ButtonColor {
  active: Color
  hover: Color
  selected: Color
  disabled: Color
  disabledBackground: Color
}

export interface Background {
  default: Color
  paper: Color
}

export interface Theme {
  palette: Palette
  text: Text
  button: ButtonColor
  background: Background
  divider: Color
}

@Injectable({ lifetime: 'singleton' })
export class ThemeProviderService {
  public getTextColor(color: string) {
    const { r, g, b } = this.getRgbFromColorString(color)
    const yiq = (r * 299 + g * 587 + b * 114) / 1000
    return yiq >= 128 ? '#000000' : '#FFFFFF'
  }

  public getRgbFromColorString(color: string) {
    if (color.startsWith('#')) {
      if (color.length === 7) {
        const r = parseInt(color.substr(1, 2), 16)
        const g = parseInt(color.substr(3, 2), 16)
        const b = parseInt(color.substr(5, 2), 16)
        return { r, g, b }
      }
      if (color.length === 4) {
        const r = parseInt(color.substr(1, 1) + color.substr(1, 1), 16)
        const g = parseInt(color.substr(2, 1) + color.substr(2, 1), 16)
        const b = parseInt(color.substr(3, 1) + color.substr(3, 1), 16)
        return { r, g, b }
      }
    }
    if (color.startsWith('rgba(')) {
      const result = new RegExp(
        /^rgba[(](?<red>[\d]+)[,][\s]?(?<green>[\d]+)[,][\s]?(?<blue>[\d]+)[,][\s]?(?<alpha>[\d|.]+)[)]/gm,
      ).exec(color)
      if (result && result.groups) {
        return {
          r: parseInt(result.groups.red, 10),
          g: parseInt(result.groups.green, 10),
          b: parseInt(result.groups.blue, 10),
        }
      }
    }
    throw Error(`Color format '${color} is not supported.'`)
  }

  public readonly theme = new ObservableValue(defaultDarkTheme)

  public set(change: DeepPartial<Theme>) {
    this.theme.setValue(deepMerge(this.theme.getValue(), change))
  }

  public dispose() {
    this.theme.dispose()
  }
}
