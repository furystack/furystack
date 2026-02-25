import { sithPalette } from './sith-palette.js'
import type { Theme } from '../services/theme-provider-service.js'

const paperImageValue = `url("data:image/svg+xml;base64,${btoa(`<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40"><rect width="40" height="40" fill="none"/><line x1="0" y1="20" x2="20" y2="0" stroke="#cc2020" stroke-width="0.5" opacity="0.04"/><line x1="20" y1="40" x2="40" y2="20" stroke="#cc2020" stroke-width="0.5" opacity="0.04"/><line x1="0" y1="20" x2="20" y2="40" stroke="#cc2020" stroke-width="0.5" opacity="0.04"/><line x1="20" y1="0" x2="40" y2="20" stroke="#cc2020" stroke-width="0.5" opacity="0.04"/></svg>`)}")`

/**
 * Dark theme inspired by the Star Wars Sith Order.
 * Near-black backgrounds with a tiling red chevron pattern,
 * crimson accents, deep violet secondary, and bold typography.
 *
 * @remarks Recommended Google Font: Rajdhani
 */
export const sithTheme = {
  name: 'sith-theme',
  text: {
    primary: '#e0d8d0',
    secondary: 'rgba(224, 216, 208, 0.65)',
    disabled: 'rgba(224, 216, 208, 0.35)',
  },
  button: {
    active: '#cc2020',
    hover: 'rgba(204, 32, 32, 0.1)',
    selected: 'rgba(204, 32, 32, 0.18)',
    disabled: 'rgba(224, 216, 208, 0.3)',
    disabledBackground: 'rgba(224, 216, 208, 0.06)',
  },
  background: {
    default: '#0c0808',
    paper: '#161010',
    paperImage: paperImageValue,
  },
  palette: sithPalette,
  divider: 'rgba(204, 32, 32, 0.18)',
  action: {
    hoverBackground: 'rgba(204, 32, 32, 0.08)',
    selectedBackground: 'rgba(204, 32, 32, 0.14)',
    activeBackground: 'rgba(204, 32, 32, 0.22)',
    focusRing: '0 0 0 2px rgba(204, 32, 32, 0.5)',
    disabledOpacity: '0.4',
    backdrop: 'rgba(6, 4, 4, 0.9)',
    subtleBorder: 'rgba(204, 32, 32, 0.2)',
  },
  shape: {
    borderRadius: {
      xs: '1px',
      sm: '2px',
      md: '4px',
      lg: '6px',
      full: '50%',
    },
    borderWidth: '1px',
  },
  shadows: {
    none: 'none',
    sm: '0 1px 4px rgba(0, 0, 0, 0.5), 0 0 6px rgba(204, 32, 32, 0.08)',
    md: '0 4px 12px rgba(0, 0, 0, 0.6), 0 0 14px rgba(204, 32, 32, 0.12)',
    lg: '0 8px 24px rgba(0, 0, 0, 0.7), 0 0 22px rgba(204, 32, 32, 0.15)',
    xl: '0 12px 36px rgba(0, 0, 0, 0.8), 0 0 32px rgba(204, 32, 32, 0.18)',
  },
  typography: {
    fontFamily: "'Rajdhani', 'Segoe UI', 'Trebuchet MS', sans-serif",
    fontSize: {
      xs: '11px',
      sm: '13px',
      md: '14px',
      lg: '17px',
      xl: '24px',
      xxl: '30px',
      xxxl: '38px',
      xxxxl: '50px',
    },
    fontWeight: {
      normal: '400',
      medium: '500',
      semibold: '600',
      bold: '700',
    },
    lineHeight: {
      tight: '1.2',
      normal: '1.45',
      relaxed: '1.65',
    },
    letterSpacing: {
      tight: '-0.25px',
      dense: '0px',
      normal: '0.25px',
      wide: '0.75px',
      wider: '1.5px',
      widest: '2.5px',
    },
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
