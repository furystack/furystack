import { wildHuntPalette } from './wild-hunt-palette.js'
import type { Theme } from '../services/theme-provider-service.js'

const paperImageValue = `url("data:image/svg+xml;base64,${btoa(`<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200"><filter id="t" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency="0.04" numOctaves="5" stitchTiles="stitch" result="n"/><feDiffuseLighting in="n" lighting-color="#606878" surfaceScale="3"><feDistantLight azimuth="200" elevation="40"/></feDiffuseLighting></filter><rect width="200" height="200" filter="url(#t)" opacity="0.1"/></svg>`)}")`

/**
 * Theme inspired by The Witcher 3: Wild Hunt.
 * Dark, stormy backgrounds with silver-steel accents and crimson highlights,
 * evoking the atmosphere of the Continent, the witcher medallion, and the Wild Hunt's spectral aura.
 *
 * @remarks Recommended Google Font: Cinzel
 */
export const wildHuntTheme = {
  name: 'wild-hunt-theme',
  text: {
    primary: '#d4d8de',
    secondary: 'rgba(212, 216, 222, 0.65)',
    disabled: 'rgba(212, 216, 222, 0.35)',
  },
  button: {
    active: '#d4d8de',
    hover: 'rgba(168, 176, 188, 0.1)',
    selected: 'rgba(168, 176, 188, 0.16)',
    disabled: 'rgba(212, 216, 222, 0.3)',
    disabledBackground: 'rgba(212, 216, 222, 0.06)',
  },
  background: {
    default: '#12151a',
    paper: '#1c2028',
    paperImage: paperImageValue,
  },
  palette: wildHuntPalette,
  divider: 'rgba(168, 176, 188, 0.18)',
  action: {
    hoverBackground: 'rgba(168, 32, 32, 0.06)',
    selectedBackground: 'rgba(168, 32, 32, 0.14)',
    activeBackground: 'rgba(168, 32, 32, 0.22)',
    focusRing: '0 0 0 3px rgba(168, 176, 188, 0.3)',
    disabledOpacity: '0.5',
    backdrop: 'rgba(6, 8, 12, 0.85)',
    subtleBorder: 'rgba(168, 176, 188, 0.2)',
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
    sm: '0 1px 3px rgba(0, 0, 0, 0.4), 0 1px 2px rgba(0, 0, 0, 0.3)',
    md: '0 4px 12px rgba(0, 0, 0, 0.45), 0 2px 4px rgba(0, 0, 0, 0.3)',
    lg: '0 8px 24px rgba(0, 0, 0, 0.5), 0 4px 8px rgba(0, 0, 0, 0.35)',
    xl: '0 12px 32px rgba(0, 0, 0, 0.6), 0 6px 12px rgba(0, 0, 0, 0.4)',
  },
  typography: {
    fontFamily: "Cinzel, 'Palatino Linotype', Palatino, 'Book Antiqua', serif",
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
      normal: '0.25px',
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
