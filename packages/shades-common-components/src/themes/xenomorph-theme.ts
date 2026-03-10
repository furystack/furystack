import { xenomorphPalette } from './xenomorph-palette.js'
import type { Theme } from '../services/theme-provider-service.js'

/**
 * Dark industrial theme inspired by the Alien franchise.
 * Cold metallic backgrounds, acid green accents with toxic glow,
 * and a condensed monospace typeface evoking shipboard terminals.
 *
 * @remarks Recommended Google Font: IBM Plex Mono
 */
export const xenomorphTheme = {
  name: 'xenomorph-theme',
  text: {
    primary: '#c8ccd0',
    secondary: 'rgba(200, 204, 208, 0.65)',
    disabled: 'rgba(200, 204, 208, 0.35)',
  },
  button: {
    active: '#7ec850',
    hover: 'rgba(126, 200, 80, 0.1)',
    selected: 'rgba(126, 200, 80, 0.18)',
    disabled: 'rgba(200, 204, 208, 0.3)',
    disabledBackground: 'rgba(200, 204, 208, 0.06)',
  },
  background: {
    default: '#101214',
    paper: '#1a1c20',
    paperImage: '',
  },
  palette: xenomorphPalette,
  divider: 'rgba(126, 200, 80, 0.15)',
  action: {
    hoverBackground: 'rgba(126, 200, 80, 0.07)',
    selectedBackground: 'rgba(126, 200, 80, 0.13)',
    activeBackground: 'rgba(126, 200, 80, 0.2)',
    focusRing: '0 0 0 2px rgba(126, 200, 80, 0.45)',
    focusOutline: '2px solid #7ec850',
    disabledOpacity: '0.4',
    backdrop: 'rgba(6, 8, 10, 0.9)',
    subtleBorder: 'rgba(126, 200, 80, 0.18)',
  },
  shape: {
    borderRadius: {
      xs: '1px',
      sm: '2px',
      md: '3px',
      lg: '4px',
      full: '50%',
    },
    borderWidth: '1px',
  },
  shadows: {
    none: 'none',
    sm: '0 1px 4px rgba(0, 0, 0, 0.5), 0 0 4px rgba(126, 200, 80, 0.06)',
    md: '0 4px 12px rgba(0, 0, 0, 0.6), 0 0 10px rgba(126, 200, 80, 0.08)',
    lg: '0 8px 24px rgba(0, 0, 0, 0.7), 0 0 18px rgba(126, 200, 80, 0.1)',
    xl: '0 12px 36px rgba(0, 0, 0, 0.8), 0 0 28px rgba(126, 200, 80, 0.12)',
  },
  typography: {
    fontFamily: "'IBM Plex Mono', 'Fira Code', 'Consolas', monospace",
    fontSize: {
      xs: '10px',
      sm: '12px',
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
      normal: '1.5',
      relaxed: '1.7',
    },
    letterSpacing: {
      tight: '-0.25px',
      dense: '0px',
      normal: '0.25px',
      wide: '0.75px',
      wider: '1.25px',
      widest: '2px',
    },
    textShadow: 'none',
  },
  transitions: {
    duration: {
      fast: '0.1s',
      normal: '0.2s',
      slow: '0.35s',
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
    blurSm: '4px',
    blurMd: '8px',
    blurLg: '16px',
    blurXl: '24px',
  },
} satisfies Theme
