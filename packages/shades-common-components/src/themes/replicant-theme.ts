import { replicantPalette } from './replicant-palette.js'
import type { Theme } from '../services/theme-provider-service.js'

const paperImageValue = `url("data:image/svg+xml;base64,${btoa(`<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200"><filter id="r" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency="0.15 0.01" numOctaves="3" stitchTiles="stitch" result="n"/><feDiffuseLighting in="n" lighting-color="#405060" surfaceScale="1.5"><feDistantLight azimuth="90" elevation="70"/></feDiffuseLighting></filter><rect width="200" height="200" filter="url(#r)" opacity="0.08"/></svg>`)}")`

/**
 * Theme inspired by Blade Runner's rain-soaked noir aesthetic.
 * Dark blue-grey backgrounds, warm amber primary, cold teal secondary,
 * geometric futuristic typography with heavy atmospheric blur.
 *
 * @remarks Recommended Google Font: Orbitron
 */
export const replicantTheme = {
  name: 'replicant-theme',
  text: {
    primary: '#d8dce4',
    secondary: 'rgba(216, 220, 228, 0.6)',
    disabled: 'rgba(216, 220, 228, 0.35)',
  },
  button: {
    active: '#d8dce4',
    hover: 'rgba(255, 158, 0, 0.1)',
    selected: 'rgba(255, 158, 0, 0.16)',
    disabled: 'rgba(216, 220, 228, 0.3)',
    disabledBackground: 'rgba(216, 220, 228, 0.06)',
  },
  background: {
    default: '#0e1218',
    paper: '#181e28',
    paperImage: paperImageValue,
  },
  palette: replicantPalette,
  divider: 'rgba(42, 138, 148, 0.18)',
  action: {
    hoverBackground: 'rgba(255, 158, 0, 0.07)',
    selectedBackground: 'rgba(255, 158, 0, 0.13)',
    activeBackground: 'rgba(255, 158, 0, 0.2)',
    focusRing: '0 0 0 2px rgba(255, 158, 0, 0.4)',
    disabledOpacity: '0.4',
    backdrop: 'rgba(6, 8, 12, 0.85)',
    subtleBorder: 'rgba(42, 138, 148, 0.2)',
  },
  shape: {
    borderRadius: {
      xs: '2px',
      sm: '3px',
      md: '4px',
      lg: '6px',
      full: '50%',
    },
    borderWidth: '1px',
  },
  shadows: {
    none: 'none',
    sm: '0 1px 4px rgba(0, 0, 0, 0.4), 0 0 8px rgba(255, 158, 0, 0.05)',
    md: '0 4px 12px rgba(0, 0, 0, 0.5), 0 0 16px rgba(255, 158, 0, 0.08)',
    lg: '0 8px 24px rgba(0, 0, 0, 0.6), 0 0 24px rgba(255, 158, 0, 0.1)',
    xl: '0 12px 36px rgba(0, 0, 0, 0.7), 0 0 36px rgba(255, 158, 0, 0.12)',
  },
  typography: {
    fontFamily: "Orbitron, 'Segoe UI', sans-serif",
    fontSize: {
      xs: '10px',
      sm: '11px',
      md: '13px',
      lg: '15px',
      xl: '20px',
      xxl: '26px',
      xxxl: '32px',
      xxxxl: '42px',
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
      tight: '0px',
      dense: '0.5px',
      normal: '1px',
      wide: '1.5px',
      wider: '2px',
      widest: '3px',
    },
    textShadow: 'none',
  },
  transitions: {
    duration: {
      fast: '0.15s',
      normal: '0.25s',
      slow: '0.4s',
    },
    easing: {
      default: 'cubic-bezier(0.4, 0, 0.2, 1)',
      easeOut: 'cubic-bezier(0.16, 1.0, 0.3, 1.0)',
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
    blurSm: '6px',
    blurMd: '12px',
    blurLg: '20px',
    blurXl: '30px',
  },
} satisfies Theme
