import { architectPalette } from './architect-palette.js'
import type { Theme } from '../services/theme-provider-service.js'

const paperImageValue = `url("data:image/svg+xml;base64,${btoa(`<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200"><defs><pattern id="d" width="12" height="200" patternUnits="userSpaceOnUse"><rect x="5" width="1" height="200" fill="#00ff41" opacity="0.03"/></pattern></defs><rect width="200" height="200" fill="url(#d)"/></svg>`)}")`

/**
 * Theme inspired by The Matrix.
 * Pure black backgrounds, iconic digital green primary, white secondary,
 * clean monospace typography and digital rain texture.
 *
 * @remarks Recommended Google Font: Source Code Pro
 */
export const architectTheme = {
  name: 'architect-theme',
  text: {
    primary: '#00ff41',
    secondary: 'rgba(0, 255, 65, 0.6)',
    disabled: 'rgba(0, 255, 65, 0.3)',
  },
  button: {
    active: '#00ff41',
    hover: 'rgba(0, 255, 65, 0.1)',
    selected: 'rgba(0, 255, 65, 0.18)',
    disabled: 'rgba(0, 255, 65, 0.25)',
    disabledBackground: 'rgba(0, 255, 65, 0.05)',
  },
  background: {
    default: '#000000',
    paper: '#0a0a0a',
    paperImage: paperImageValue,
  },
  palette: architectPalette,
  divider: 'rgba(0, 255, 65, 0.12)',
  action: {
    hoverBackground: 'rgba(0, 255, 65, 0.08)',
    selectedBackground: 'rgba(0, 255, 65, 0.14)',
    activeBackground: 'rgba(0, 255, 65, 0.22)',
    focusRing: '0 0 0 2px rgba(0, 255, 65, 0.5)',
    disabledOpacity: '0.35',
    backdrop: 'rgba(0, 0, 0, 0.9)',
    subtleBorder: 'rgba(0, 255, 65, 0.15)',
  },
  shape: {
    borderRadius: {
      xs: '0px',
      sm: '0px',
      md: '0px',
      lg: '0px',
      full: '50%',
    },
    borderWidth: '1px',
  },
  shadows: {
    none: 'none',
    sm: '0 1px 4px rgba(0, 0, 0, 0.6), 0 0 6px rgba(0, 255, 65, 0.05)',
    md: '0 4px 12px rgba(0, 0, 0, 0.7), 0 0 12px rgba(0, 255, 65, 0.08)',
    lg: '0 8px 24px rgba(0, 0, 0, 0.8), 0 0 20px rgba(0, 255, 65, 0.1)',
    xl: '0 12px 36px rgba(0, 0, 0, 0.9), 0 0 30px rgba(0, 255, 65, 0.12)',
  },
  typography: {
    fontFamily: "'Source Code Pro', 'Fira Code', 'Courier New', monospace",
    fontSize: {
      xs: '11px',
      sm: '12px',
      md: '14px',
      lg: '16px',
      xl: '22px',
      xxl: '28px',
      xxxl: '34px',
      xxxxl: '44px',
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
      tight: '0px',
      dense: '0.25px',
      normal: '0.5px',
      wide: '1px',
      wider: '1.5px',
      widest: '2.5px',
    },
  },
  transitions: {
    duration: {
      fast: '0.08s',
      normal: '0.15s',
      slow: '0.25s',
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
    blurSm: '2px',
    blurMd: '4px',
    blurLg: '8px',
    blurXl: '12px',
  },
} satisfies Theme
