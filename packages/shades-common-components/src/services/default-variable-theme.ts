import type { DeepPartial } from '@furystack/utils'
import type { Theme } from './theme-provider-service'
export const defaultVariableTheme: Theme = {
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
      main: 'var(--shades-theme-palette-primary-main)',
      dark: 'var(--shades-theme-palette-primary-dark)',
    },
    secondary: {
      light: 'var(--shades-theme-palette-secondary-light)',
      main: 'var(--shades-theme-palette-secondary-main)',
      dark: 'var(--shades-theme-palette-secondary-dark)',
    },
    error: {
      light: 'var(--shades-theme-palette-error-light)',
      main: 'var(--shades-theme-palette-error-main)',
      dark: 'var(--shades-theme-palette-error-dark)',
    },
    warning: {
      light: 'var(--shades-theme-palette-warning-light)',
      main: 'var(--shades-theme-palette-warning-main)',
      dark: 'var(--shades-theme-palette-warning-dark)',
    },
    info: {
      light: 'var(--shades-theme-palette-info-light)',
      main: 'var(--shades-theme-palette-info-main)',
      dark: 'var(--shades-theme-palette-info-dark)',
    },
    success: {
      light: 'var(--shades-theme-palette-success-light)',
      main: 'var(--shades-theme-palette-success-main)',
      dark: 'var(--shades-theme-palette-success-dark)',
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
      console.log('assigning', key, source[key])
      assignFn(target[key] as string, source[key] as string, root)
    }
  })
}

export const useThemeCssVariables = (theme: DeepPartial<Theme>) => {
  const root = document.querySelector(':root') as HTMLElement
  assignValue(defaultVariableTheme, theme, root)
}
