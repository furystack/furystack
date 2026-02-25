import { hawkinsPalette } from './hawkins-palette.js'
import type { Theme } from '../services/theme-provider-service.js'

const paperImageValue = `url("data:image/svg+xml;base64,${btoa(`<svg xmlns="http://www.w3.org/2000/svg" width="4" height="4"><rect width="4" height="4" fill="none"/><line x1="0" y1="3.5" x2="4" y2="3.5" stroke="#cc3333" stroke-width="0.5" opacity="0.03"/></svg>`)}")`

/**
 * Dark theme inspired by Stranger Things and the town of Hawkins, Indiana.
 * Warm dark backgrounds with a tiling CRT scanline pattern, Christmas-light red accents,
 * eerie teal secondary, and a retro rounded typeface evoking 80s nostalgia.
 *
 * @remarks Recommended Google Font: Quicksand
 */
export const hawkinsTheme = {
  name: 'hawkins-theme',
  text: {
    primary: '#e0d8d0',
    secondary: 'rgba(224, 216, 208, 0.62)',
    disabled: 'rgba(224, 216, 208, 0.34)',
  },
  button: {
    active: '#cc3333',
    hover: 'rgba(204, 51, 51, 0.1)',
    selected: 'rgba(204, 51, 51, 0.18)',
    disabled: 'rgba(224, 216, 208, 0.3)',
    disabledBackground: 'rgba(224, 216, 208, 0.06)',
  },
  background: {
    default: '#12100e',
    paper: '#1c1816',
    paperImage: paperImageValue,
  },
  palette: hawkinsPalette,
  divider: 'rgba(204, 51, 51, 0.15)',
  action: {
    hoverBackground: 'rgba(204, 51, 51, 0.08)',
    selectedBackground: 'rgba(204, 51, 51, 0.14)',
    activeBackground: 'rgba(204, 51, 51, 0.22)',
    focusRing: '0 0 0 2px rgba(204, 51, 51, 0.45)',
    disabledOpacity: '0.4',
    backdrop: 'rgba(8, 6, 4, 0.9)',
    subtleBorder: 'rgba(204, 51, 51, 0.18)',
  },
  shape: {
    borderRadius: {
      xs: '3px',
      sm: '5px',
      md: '8px',
      lg: '12px',
      full: '50%',
    },
    borderWidth: '1px',
  },
  shadows: {
    none: 'none',
    sm: '0 1px 4px rgba(0, 0, 0, 0.45), 0 0 5px rgba(204, 51, 51, 0.06)',
    md: '0 4px 12px rgba(0, 0, 0, 0.55), 0 0 12px rgba(204, 51, 51, 0.08)',
    lg: '0 8px 24px rgba(0, 0, 0, 0.65), 0 0 20px rgba(204, 51, 51, 0.1)',
    xl: '0 12px 36px rgba(0, 0, 0, 0.75), 0 0 30px rgba(204, 51, 51, 0.12)',
  },
  typography: {
    fontFamily: "'Quicksand', 'Nunito', 'Segoe UI', system-ui, sans-serif",
    fontSize: {
      xs: '11px',
      sm: '13px',
      md: '14px',
      lg: '16px',
      xl: '22px',
      xxl: '28px',
      xxxl: '36px',
      xxxxl: '46px',
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
      relaxed: '1.7',
    },
    letterSpacing: {
      tight: '-0.25px',
      dense: '0px',
      normal: '0.2px',
      wide: '0.5px',
      wider: '1px',
      widest: '2px',
    },
  },
  transitions: {
    duration: {
      fast: '0.12s',
      normal: '0.25s',
      slow: '0.4s',
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
    blurLg: '16px',
    blurXl: '24px',
  },
} satisfies Theme
