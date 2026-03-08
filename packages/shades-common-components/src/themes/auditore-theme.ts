import { auditorePalette } from './auditore-palette.js'
import type { Theme } from '../services/theme-provider-service.js'

const paperImageValue = `url("data:image/svg+xml;base64,${btoa(`<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200"><filter id="t" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency="0.04" numOctaves="4" stitchTiles="stitch" result="n"/><feDiffuseLighting in="n" lighting-color="#d8c8b0" surfaceScale="2"><feDistantLight azimuth="45" elevation="60"/></feDiffuseLighting></filter><rect width="200" height="200" filter="url(#t)" opacity="0.08"/></svg>`)}")`

/**
 * Theme inspired by Assassin's Creed II / Brotherhood and Ezio Auditore.
 * Warm parchment-white backgrounds, deep Assassin red primary,
 * Renaissance charcoal secondary, elegant serif typography.
 *
 * @remarks Recommended Google Font: EB Garamond
 */
export const auditoreTheme = {
  name: 'auditore-theme',
  text: {
    primary: '#2a2028',
    secondary: 'rgba(42, 32, 40, 0.65)',
    disabled: 'rgba(42, 32, 40, 0.38)',
  },
  button: {
    active: '#2a2028',
    hover: 'rgba(176, 16, 48, 0.08)',
    selected: 'rgba(176, 16, 48, 0.14)',
    disabled: 'rgba(42, 32, 40, 0.3)',
    disabledBackground: 'rgba(42, 32, 40, 0.08)',
  },
  background: {
    default: '#faf8f5',
    paper: '#f0ece6',
    paperImage: paperImageValue,
  },
  palette: auditorePalette,
  divider: 'rgba(42, 32, 40, 0.12)',
  action: {
    hoverBackground: 'rgba(176, 16, 48, 0.06)',
    selectedBackground: 'rgba(176, 16, 48, 0.1)',
    activeBackground: 'rgba(176, 16, 48, 0.16)',
    focusRing: '0 0 0 3px rgba(176, 16, 48, 0.2)',
    focusOutline: '2px solid #b01030',
    disabledOpacity: '0.45',
    backdrop: 'rgba(42, 32, 40, 0.5)',
    subtleBorder: 'rgba(42, 32, 40, 0.15)',
  },
  shape: {
    borderRadius: {
      xs: '2px',
      sm: '4px',
      md: '6px',
      lg: '8px',
      full: '50%',
    },
    borderWidth: '1px',
  },
  shadows: {
    none: 'none',
    sm: '0 1px 3px rgba(42, 32, 40, 0.08), 0 1px 2px rgba(42, 32, 40, 0.06)',
    md: '0 4px 12px rgba(42, 32, 40, 0.1), 0 2px 4px rgba(42, 32, 40, 0.08)',
    lg: '0 8px 24px rgba(42, 32, 40, 0.12), 0 4px 8px rgba(42, 32, 40, 0.1)',
    xl: '0 12px 32px rgba(42, 32, 40, 0.14), 0 6px 12px rgba(42, 32, 40, 0.1)',
  },
  typography: {
    fontFamily: "'EB Garamond', Garamond, 'Times New Roman', serif",
    fontSize: {
      xs: '12px',
      sm: '14px',
      md: '16px',
      lg: '18px',
      xl: '26px',
      xxl: '32px',
      xxxl: '40px',
      xxxxl: '52px',
    },
    fontWeight: {
      normal: '400',
      medium: '500',
      semibold: '600',
      bold: '700',
    },
    lineHeight: {
      tight: '1.3',
      normal: '1.55',
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
    blurSm: '2px',
    blurMd: '4px',
    blurLg: '8px',
    blurXl: '12px',
  },
} satisfies Theme
