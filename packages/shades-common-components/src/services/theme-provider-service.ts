import { Injectable } from '@furystack/inject'
import { EventHub, type DeepPartial } from '@furystack/utils'
import { cssVariableTheme, getCssVariable, useThemeCssVariables } from './css-variable-theme.js'

/**
 * Represents a CSS color value.
 * Can be a hex color, rgba, or CSS variable reference.
 * @example '#3f51b5', 'rgba(255, 255, 255, 0.7)', 'var(--my-color)'
 */
export type Color = string

/**
 * Color variants for a palette color with their corresponding contrast text colors.
 * Each variant (light, main, dark) has an associated contrast color that should be
 * used for text or icons displayed on top of that variant's background.
 */
export type ColorVariants = {
  /** The lighter shade of the color */
  light: Color
  /** Text/icon color that contrasts well with the light variant */
  lightContrast: Color
  /** The primary/default shade of the color */
  main: Color
  /** Text/icon color that contrasts well with the main variant */
  mainContrast: Color
  /** The darker shade of the color */
  dark: Color
  /** Text/icon color that contrasts well with the dark variant */
  darkContrast: Color
}

/**
 * The color palette containing semantic colors for the application.
 * Each color has light, main, and dark variants with corresponding contrast colors.
 */
export interface Palette {
  /** Primary brand color, used for main actions and emphasis */
  primary: ColorVariants
  /** Secondary brand color, used for less prominent actions */
  secondary: ColorVariants
  /** Color indicating errors or destructive actions */
  error: ColorVariants
  /** Color indicating warnings or caution */
  warning: ColorVariants
  /** Color indicating success or positive outcomes */
  success: ColorVariants
  /** Color for informational content */
  info: ColorVariants
}

/**
 * Text color definitions for different emphasis levels.
 */
export interface Text {
  /** High-emphasis text color for important content */
  primary: Color
  /** Medium-emphasis text color for secondary content */
  secondary: Color
  /** Low-emphasis text color for disabled or hint text */
  disabled: Color
}

/**
 * Button-specific color definitions for various states.
 */
export interface ButtonColor {
  /** Color when button is actively pressed */
  active: Color
  /** Background color on hover */
  hover: Color
  /** Background color when selected/checked */
  selected: Color
  /** Text color when button is disabled */
  disabled: Color
  /** Background color when button is disabled */
  disabledBackground: Color
}

/**
 * Background color definitions for different surface levels.
 */
export interface Background {
  /** Default page/app background color */
  default: Color
  /** Elevated surface background (cards, dialogs, etc.) */
  paper: Color
}

/**
 * Complete theme definition containing all color tokens for the application.
 * Themes can be switched at runtime to support light/dark modes or custom branding.
 */
export interface Theme {
  /** Unique identifier for the theme */
  name: string
  /** Semantic color palette */
  palette: Palette
  /** Text colors for different emphasis levels */
  text: Text
  /** Button-specific colors */
  button: ButtonColor
  /** Background colors */
  background: Background
  /** Color for dividers and borders */
  divider: Color
}

export class RgbColor {
  constructor(
    public r: number,
    public g: number,
    public b: number,
    public a: number = 1,
  ) {}

  public update(key: 'r' | 'g' | 'b' | 'a', value: number): RgbColor {
    this[key] = value
    return this
  }

  public toString(): string {
    return `rgba(${this.r},${this.g},${this.b},${this.a})`
  }
}

/**
 * Service class for theme-related operations
 */
@Injectable({ lifetime: 'singleton' })
export class ThemeProviderService extends EventHub<{ themeChanged: DeepPartial<Theme> }> {
  /**
   * @deprecated does not respect CSS vars
   * @param color The background color
   * @param bright The Bright color
   * @param dark The Dark color
   * @returns The bright or dark color variant that fits the background color
   */
  public getTextColor(color: string, bright = '#000000', dark = '#FFFFFF') {
    const { r, g, b } = this.getRgbFromColorString(color)
    const yiq = (r * 299 + g * 587 + b * 114) / 1000
    return yiq >= 128 ? bright : dark
  }

  /**
   * Parses a color string and returns RGB values
   * @param color The color string
   * @returns The parsed R,G,B, A values
   */
  public getRgbFromColorString(color: string): RgbColor {
    if (color.startsWith('var(--')) {
      return this.getRgbFromColorString(getCssVariable(color))
    }

    if (color.startsWith('#')) {
      if (color.length === 7) {
        const r = parseInt(color.substr(1, 2), 16)
        const g = parseInt(color.substr(3, 2), 16)
        const b = parseInt(color.substr(5, 2), 16)
        return new RgbColor(r, g, b)
      }
      if (color.length === 4) {
        const r = parseInt(color.substr(1, 1) + color.substr(1, 1), 16)
        const g = parseInt(color.substr(2, 1) + color.substr(2, 1), 16)
        const b = parseInt(color.substr(3, 1) + color.substr(3, 1), 16)
        return new RgbColor(r, g, b)
      }
    }
    if (color.startsWith('rgba(')) {
      const result = new RegExp(
        /^rgba[(](?<red>[\d]+)[,][\s]?(?<green>[\d]+)[,][\s]?(?<blue>[\d]+)[,][\s]?(?<alpha>[\d|.]+)[)]/gm,
      ).exec(color)
      if (result && result.groups) {
        return new RgbColor(
          parseInt(result.groups.red, 10),
          parseInt(result.groups.green, 10),
          parseInt(result.groups.blue, 10),
          parseInt(result.groups.alpha, 10),
        )
      }
    }
    throw Error(`Color format '${color}' is not supported.'`)
  }

  public readonly theme = cssVariableTheme

  private _assignedTheme: DeepPartial<Theme> = cssVariableTheme

  /**
   * Returns the last assigned theme object
   */
  public getAssignedTheme(): DeepPartial<Theme> {
    return this._assignedTheme
  }

  /**
   * Assigns a new theme, updates the CSS variables and emits a themeChanged event
   * @param theme The Theme instance
   */
  public setAssignedTheme(theme: DeepPartial<Theme>) {
    this._assignedTheme = theme
    useThemeCssVariables(theme)
    this.emit('themeChanged', theme)
  }
}
