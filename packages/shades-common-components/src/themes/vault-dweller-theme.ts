import { vaultDwellerPalette } from './vault-dweller-palette.js'
import type { Theme } from '../services/theme-provider-service.js'

const paperImageValue = `url("data:image/svg+xml;base64,${btoa(`<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200"><defs><pattern id="s" width="200" height="4" patternUnits="userSpaceOnUse"><rect width="200" height="1" fill="#30ff50" opacity="0.04"/></pattern></defs><rect width="200" height="200" fill="url(#s)"/></svg>`)}")`

/**
 * Theme inspired by the Fallout Pip-Boy terminal interface.
 * Black background, phosphor green primary, amber secondary,
 * pixel-style monospace typography and CRT scanline texture.
 *
 * @remarks Recommended Google Font: VT323
 */
export const vaultDwellerTheme = {
  name: 'vault-dweller-theme',
  text: {
    primary: '#30ff50',
    secondary: 'rgba(48, 255, 80, 0.65)',
    disabled: 'rgba(48, 255, 80, 0.35)',
  },
  button: {
    active: '#30ff50',
    hover: 'rgba(48, 255, 80, 0.1)',
    selected: 'rgba(48, 255, 80, 0.18)',
    disabled: 'rgba(48, 255, 80, 0.3)',
    disabledBackground: 'rgba(48, 255, 80, 0.06)',
  },
  background: {
    default: '#0c0c0c',
    paper: '#141414',
    paperImage: paperImageValue,
  },
  palette: vaultDwellerPalette,
  divider: 'rgba(48, 255, 80, 0.15)',
  action: {
    hoverBackground: 'rgba(48, 255, 80, 0.08)',
    selectedBackground: 'rgba(48, 255, 80, 0.14)',
    activeBackground: 'rgba(48, 255, 80, 0.22)',
    focusRing: '0 0 0 2px rgba(48, 255, 80, 0.5)',
    disabledOpacity: '0.4',
    backdrop: 'rgba(0, 0, 0, 0.85)',
    subtleBorder: 'rgba(48, 255, 80, 0.2)',
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
    sm: '0 1px 4px rgba(0, 0, 0, 0.5), 0 0 6px rgba(48, 255, 80, 0.06)',
    md: '0 4px 12px rgba(0, 0, 0, 0.6), 0 0 12px rgba(48, 255, 80, 0.1)',
    lg: '0 8px 24px rgba(0, 0, 0, 0.7), 0 0 20px rgba(48, 255, 80, 0.12)',
    xl: '0 12px 36px rgba(0, 0, 0, 0.8), 0 0 30px rgba(48, 255, 80, 0.15)',
  },
  typography: {
    fontFamily: "VT323, 'Courier New', monospace",
    fontSize: {
      xs: '13px',
      sm: '15px',
      md: '17px',
      lg: '19px',
      xl: '26px',
      xxl: '32px',
      xxxl: '40px',
      xxxxl: '52px',
    },
    fontWeight: {
      normal: '400',
      medium: '400',
      semibold: '400',
      bold: '400',
    },
    lineHeight: {
      tight: '1.2',
      normal: '1.4',
      relaxed: '1.6',
    },
    letterSpacing: {
      tight: '0px',
      dense: '0.25px',
      normal: '0.5px',
      wide: '1px',
      wider: '1.5px',
      widest: '2.5px',
    },
    textShadow: 'none',
  },
  transitions: {
    duration: {
      fast: '0.1s',
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
