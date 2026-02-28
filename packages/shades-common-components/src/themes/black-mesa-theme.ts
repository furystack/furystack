import { blackMesaPalette } from './black-mesa-palette.js'
import type { Theme } from '../services/theme-provider-service.js'

const paperImageValue = `url("data:image/svg+xml;base64,${btoa(`<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40"><rect width="40" height="40" fill="none"/><line x1="0" y1="0" x2="40" y2="40" stroke="#ff8c00" stroke-width="0.5" opacity="0.04"/><line x1="40" y1="0" x2="0" y2="40" stroke="#ff8c00" stroke-width="0.5" opacity="0.04"/></svg>`)}")`

/**
 * Theme inspired by the Half-Life Black Mesa Research Facility.
 * Dark industrial backgrounds, HEV-suit Lambda orange primary,
 * teal secondary accents, and a utilitarian condensed sans-serif typeface.
 *
 * @remarks Recommended Google Font: Roboto Condensed
 */
export const blackMesaTheme = {
  name: 'black-mesa-theme',
  text: {
    primary: '#e8e0d8',
    secondary: 'rgba(232, 224, 216, 0.65)',
    disabled: 'rgba(232, 224, 216, 0.35)',
  },
  button: {
    active: '#ff8c00',
    hover: 'rgba(255, 140, 0, 0.1)',
    selected: 'rgba(255, 140, 0, 0.18)',
    disabled: 'rgba(232, 224, 216, 0.3)',
    disabledBackground: 'rgba(232, 224, 216, 0.06)',
  },
  background: {
    default: '#1a1a1e',
    paper: '#222228',
    paperImage: paperImageValue,
  },
  palette: blackMesaPalette,
  divider: 'rgba(255, 140, 0, 0.15)',
  action: {
    hoverBackground: 'rgba(255, 140, 0, 0.08)',
    selectedBackground: 'rgba(255, 140, 0, 0.14)',
    activeBackground: 'rgba(255, 140, 0, 0.22)',
    focusRing: '0 0 0 2px rgba(255, 140, 0, 0.5)',
    disabledOpacity: '0.4',
    backdrop: 'rgba(10, 10, 12, 0.88)',
    subtleBorder: 'rgba(255, 140, 0, 0.18)',
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
    sm: '0 1px 4px rgba(0, 0, 0, 0.5), 0 0 6px rgba(255, 140, 0, 0.05)',
    md: '0 4px 12px rgba(0, 0, 0, 0.6), 0 0 12px rgba(255, 140, 0, 0.08)',
    lg: '0 8px 24px rgba(0, 0, 0, 0.7), 0 0 20px rgba(255, 140, 0, 0.1)',
    xl: '0 12px 36px rgba(0, 0, 0, 0.8), 0 0 30px rgba(255, 140, 0, 0.12)',
  },
  typography: {
    fontFamily: "'Roboto Condensed', 'Arial Narrow', 'Helvetica Neue', sans-serif",
    fontSize: {
      xs: '11px',
      sm: '12px',
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
      tight: '1.25',
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
