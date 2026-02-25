import { neonRunnerPalette } from './neon-runner-palette.js'
import type { Theme } from '../services/theme-provider-service.js'

/**
 * Cyberpunk-inspired theme with dark backgrounds, neon accents,
 * monospace typography, and a hi-tech polished aesthetic.
 *
 * @remarks Recommended Google Font: Share Tech Mono
 */
export const neonRunnerTheme = {
  name: 'neon-runner-theme',
  text: {
    primary: '#e0f0ff',
    secondary: 'rgba(224, 240, 255, 0.65)',
    disabled: 'rgba(224, 240, 255, 0.35)',
  },
  button: {
    active: '#e0f0ff',
    hover: 'rgba(0, 240, 255, 0.1)',
    selected: 'rgba(0, 240, 255, 0.18)',
    disabled: 'rgba(224, 240, 255, 0.3)',
    disabledBackground: 'rgba(224, 240, 255, 0.06)',
  },
  background: {
    default: '#0a0e17',
    paper: '#111827',
    paperImage: '',
  },
  palette: neonRunnerPalette,
  divider: 'rgba(0, 240, 255, 0.15)',
  action: {
    hoverBackground: 'rgba(0, 240, 255, 0.08)',
    selectedBackground: 'rgba(0, 240, 255, 0.14)',
    activeBackground: 'rgba(0, 240, 255, 0.22)',
    focusRing: '0 0 0 2px rgba(0, 240, 255, 0.5)',
    disabledOpacity: '0.4',
    backdrop: 'rgba(4, 6, 14, 0.85)',
    subtleBorder: 'rgba(0, 240, 255, 0.2)',
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
    sm: '0 1px 4px rgba(0, 0, 0, 0.4), 0 0 6px rgba(0, 240, 255, 0.08)',
    md: '0 4px 12px rgba(0, 0, 0, 0.5), 0 0 12px rgba(0, 240, 255, 0.12)',
    lg: '0 8px 24px rgba(0, 0, 0, 0.6), 0 0 20px rgba(0, 240, 255, 0.15)',
    xl: '0 12px 36px rgba(0, 0, 0, 0.7), 0 0 30px rgba(0, 240, 255, 0.18)',
  },
  typography: {
    fontFamily: "'Share Tech Mono', 'Fira Code', 'JetBrains Mono', 'Courier New', monospace",
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
      normal: '1.55',
      relaxed: '1.75',
    },
    letterSpacing: {
      tight: '-0.25px',
      dense: '0px',
      normal: '0.5px',
      wide: '1px',
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
