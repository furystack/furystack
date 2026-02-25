import type { Palette } from '../services/theme-provider-service.js'

/**
 * Color palette inspired by Skyrim and the Elder Scrolls.
 * Muted gold-amber primary, steel blue secondary,
 * with desaturated Nordic tones for semantic colors.
 */
export const dragonbornPalette: Palette = {
  primary: {
    light: '#dcc070',
    lightContrast: '#000000',
    main: '#c8a050',
    mainContrast: '#000000',
    dark: '#987830',
    darkContrast: '#ffffff',
  },
  secondary: {
    light: '#7a9cbe',
    lightContrast: '#000000',
    main: '#5a7c9e',
    mainContrast: '#ffffff',
    dark: '#3a5c7e',
    darkContrast: '#ffffff',
  },
  error: {
    light: '#c06060',
    lightContrast: '#000000',
    main: '#a04040',
    mainContrast: '#ffffff',
    dark: '#702828',
    darkContrast: '#ffffff',
  },
  warning: {
    light: '#d4a050',
    lightContrast: '#000000',
    main: '#b88030',
    mainContrast: '#000000',
    dark: '#886020',
    darkContrast: '#ffffff',
  },
  success: {
    light: '#6a9a60',
    lightContrast: '#000000',
    main: '#4a7a40',
    mainContrast: '#ffffff',
    dark: '#305a28',
    darkContrast: '#ffffff',
  },
  info: {
    light: '#6a8aaa',
    lightContrast: '#000000',
    main: '#4a6a8a',
    mainContrast: '#ffffff',
    dark: '#304a6a',
    darkContrast: '#ffffff',
  },
}
