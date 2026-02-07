import { defaultPalette } from './default-palette.js'
import type { Theme } from './theme-provider-service.js'

export const defaultDarkTheme: Theme = {
  name: 'default-dark-theme',
  text: {
    primary: '#fff',
    secondary: 'rgba(255, 255, 255, 0.7)',
    disabled: 'rgba(255, 255, 255, 0.5)',
  },
  button: {
    active: '#fff',
    hover: 'rgba(255, 255, 255, 0.08)',
    selected: 'rgba(255, 255, 255, 0.16)',
    disabled: 'rgba(255, 255, 255, 0.3)',
    disabledBackground: 'rgba(255, 255, 255, 0.12)',
  },
  background: {
    default: '#303030',
    paper: '#424242',
  },
  palette: defaultPalette,
  divider: 'rgba(255, 255, 255, 0.12)',
  action: {
    hoverBackground: 'rgba(255, 255, 255, 0.08)',
    selectedBackground: 'rgba(255, 255, 255, 0.15)',
    activeBackground: 'rgba(255, 255, 255, 0.2)',
    focusRing: '0 0 0 3px rgba(255, 255, 255, 0.15)',
    disabledOpacity: '0.6',
    backdrop: 'rgba(0, 0, 0, 0.65)',
  },
  shape: {
    borderRadius: {
      xs: '2px',
      sm: '4px',
      md: '8px',
      lg: '12px',
      full: '50%',
    },
  },
  shadows: {
    none: 'none',
    sm: '0 1px 3px rgba(0, 0, 0, 0.2), 0 1px 2px rgba(0, 0, 0, 0.15)',
    md: '0 4px 12px rgba(0, 0, 0, 0.25), 0 2px 4px rgba(0, 0, 0, 0.2)',
    lg: '0 8px 24px rgba(0, 0, 0, 0.3), 0 4px 8px rgba(0, 0, 0, 0.2)',
    xl: '0 12px 32px rgba(0, 0, 0, 0.35), 0 6px 12px rgba(0, 0, 0, 0.25)',
  },
  typography: {
    fontFamily: 'system-ui, -apple-system, sans-serif',
    fontSize: {
      xs: '11px',
      sm: '13px',
      md: '14px',
      lg: '16px',
      xl: '24px',
    },
    fontWeight: {
      normal: '400',
      medium: '500',
      semibold: '600',
      bold: '700',
    },
    lineHeight: {
      tight: '1.3',
      normal: '1.5',
      relaxed: '1.75',
    },
  },
  transitions: {
    duration: {
      fast: '0.15s',
      normal: '0.2s',
      slow: '0.3s',
    },
    easing: {
      default: 'cubic-bezier(0.4, 0, 0.2, 1)',
      easeOut: 'cubic-bezier(0.23, 1.0, 0.32, 1.0)',
      easeInOut: 'ease-in-out',
    },
  },
  spacing: {
    xs: '4px',
    sm: '8px',
    md: '16px',
    lg: '24px',
    xl: '32px',
  },
}
