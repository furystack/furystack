import type { Palette } from '../services/theme-provider-service.js'

/**
 * Color palette inspired by the Warcraft 1 Orc faction UI.
 * Crimson red as the primary brand color, swamp green as secondary,
 * with harsh warm tones for semantic colors.
 */
export const chieftainPalette: Palette = {
  primary: {
    light: '#d45050',
    lightContrast: '#000000',
    main: '#b83030',
    mainContrast: '#ffffff',
    dark: '#8a1c1c',
    darkContrast: '#ffffff',
  },
  secondary: {
    light: '#6a9a52',
    lightContrast: '#000000',
    main: '#4a7a34',
    mainContrast: '#ffffff',
    dark: '#2e5a1e',
    darkContrast: '#ffffff',
  },
  error: {
    light: '#e05858',
    lightContrast: '#000000',
    main: '#cc3333',
    mainContrast: '#ffffff',
    dark: '#992222',
    darkContrast: '#ffffff',
  },
  warning: {
    light: '#d4944a',
    lightContrast: '#000000',
    main: '#c07828',
    mainContrast: '#000000',
    dark: '#945a18',
    darkContrast: '#ffffff',
  },
  success: {
    light: '#78a856',
    lightContrast: '#000000',
    main: '#5a8838',
    mainContrast: '#000000',
    dark: '#3e6824',
    darkContrast: '#ffffff',
  },
  info: {
    light: '#8a9ab0',
    lightContrast: '#000000',
    main: '#6a7a96',
    mainContrast: '#000000',
    dark: '#4a5a76',
    darkContrast: '#ffffff',
  },
}
