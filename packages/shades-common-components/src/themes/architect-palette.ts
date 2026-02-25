import type { Palette } from '../services/theme-provider-service.js'

/**
 * Color palette inspired by The Matrix.
 * Digital green primary, white secondary,
 * with monochrome-green tones for semantic colors.
 */
export const architectPalette: Palette = {
  primary: {
    light: '#50ff70',
    lightContrast: '#000000',
    main: '#00ff41',
    mainContrast: '#000000',
    dark: '#00c430',
    darkContrast: '#000000',
  },
  secondary: {
    light: '#e0e0e0',
    lightContrast: '#000000',
    main: '#c0c0c0',
    mainContrast: '#000000',
    dark: '#909090',
    darkContrast: '#000000',
  },
  error: {
    light: '#ff5050',
    lightContrast: '#000000',
    main: '#e02020',
    mainContrast: '#000000',
    dark: '#a81818',
    darkContrast: '#ffffff',
  },
  warning: {
    light: '#e0c040',
    lightContrast: '#000000',
    main: '#c4a020',
    mainContrast: '#000000',
    dark: '#948018',
    darkContrast: '#ffffff',
  },
  success: {
    light: '#40e060',
    lightContrast: '#000000',
    main: '#20c040',
    mainContrast: '#000000',
    dark: '#109028',
    darkContrast: '#ffffff',
  },
  info: {
    light: '#40c0e0',
    lightContrast: '#000000',
    main: '#20a0c0',
    mainContrast: '#000000',
    dark: '#108090',
    darkContrast: '#ffffff',
  },
}
