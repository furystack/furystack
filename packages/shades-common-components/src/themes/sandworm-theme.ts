import { sandwormPalette } from './sandworm-palette.js'
import type { Theme } from '../services/theme-provider-service.js'

const paperImageValue = `url("data:image/svg+xml;base64,${btoa(`<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200"><filter id="t" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency="0.08 0.03" numOctaves="5" stitchTiles="stitch" result="n"/><feDiffuseLighting in="n" lighting-color="#a08060" surfaceScale="2"><feDistantLight azimuth="45" elevation="55"/></feDiffuseLighting></filter><rect width="200" height="200" filter="url(#t)" opacity="0.1"/></svg>`)}")`

/**
 * Theme inspired by Frank Herbert's Dune universe.
 * Dark sandy backgrounds, spice-orange primary, "eyes of Ibad" blue secondary,
 * elegant serif typography for a warm, arid aesthetic.
 *
 * @remarks Recommended Google Font: Cormorant Garamond
 */
export const sandwormTheme = {
  name: 'sandworm-theme',
  text: {
    primary: '#e8dcc8',
    secondary: 'rgba(232, 220, 200, 0.65)',
    disabled: 'rgba(232, 220, 200, 0.35)',
  },
  button: {
    active: '#e8dcc8',
    hover: 'rgba(212, 130, 10, 0.1)',
    selected: 'rgba(212, 130, 10, 0.16)',
    disabled: 'rgba(232, 220, 200, 0.3)',
    disabledBackground: 'rgba(232, 220, 200, 0.06)',
  },
  background: {
    default: '#1a1610',
    paper: '#2a2218',
    paperImage: paperImageValue,
  },
  palette: sandwormPalette,
  divider: 'rgba(160, 128, 96, 0.25)',
  action: {
    hoverBackground: 'rgba(212, 130, 10, 0.07)',
    selectedBackground: 'rgba(212, 130, 10, 0.14)',
    activeBackground: 'rgba(212, 130, 10, 0.22)',
    focusRing: '0 0 0 3px rgba(212, 130, 10, 0.3)',
    disabledOpacity: '0.5',
    backdrop: 'rgba(12, 10, 6, 0.8)',
    subtleBorder: 'rgba(160, 128, 96, 0.25)',
  },
  shape: {
    borderRadius: {
      xs: '0px',
      sm: '2px',
      md: '3px',
      lg: '4px',
      full: '50%',
    },
    borderWidth: '1px',
  },
  shadows: {
    none: 'none',
    sm: '0 1px 3px rgba(0, 0, 0, 0.3), 0 1px 2px rgba(0, 0, 0, 0.2)',
    md: '0 4px 12px rgba(0, 0, 0, 0.35), 0 2px 4px rgba(0, 0, 0, 0.25)',
    lg: '0 8px 24px rgba(0, 0, 0, 0.4), 0 4px 8px rgba(0, 0, 0, 0.3)',
    xl: '0 12px 32px rgba(0, 0, 0, 0.5), 0 6px 12px rgba(0, 0, 0, 0.35)',
  },
  typography: {
    fontFamily: "'Cormorant Garamond', Garamond, 'Times New Roman', serif",
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
      normal: '0.25px',
      wide: '0.5px',
      wider: '1px',
      widest: '1.5px',
    },
  },
  transitions: {
    duration: {
      fast: '0.15s',
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
    blurSm: '2px',
    blurMd: '4px',
    blurLg: '8px',
    blurXl: '12px',
  },
} satisfies Theme
