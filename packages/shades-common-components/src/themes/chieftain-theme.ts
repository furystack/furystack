import type { Theme } from '../services/theme-provider-service.js'
import { chieftainPalette } from './chieftain-palette.js'

const paperImageValue = `url("data:image/svg+xml;base64,${btoa(`<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200"><filter id="t" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency="0.02 0.15" numOctaves="6" stitchTiles="stitch" result="n"/><feDiffuseLighting in="n" lighting-color="#6b4226" surfaceScale="3"><feDistantLight azimuth="45" elevation="50"/></feDiffuseLighting></filter><rect width="200" height="200" filter="url(#t)" opacity="0.2"/></svg>`)}")`

/**
 * Theme inspired by the Warcraft 1 Orc faction UI.
 * Dark brown wood backgrounds, parchment text, crimson primary accents,
 * angular shapes, and serif typography for a brutal medieval fantasy feel.
 *
 * @remarks Recommended Google Font: Silkscreen
 */
export const chieftainTheme = {
  name: 'chieftain-theme',
  text: {
    primary: '#f0e6d2',
    secondary: 'rgba(240, 230, 210, 0.7)',
    disabled: 'rgba(240, 230, 210, 0.4)',
  },
  button: {
    active: '#f0e6d2',
    hover: 'rgba(240, 230, 210, 0.08)',
    selected: 'rgba(240, 230, 210, 0.16)',
    disabled: 'rgba(240, 230, 210, 0.3)',
    disabledBackground: 'rgba(240, 230, 210, 0.08)',
  },
  background: {
    default: '#2a1f14',
    paper: '#342618',
    paperImage: paperImageValue,
  },
  palette: chieftainPalette,
  divider: 'rgba(107, 66, 38, 0.4)',
  action: {
    hoverBackground: 'rgba(240, 230, 210, 0.06)',
    selectedBackground: 'rgba(184, 48, 48, 0.15)',
    activeBackground: 'rgba(184, 48, 48, 0.22)',
    focusRing: '0 0 0 3px rgba(184, 48, 48, 0.3)',
    disabledOpacity: '0.5',
    backdrop: 'rgba(20, 14, 8, 0.8)',
    subtleBorder: 'rgba(160, 120, 80, 0.28)',
  },
  shape: {
    borderRadius: {
      xs: '0px',
      sm: '0px',
      md: '0px',
      lg: '0px',
      full: '50%',
    },
    borderWidth: '4px',
  },
  shadows: {
    none: 'none',
    sm: '0 1px 3px rgba(0, 0, 0, 0.3), 0 1px 2px rgba(0, 0, 0, 0.2)',
    md: '0 4px 12px rgba(0, 0, 0, 0.35), 0 2px 4px rgba(0, 0, 0, 0.25)',
    lg: '0 8px 24px rgba(0, 0, 0, 0.45), 0 4px 8px rgba(0, 0, 0, 0.3)',
    xl: '0 12px 32px rgba(0, 0, 0, 0.55), 0 6px 12px rgba(0, 0, 0, 0.35)',
  },
  typography: {
    fontFamily: 'Silkscreen, "Courier New", monospace',
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
      medium: '400',
      semibold: '700',
      bold: '700',
    },
    lineHeight: {
      tight: '1.3',
      normal: '1.5',
      relaxed: '1.75',
    },
    letterSpacing: {
      tight: '0px',
      dense: '0px',
      normal: '0.5px',
      wide: '1px',
      wider: '1.5px',
      widest: '2px',
    },
    textShadow: '4px 4px 0px rgba(0, 0, 0, 0.8)',
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
    blurSm: '2px',
    blurMd: '4px',
    blurLg: '8px',
    blurXl: '12px',
  },
} satisfies Theme
