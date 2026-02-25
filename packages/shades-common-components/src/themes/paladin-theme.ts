import { paladinPalette } from './paladin-palette.js'
import type { Theme } from '../services/theme-provider-service.js'

const paperImageValue = `url("data:image/svg+xml;base64,${btoa(`<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200"><filter id="t" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency="0.04" numOctaves="5" stitchTiles="stitch" result="n"/><feDiffuseLighting in="n" lighting-color="#667" surfaceScale="3"><feDistantLight azimuth="45" elevation="55"/></feDiffuseLighting></filter><rect width="200" height="200" filter="url(#t)" opacity="0.18"/></svg>`)}")`

/**
 * Theme inspired by the Warcraft 1 Human faction UI.
 * Cold dark stone backgrounds, white text, gold primary accents,
 * angular shapes, and serif typography for a medieval fantasy feel.
 *
 * @remarks Recommended Google Font: Cinzel
 */
export const paladinTheme = {
  name: 'paladin-theme',
  text: {
    primary: '#ffffff',
    secondary: 'rgba(255, 255, 255, 0.7)',
    disabled: 'rgba(255, 255, 255, 0.4)',
  },
  button: {
    active: '#ffffff',
    hover: 'rgba(255, 255, 255, 0.08)',
    selected: 'rgba(255, 255, 255, 0.16)',
    disabled: 'rgba(255, 255, 255, 0.3)',
    disabledBackground: 'rgba(255, 255, 255, 0.08)',
  },
  background: {
    default: '#1c2126',
    paper: '#282e34',
    paperImage: paperImageValue,
  },
  palette: paladinPalette,
  divider: 'rgba(80, 88, 96, 0.3)',
  action: {
    hoverBackground: 'rgba(255, 255, 255, 0.06)',
    selectedBackground: 'rgba(200, 168, 78, 0.15)',
    activeBackground: 'rgba(200, 168, 78, 0.22)',
    focusRing: '0 0 0 3px rgba(200, 168, 78, 0.3)',
    disabledOpacity: '0.5',
    backdrop: 'rgba(14, 18, 22, 0.8)',
    subtleBorder: 'rgba(180, 192, 205, 0.28)',
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
    sm: '0 1px 3px rgba(0, 0, 0, 0.25), 0 1px 2px rgba(0, 0, 0, 0.18)',
    md: '0 4px 12px rgba(0, 0, 0, 0.3), 0 2px 4px rgba(0, 0, 0, 0.22)',
    lg: '0 8px 24px rgba(0, 0, 0, 0.4), 0 4px 8px rgba(0, 0, 0, 0.25)',
    xl: '0 12px 32px rgba(0, 0, 0, 0.5), 0 6px 12px rgba(0, 0, 0, 0.3)',
  },
  typography: {
    fontFamily: 'Cinzel, Palatino, "Palatino Linotype", "Book Antiqua", Georgia, serif',
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
      wide: '0.25px',
      wider: '0.75px',
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
    blurSm: '2px',
    blurMd: '4px',
    blurLg: '8px',
    blurXl: '12px',
  },
} satisfies Theme
