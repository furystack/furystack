import { dragonbornPalette } from './dragonborn-palette.js'
import type { Theme } from '../services/theme-provider-service.js'

const paperImageValue = `url("data:image/svg+xml;base64,${btoa(`<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200"><filter id="t" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency="0.06" numOctaves="6" stitchTiles="stitch" result="n"/><feDiffuseLighting in="n" lighting-color="#8a9aaa" surfaceScale="2"><feDistantLight azimuth="45" elevation="60"/></feDiffuseLighting></filter><rect width="200" height="200" filter="url(#t)" opacity="0.12"/></svg>`)}")`

/**
 * Theme inspired by Skyrim and the Elder Scrolls.
 * Ashen grey backgrounds, muted gold primary, steel blue secondary,
 * medieval uncial typography for a cold Nordic fantasy feel.
 *
 * @remarks Recommended Google Font: MedievalSharp
 */
export const dragonbornTheme = {
  name: 'dragonborn-theme',
  text: {
    primary: '#dce0e4',
    secondary: 'rgba(220, 224, 228, 0.65)',
    disabled: 'rgba(220, 224, 228, 0.35)',
  },
  button: {
    active: '#dce0e4',
    hover: 'rgba(200, 160, 80, 0.1)',
    selected: 'rgba(200, 160, 80, 0.16)',
    disabled: 'rgba(220, 224, 228, 0.3)',
    disabledBackground: 'rgba(220, 224, 228, 0.06)',
  },
  background: {
    default: '#1a1c20',
    paper: '#24272c',
    paperImage: paperImageValue,
  },
  palette: dragonbornPalette,
  divider: 'rgba(90, 124, 158, 0.2)',
  action: {
    hoverBackground: 'rgba(200, 160, 80, 0.06)',
    selectedBackground: 'rgba(200, 160, 80, 0.14)',
    activeBackground: 'rgba(200, 160, 80, 0.22)',
    focusRing: '0 0 0 3px rgba(200, 160, 80, 0.3)',
    disabledOpacity: '0.5',
    backdrop: 'rgba(10, 12, 14, 0.8)',
    subtleBorder: 'rgba(140, 154, 170, 0.22)',
  },
  shape: {
    borderRadius: {
      xs: '0px',
      sm: '0px',
      md: '0px',
      lg: '0px',
      full: '50%',
    },
    borderWidth: '2px',
  },
  shadows: {
    none: 'none',
    sm: '0 1px 3px rgba(0, 0, 0, 0.3), 0 1px 2px rgba(0, 0, 0, 0.2)',
    md: '0 4px 12px rgba(0, 0, 0, 0.35), 0 2px 4px rgba(0, 0, 0, 0.25)',
    lg: '0 8px 24px rgba(0, 0, 0, 0.4), 0 4px 8px rgba(0, 0, 0, 0.3)',
    xl: '0 12px 32px rgba(0, 0, 0, 0.5), 0 6px 12px rgba(0, 0, 0, 0.35)',
  },
  typography: {
    fontFamily: "MedievalSharp, 'Palatino Linotype', Palatino, serif",
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
      medium: '400',
      semibold: '400',
      bold: '400',
    },
    lineHeight: {
      tight: '1.3',
      normal: '1.5',
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
