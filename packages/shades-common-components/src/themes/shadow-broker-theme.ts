import { shadowBrokerPalette } from './shadow-broker-palette.js'
import type { Theme } from '../services/theme-provider-service.js'

/**
 * Theme inspired by the Mass Effect universe.
 * Deep space blue-black backgrounds, omni-tool orange primary,
 * tech blue secondary, sleek futuristic sans-serif typography.
 *
 * @remarks Recommended Google Font: Rajdhani
 */
export const shadowBrokerTheme = {
  name: 'shadow-broker-theme',
  text: {
    primary: '#e8eaf0',
    secondary: 'rgba(232, 234, 240, 0.65)',
    disabled: 'rgba(232, 234, 240, 0.35)',
  },
  button: {
    active: '#e8eaf0',
    hover: 'rgba(255, 109, 0, 0.1)',
    selected: 'rgba(255, 109, 0, 0.18)',
    disabled: 'rgba(232, 234, 240, 0.3)',
    disabledBackground: 'rgba(232, 234, 240, 0.06)',
  },
  background: {
    default: '#080c18',
    paper: '#101828',
    paperImage: '',
  },
  palette: shadowBrokerPalette,
  divider: 'rgba(48, 128, 224, 0.18)',
  action: {
    hoverBackground: 'rgba(255, 109, 0, 0.08)',
    selectedBackground: 'rgba(255, 109, 0, 0.14)',
    activeBackground: 'rgba(255, 109, 0, 0.22)',
    focusRing: '0 0 0 2px rgba(255, 109, 0, 0.5)',
    focusOutline: '2px solid #ff6d00',
    disabledOpacity: '0.4',
    backdrop: 'rgba(4, 6, 14, 0.85)',
    subtleBorder: 'rgba(48, 128, 224, 0.2)',
  },
  shape: {
    borderRadius: {
      xs: '2px',
      sm: '4px',
      md: '6px',
      lg: '8px',
      full: '50%',
    },
    borderWidth: '1px',
  },
  shadows: {
    none: 'none',
    sm: '0 1px 4px rgba(0, 0, 0, 0.4), 0 0 6px rgba(48, 128, 224, 0.06)',
    md: '0 4px 12px rgba(0, 0, 0, 0.5), 0 0 12px rgba(48, 128, 224, 0.1)',
    lg: '0 8px 24px rgba(0, 0, 0, 0.6), 0 0 20px rgba(48, 128, 224, 0.12)',
    xl: '0 12px 36px rgba(0, 0, 0, 0.7), 0 0 30px rgba(48, 128, 224, 0.15)',
  },
  typography: {
    fontFamily: "Rajdhani, 'Segoe UI', sans-serif",
    fontSize: {
      xs: '12px',
      sm: '14px',
      md: '16px',
      lg: '18px',
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
      tight: '1.25',
      normal: '1.5',
      relaxed: '1.75',
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
      fast: '0.12s',
      normal: '0.2s',
      slow: '0.3s',
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
