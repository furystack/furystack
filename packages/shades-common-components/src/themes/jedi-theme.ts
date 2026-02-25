import { jediPalette } from './jedi-palette.js'
import type { Theme } from '../services/theme-provider-service.js'

const paperImageValue = `url("data:image/svg+xml;base64,${btoa(`<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48"><rect width="48" height="48" fill="none"/><circle cx="24" cy="24" r="16" fill="none" stroke="#4a90d9" stroke-width="0.4" opacity="0.06"/><circle cx="24" cy="24" r="8" fill="none" stroke="#4a90d9" stroke-width="0.3" opacity="0.04"/><line x1="24" y1="4" x2="24" y2="44" stroke="#4a90d9" stroke-width="0.3" opacity="0.03"/><line x1="4" y1="24" x2="44" y2="24" stroke="#4a90d9" stroke-width="0.3" opacity="0.03"/></svg>`)}")`

/**
 * Light theme inspired by the Star Wars Jedi Order.
 * Warm parchment backgrounds, lightsaber-blue accents with subtle glow,
 * and a clean sans-serif typeface evoking calm wisdom.
 *
 * @remarks Recommended Google Font: Nunito
 */
export const jediTheme = {
  name: 'jedi-theme',
  text: {
    primary: 'rgba(30, 26, 20, 0.9)',
    secondary: 'rgba(30, 26, 20, 0.6)',
    disabled: 'rgba(30, 26, 20, 0.35)',
  },
  button: {
    active: '#4a90d9',
    hover: 'rgba(74, 144, 217, 0.08)',
    selected: 'rgba(74, 144, 217, 0.14)',
    disabled: 'rgba(30, 26, 20, 0.26)',
    disabledBackground: 'rgba(30, 26, 20, 0.08)',
  },
  background: {
    default: '#f5f0e8',
    paper: '#faf6ef',
    paperImage: paperImageValue,
  },
  palette: jediPalette,
  divider: 'rgba(74, 144, 217, 0.15)',
  action: {
    hoverBackground: 'rgba(74, 144, 217, 0.06)',
    selectedBackground: 'rgba(74, 144, 217, 0.12)',
    activeBackground: 'rgba(74, 144, 217, 0.18)',
    focusRing: '0 0 0 3px rgba(74, 144, 217, 0.3)',
    disabledOpacity: '0.5',
    backdrop: 'rgba(30, 26, 20, 0.45)',
    subtleBorder: 'rgba(74, 144, 217, 0.18)',
  },
  shape: {
    borderRadius: {
      xs: '3px',
      sm: '5px',
      md: '8px',
      lg: '12px',
      full: '50%',
    },
    borderWidth: '0px',
  },
  shadows: {
    none: 'none',
    sm: '0 1px 3px rgba(0, 0, 0, 0.06), 0 0 4px rgba(74, 144, 217, 0.06)',
    md: '0 4px 12px rgba(0, 0, 0, 0.08), 0 0 12px rgba(74, 144, 217, 0.08)',
    lg: '0 8px 24px rgba(0, 0, 0, 0.1), 0 0 20px rgba(74, 144, 217, 0.1)',
    xl: '0 12px 32px rgba(0, 0, 0, 0.12), 0 0 30px rgba(74, 144, 217, 0.12)',
  },
  typography: {
    fontFamily: "'Nunito', 'Segoe UI', system-ui, -apple-system, sans-serif",
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
      tight: '-0.25px',
      dense: '0px',
      normal: '0.15px',
      wide: '0.4px',
      wider: '0.75px',
      widest: '1.5px',
    },
  },
  transitions: {
    duration: {
      fast: '0.15s',
      normal: '0.25s',
      slow: '0.35s',
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
