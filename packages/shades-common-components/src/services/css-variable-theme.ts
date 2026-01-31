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
}

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
    if (typeof source[key] === 'object' && typeof target[key] === 'object') {
      assignValue(target[key] as object, source[key] as object, root)
      return
    } else {
      assignFn(target[key] as string, source[key] as string, root)
    }
  })
}
export const useThemeCssVariables = (theme: DeepPartial<Theme>) => {
  const root = document.querySelector(':root') as HTMLElement
  assignValue(cssVariableTheme, theme, root)
}
