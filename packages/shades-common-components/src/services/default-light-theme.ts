import { defaultPalette } from './default-palette.js'
import type { Theme } from './theme-provider-service.js'

export const defaultLightTheme = {
  name: 'default-light-theme',
  palette: defaultPalette,
  text: {
    primary: 'rgba(0, 0, 0, 0.87)',
    secondary: 'rgba(0, 0, 0, 0.54)',
    disabled: 'rgba(0, 0, 0, 0.38)',
  },
  button: {
    active: 'rgba(0, 0, 0, 0.54)',
    hover: 'rgba(0, 0, 0, 0.04)',
    selected: 'rgba(0, 0, 0, 0.08)',
    disabled: 'rgba(0, 0, 0, 0.26)',
    disabledBackground: 'rgba(0, 0, 0, 0.12)',
  },
  background: {
    default: '#fafafa',
    paper: '#fff',
  },
  divider: 'rgba(0, 0, 0, 0.12)',
  action: {
    hoverBackground: 'rgba(128, 128, 128, 0.08)',
    selectedBackground: 'rgba(128, 128, 128, 0.15)',
    activeBackground: 'rgba(128, 128, 128, 0.2)',
    focusRing: '0 0 0 3px rgba(128, 128, 128, 0.15)',
    disabledOpacity: '0.6',
    backdrop: 'rgba(0, 0, 0, 0.5)',
    subtleBorder: 'rgba(128, 128, 128, 0.2)',
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
    sm: '0 1px 3px rgba(0, 0, 0, 0.08), 0 1px 2px rgba(0, 0, 0, 0.06)',
    md: '0 4px 12px rgba(0, 0, 0, 0.1), 0 2px 4px rgba(0, 0, 0, 0.08)',
    lg: '0 8px 24px rgba(0, 0, 0, 0.12), 0 4px 8px rgba(0, 0, 0, 0.08)',
    xl: '0 12px 32px rgba(0, 0, 0, 0.15), 0 6px 12px rgba(0, 0, 0, 0.1)',
  },
  typography: {
    fontFamily: 'system-ui, -apple-system, sans-serif',
    fontSize: {
      xs: '11px',
      sm: '13px',
      md: '14px',
      lg: '16px',
      xl: '24px',
      xxl: '30px',
      xxxl: '36px',
      xxxxl: '48px',
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
    letterSpacing: {
      tight: '-0.5px',
      dense: '-0.25px',
      normal: '0px',
      wide: '0.15px',
      wider: '0.5px',
      widest: '1.5px',
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
  zIndex: {
    drawer: '1000',
    appBar: '1100',
    modal: '1200',
    tooltip: '1300',
    dropdown: '1400',
  },
  effects: {
    blurSm: '4px',
    blurMd: '8px',
    blurLg: '15px',
    blurXl: '20px',
  },
} satisfies Theme
