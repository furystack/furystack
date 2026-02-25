import type { Palette } from '../services/theme-provider-service.js'

/**
 * Color palette inspired by the Warcraft 1 Human faction UI.
 * Gold as the primary brand color, Alliance royal blue as secondary,
 * with warm medieval tones for semantic colors.
 */
export const paladinPalette: Palette = {
  primary: {
    light: '#dcc06e',
    lightContrast: '#000000',
    main: '#c8a84e',
    mainContrast: '#000000',
    dark: '#9a7e30',
    darkContrast: '#ffffff',
  },
  secondary: {
    light: '#4a7dc4',
    lightContrast: '#ffffff',
    main: '#2a5daa',
    mainContrast: '#ffffff',
    dark: '#1a3d7a',
    darkContrast: '#ffffff',
  },
  error: {
    light: '#d45050',
    lightContrast: '#000000',
    main: '#c03030',
    mainContrast: '#ffffff',
    dark: '#8a2020',
    darkContrast: '#ffffff',
  },
  warning: {
    light: '#e4a64a',
    lightContrast: '#000000',
    main: '#d4862a',
    mainContrast: '#000000',
    dark: '#a46420',
    darkContrast: '#ffffff',
  },
  success: {
    light: '#6aac5c',
    lightContrast: '#000000',
    main: '#4a8c3c',
    mainContrast: '#000000',
    dark: '#346a2a',
    darkContrast: '#ffffff',
  },
  info: {
    light: '#7aaad4',
    lightContrast: '#000000',
    main: '#5a8ab4',
    mainContrast: '#000000',
    dark: '#3a6a94',
    darkContrast: '#ffffff',
  },
}
