import { Injectable } from '@furystack/inject'
import { EventHub, type DeepPartial } from '@furystack/utils'

import { cssVariableTheme, useThemeCssVariables } from './css-variable-theme.js'

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
  /** Optional CSS background-image for paper surfaces (e.g. a tiled texture) */
  paperImage?: string
}

/**
 * Interactive state colors for hover, selection, focus and overlay backgrounds.
 */
export type ActionColors = {
  /** Background color on hover for interactive elements */
  hoverBackground: Color
  /** Background color for selected/checked elements */
  selectedBackground: Color
  /** Background color for actively pressed elements */
  activeBackground: Color
  /** Box-shadow value for focus ring indicators */
  focusRing: string
  /** Opacity value for disabled elements (e.g. '0.6') */
  disabledOpacity: string
  /** Overlay background color for backdrops (drawers, modals) */
  backdrop: Color
  /** Subtle border color for structural dividers, input borders, and dropdown outlines */
  subtleBorder: Color
}

/**
 * Border radius scale for consistent rounded corners.
 */
export type BorderRadiusScale = {
  /** 2px - grid cells, small elements */
  xs: string
  /** 4px - badges, compact items */
  sm: string
  /** 8px - buttons, paper, inputs, cards */
  md: string
  /** 12px - suggest, command palette */
  lg: string
  /** 50% - circular elements (avatar, FAB, loader) */
  full: string
}

/**
 * Shape tokens for geometric properties.
 */
export type Shape = {
  /** Border radius scale */
  borderRadius: BorderRadiusScale
  /** Border width for surface components (paper, card, etc.). Defaults to 0. */
  borderWidth?: string
}

/**
 * Elevation shadow presets from subtle to prominent.
 */
export type Shadows = {
  /** No shadow */
  none: string
  /** Subtle shadow (paper elevation 1, notifications) */
  sm: string
  /** Medium shadow (paper elevation 2, context-menu, dropdowns) */
  md: string
  /** Large shadow (paper elevation 3, modals, overlays) */
  lg: string
  /** Extra large shadow (floating elements like FAB, avatar hover) */
  xl: string
}

/**
 * Font size scale for consistent text sizing.
 */
export type FontSizeScale = {
  /** 11px - labels, helper text */
  xs: string
  /** 13px - small body, secondary text */
  sm: string
  /** 14px - body text, buttons */
  md: string
  /** 16px - large body, icons */
  lg: string
  /** 24px - subheadings, large UI elements */
  xl: string
  /** 30px - small headings (h3) */
  xxl: string
  /** 36px - medium headings (h2) */
  xxxl: string
  /** 48px - large headings (h1) */
  xxxxl: string
}

/**
 * Font weight scale.
 */
export type FontWeightScale = {
  /** 400 - normal weight */
  normal: string
  /** 500 - medium weight */
  medium: string
  /** 600 - semibold weight */
  semibold: string
  /** 700 - bold weight */
  bold: string
}

/**
 * Line height scale.
 */
export type LineHeightScale = {
  /** 1.3 - headings, compact text */
  tight: string
  /** 1.5 - standard body text */
  normal: string
  /** 1.75 - relaxed spacing */
  relaxed: string
}

/**
 * Letter spacing scale for consistent character spacing.
 */
export type LetterSpacingScale = {
  /** -0.5px - tight spacing for large display text */
  tight: string
  /** -0.25px - slightly tight spacing for headings */
  dense: string
  /** 0px - default spacing */
  normal: string
  /** 0.15px - slightly wider for body text */
  wide: string
  /** 0.5px - wider for buttons and labels */
  wider: string
  /** 1.5px - widest for overline/caption text */
  widest: string
}

/**
 * Typography tokens for text styling.
 */
export type ThemeTypography = {
  /** Base font family stack */
  fontFamily: string
  /** Font size scale */
  fontSize: FontSizeScale
  /** Font weight scale */
  fontWeight: FontWeightScale
  /** Line height scale */
  lineHeight: LineHeightScale
  /** Letter spacing scale */
  letterSpacing?: LetterSpacingScale
  /** CSS text-shadow value applied globally to text */
  textShadow?: string
}

/**
 * Transition duration presets.
 */
export type TransitionDurations = {
  /** 150ms - micro-interactions (hover, active states) */
  fast: string
  /** 200ms - default transitions */
  normal: string
  /** 300ms - layout changes, drawers */
  slow: string
}

/**
 * Transition easing presets.
 */
export type TransitionEasings = {
  /** Standard Material easing - cubic-bezier(0.4, 0, 0.2, 1) */
  default: string
  /** Decelerate easing - cubic-bezier(0.23, 1.0, 0.32, 1.0) */
  easeOut: string
  /** Symmetric easing - ease-in-out */
  easeInOut: string
}

/**
 * Transition timing tokens for animations and state changes.
 */
export type Transitions = {
  /** Duration presets */
  duration: TransitionDurations
  /** Easing function presets */
  easing: TransitionEasings
}

/**
 * Spacing scale for consistent padding, margins and gaps.
 */
export type Spacing = {
  /** 4px */
  xs: string
  /** 8px */
  sm: string
  /** 16px */
  md: string
  /** 24px */
  lg: string
  /** 32px */
  xl: string
}

/**
 * Z-index layer scale for consistent stacking context.
 */
export type ZIndex = {
  /** 1000 - drawers and sidebar panels */
  drawer: string
  /** 1100 - app bars and sticky headers */
  appBar: string
  /** 1200 - modals and dialogs */
  modal: string
  /** 1300 - tooltips and popovers */
  tooltip: string
  /** 1400 - dropdowns and context menus */
  dropdown: string
}

/**
 * Visual effect tokens for blur and backdrop effects.
 */
export type Effects = {
  /** 4px - subtle blur for glassy surfaces */
  blurSm: string
  /** 8px - medium blur for overlays */
  blurMd: string
  /** 15px - strong blur for app bar / prominent overlays */
  blurLg: string
  /** 20px - heavy blur for command palette / suggestion lists */
  blurXl: string
}

/**
 * Complete theme definition containing all design tokens for the application.
 * Themes can be switched at runtime to support light/dark modes or custom branding.
 *
 * **Future extension — Component size variants:**
 * When introducing size variants for form controls (e.g. sm/md/lg Button, Input),
 * add a `componentDefaults` section to this interface:
 *
 * ```typescript
 * type ComponentSize = 'sm' | 'md' | 'lg'
 * type SizeTokens = { height: string; padding: string; fontSize: string; borderRadius: string; iconSize: string }
 * componentDefaults: { size: Record<ComponentSize, SizeTokens> }
 * ```
 *
 * The existing `typography.fontSize` and `shape.borderRadius` scales provide
 * the building blocks that size tokens should reference.
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
  /** Interactive state colors */
  action: ActionColors
  /** Shape tokens (border radius) */
  shape: Shape
  /** Elevation shadow presets */
  shadows: Shadows
  /** Typography scale (font sizes, weights, line heights, letter spacing) */
  typography: ThemeTypography
  /** Transition timing tokens */
  transitions: Transitions
  /** Spacing scale */
  spacing: Spacing
  /** Z-index stacking layers */
  zIndex?: ZIndex
  /** Visual effect tokens (blur, backdrop) */
  effects?: Effects
}

/**
 * Service class for theme-related operations
 */
@Injectable({ lifetime: 'singleton' })
export class ThemeProviderService extends EventHub<{ themeChanged: DeepPartial<Theme> }> {
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
