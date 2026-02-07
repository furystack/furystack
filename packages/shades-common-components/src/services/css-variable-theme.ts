import type { DeepPartial } from '@furystack/utils'
import type { Theme } from './theme-provider-service.js'
export const cssVariableTheme: Theme = {
  name: 'css-variable-theme',
  text: {
    primary: 'var(--shades-theme-text-primary)',
    secondary: 'var(--shades-theme-text-secondary)',
    disabled: 'var(--shades-theme-text-disabled)',
  },
  button: {
    active: 'var(--shades-theme-button-active)',
    hover: 'var(--shades-theme-button-hover)',
    selected: 'var(--shades-theme-button-selected)',
    disabled: 'var(--shades-theme-button-disabled)',
    disabledBackground: 'var(--shades-theme-button-disabled-background)',
  },
  background: {
    default: 'var(--shades-theme-background-default)',
    paper: 'var(--shades-theme-background-paper)',
  },
  palette: {
    primary: {
      light: 'var(--shades-theme-palette-primary-light)',
      lightContrast: 'var(--shades-theme-palette-primary-light-contrast)',
      main: 'var(--shades-theme-palette-primary-main)',
      mainContrast: 'var(--shades-theme-palette-primary-main-contrast)',
      dark: 'var(--shades-theme-palette-primary-dark)',
      darkContrast: 'var(--shades-theme-palette-primary-dark-contrast)',
    },
    secondary: {
      light: 'var(--shades-theme-palette-secondary-light)',
      lightContrast: 'var(--shades-theme-palette-secondary-light-contrast)',
      main: 'var(--shades-theme-palette-secondary-main)',
      mainContrast: 'var(--shades-theme-palette-secondary-main-contrast)',
      dark: 'var(--shades-theme-palette-secondary-dark)',
      darkContrast: 'var(--shades-theme-palette-secondary-dark-contrast)',
    },
    error: {
      light: 'var(--shades-theme-palette-error-light)',
      lightContrast: 'var(--shades-theme-palette-error-light-contrast)',
      main: 'var(--shades-theme-palette-error-main)',
      mainContrast: 'var(--shades-theme-palette-error-main-contrast)',
      dark: 'var(--shades-theme-palette-error-dark)',
      darkContrast: 'var(--shades-theme-palette-error-dark-contrast)',
    },
    warning: {
      light: 'var(--shades-theme-palette-warning-light)',
      lightContrast: 'var(--shades-theme-palette-warning-light-contrast)',
      main: 'var(--shades-theme-palette-warning-main)',
      mainContrast: 'var(--shades-theme-palette-warning-main-contrast)',
      dark: 'var(--shades-theme-palette-warning-dark)',
      darkContrast: 'var(--shades-theme-palette-warning-dark-contrast)',
    },
    info: {
      light: 'var(--shades-theme-palette-info-light)',
      lightContrast: 'var(--shades-theme-palette-info-light-contrast)',
      main: 'var(--shades-theme-palette-info-main)',
      mainContrast: 'var(--shades-theme-palette-info-main-contrast)',
      dark: 'var(--shades-theme-palette-info-dark)',
      darkContrast: 'var(--shades-theme-palette-info-dark-contrast)',
    },
    success: {
      light: 'var(--shades-theme-palette-success-light)',
      lightContrast: 'var(--shades-theme-palette-success-light-contrast)',
      main: 'var(--shades-theme-palette-success-main)',
      mainContrast: 'var(--shades-theme-palette-success-main-contrast)',
      dark: 'var(--shades-theme-palette-success-dark)',
      darkContrast: 'var(--shades-theme-palette-success-dark-contrast)',
    },
  },
  divider: 'var(--shades-theme-divider)',
  action: {
    hoverBackground: 'var(--shades-theme-action-hover-background)',
    selectedBackground: 'var(--shades-theme-action-selected-background)',
    activeBackground: 'var(--shades-theme-action-active-background)',
    focusRing: 'var(--shades-theme-action-focus-ring)',
    disabledOpacity: 'var(--shades-theme-action-disabled-opacity)',
    backdrop: 'var(--shades-theme-action-backdrop)',
    subtleBorder: 'var(--shades-theme-action-subtle-border)',
  },
  shape: {
    borderRadius: {
      xs: 'var(--shades-theme-shape-border-radius-xs)',
      sm: 'var(--shades-theme-shape-border-radius-sm)',
      md: 'var(--shades-theme-shape-border-radius-md)',
      lg: 'var(--shades-theme-shape-border-radius-lg)',
      full: 'var(--shades-theme-shape-border-radius-full)',
    },
  },
  shadows: {
    none: 'var(--shades-theme-shadows-none)',
    sm: 'var(--shades-theme-shadows-sm)',
    md: 'var(--shades-theme-shadows-md)',
    lg: 'var(--shades-theme-shadows-lg)',
    xl: 'var(--shades-theme-shadows-xl)',
  },
  typography: {
    fontFamily: 'var(--shades-theme-typography-font-family)',
    fontSize: {
      xs: 'var(--shades-theme-typography-font-size-xs)',
      sm: 'var(--shades-theme-typography-font-size-sm)',
      md: 'var(--shades-theme-typography-font-size-md)',
      lg: 'var(--shades-theme-typography-font-size-lg)',
      xl: 'var(--shades-theme-typography-font-size-xl)',
    },
    fontWeight: {
      normal: 'var(--shades-theme-typography-font-weight-normal)',
      medium: 'var(--shades-theme-typography-font-weight-medium)',
      semibold: 'var(--shades-theme-typography-font-weight-semibold)',
      bold: 'var(--shades-theme-typography-font-weight-bold)',
    },
    lineHeight: {
      tight: 'var(--shades-theme-typography-line-height-tight)',
      normal: 'var(--shades-theme-typography-line-height-normal)',
      relaxed: 'var(--shades-theme-typography-line-height-relaxed)',
    },
  },
  transitions: {
    duration: {
      fast: 'var(--shades-theme-transitions-duration-fast)',
      normal: 'var(--shades-theme-transitions-duration-normal)',
      slow: 'var(--shades-theme-transitions-duration-slow)',
    },
    easing: {
      default: 'var(--shades-theme-transitions-easing-default)',
      easeOut: 'var(--shades-theme-transitions-easing-ease-out)',
      easeInOut: 'var(--shades-theme-transitions-easing-ease-in-out)',
    },
  },
  spacing: {
    xs: 'var(--shades-theme-spacing-xs)',
    sm: 'var(--shades-theme-spacing-sm)',
    md: 'var(--shades-theme-spacing-md)',
    lg: 'var(--shades-theme-spacing-lg)',
    xl: 'var(--shades-theme-spacing-xl)',
  },
}

/**
 * Builds a CSS transition string from property-duration-easing triplets.
 * @param specs - Array of [property, duration, easing] tuples
 * @returns A CSS transition string
 * @example
 * buildTransition(
 *   ['background', cssVariableTheme.transitions.duration.normal, cssVariableTheme.transitions.easing.default],
 *   ['opacity', cssVariableTheme.transitions.duration.fast, 'ease-out'],
 * )
 */
export const buildTransition = (...specs: Array<[property: string, duration: string, easing: string]>): string =>
  specs.map(([prop, dur, ease]) => `${prop} ${dur} ${ease}`).join(', ')

export const setCssVariable = (key: string, value: string, root: HTMLElement) => {
  root.style.setProperty(key.replace('var(', '').replace(')', ''), value)
}

export const getCssVariable = (key: string, root: HTMLElement = document.querySelector(':root') as HTMLElement) => {
  return getComputedStyle(root).getPropertyValue(key.replace('var(', '').replace(')', ''))
}

const assignValue = <T extends object>(
  target: T,
  source: DeepPartial<T>,
  root: HTMLElement,
  assignFn = setCssVariable,
) => {
  const keys = Object.keys(target) as Array<keyof T>
  keys.forEach((key) => {
    if (source[key] === undefined) {
      return
    }
    if (typeof source[key] === 'object' && typeof target[key] === 'object') {
      assignValue(target[key] as object, source[key] as object, root)
    } else {
      assignFn(target[key] as string, source[key] as string, root)
    }
  })
}
export const useThemeCssVariables = (theme: DeepPartial<Theme>) => {
  const root = document.querySelector(':root') as HTMLElement
  assignValue(cssVariableTheme, theme, root)
}
