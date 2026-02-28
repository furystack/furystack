import { plumberPalette } from './plumber-palette.js'
import type { Theme } from '../services/theme-provider-service.js'

/**
 * Theme inspired by the Super Mario / Nintendo universe.
 * Bright white backgrounds, Nintendo red primary, Mario blue secondary,
 * rounded playful shapes, and friendly sans-serif typography.
 *
 * @remarks Recommended Google Font: Nunito
 */
export const plumberTheme = {
  name: 'plumber-theme',
  text: {
    primary: '#1a1a2e',
    secondary: 'rgba(26, 26, 46, 0.65)',
    disabled: 'rgba(26, 26, 46, 0.38)',
  },
  button: {
    active: '#1a1a2e',
    hover: 'rgba(230, 0, 18, 0.08)',
    selected: 'rgba(230, 0, 18, 0.14)',
    disabled: 'rgba(26, 26, 46, 0.3)',
    disabledBackground: 'rgba(26, 26, 46, 0.08)',
  },
  background: {
    default: '#f8f8ff',
    paper: '#ffffff',
    paperImage: '',
  },
  palette: plumberPalette,
  divider: 'rgba(26, 26, 46, 0.12)',
  action: {
    hoverBackground: 'rgba(230, 0, 18, 0.06)',
    selectedBackground: 'rgba(230, 0, 18, 0.1)',
    activeBackground: 'rgba(230, 0, 18, 0.16)',
    focusRing: '0 0 0 3px rgba(230, 0, 18, 0.25)',
    disabledOpacity: '0.45',
    backdrop: 'rgba(26, 26, 46, 0.5)',
    subtleBorder: 'rgba(26, 26, 46, 0.15)',
  },
  shape: {
    borderRadius: {
      xs: '6px',
      sm: '8px',
      md: '12px',
      lg: '16px',
      full: '50%',
    },
    borderWidth: '2px',
  },
  shadows: {
    none: 'none',
    sm: '0 1px 3px rgba(26, 26, 46, 0.1), 0 1px 2px rgba(26, 26, 46, 0.06)',
    md: '0 4px 12px rgba(26, 26, 46, 0.12), 0 2px 4px rgba(26, 26, 46, 0.08)',
    lg: '0 8px 24px rgba(26, 26, 46, 0.14), 0 4px 8px rgba(26, 26, 46, 0.1)',
    xl: '0 12px 32px rgba(26, 26, 46, 0.16), 0 6px 12px rgba(26, 26, 46, 0.12)',
  },
  typography: {
    fontFamily: "Nunito, 'Segoe UI', Tahoma, sans-serif",
    fontSize: {
      xs: '11px',
      sm: '13px',
      md: '15px',
      lg: '17px',
      xl: '24px',
      xxl: '30px',
      xxxl: '36px',
      xxxxl: '48px',
    },
    fontWeight: {
      normal: '400',
      medium: '600',
      semibold: '700',
      bold: '800',
    },
    lineHeight: {
      tight: '1.3',
      normal: '1.5',
      relaxed: '1.75',
    },
    letterSpacing: {
      tight: '-0.25px',
      dense: '0px',
      normal: '0.15px',
      wide: '0.5px',
      wider: '1px',
      widest: '1.5px',
    },
    textShadow: 'none',
  },
  transitions: {
    duration: {
      fast: '0.12s',
      normal: '0.2s',
      slow: '0.3s',
    },
    easing: {
      default: 'cubic-bezier(0.4, 0, 0.2, 1)',
      easeOut: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
      easeInOut: 'cubic-bezier(0.65, 0, 0.35, 1)',
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
    blurLg: '12px',
    blurXl: '16px',
  },
} satisfies Theme
