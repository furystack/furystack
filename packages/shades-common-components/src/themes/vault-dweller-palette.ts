import type { Palette } from '../services/theme-provider-service.js'

/**
 * Color palette inspired by the Fallout Pip-Boy terminal.
 * Phosphor green primary, amber secondary,
 * with CRT-toned semantic colors on a dark background.
 */
export const vaultDwellerPalette: Palette = {
  primary: {
    light: '#66ff80',
    lightContrast: '#000000',
    main: '#30ff50',
    mainContrast: '#000000',
    dark: '#1abf3a',
    darkContrast: '#000000',
  },
  secondary: {
    light: '#ffc84a',
    lightContrast: '#000000',
    main: '#ffb000',
    mainContrast: '#000000',
    dark: '#c48800',
    darkContrast: '#000000',
  },
  error: {
    light: '#ff6060',
    lightContrast: '#000000',
    main: '#e03030',
    mainContrast: '#000000',
    dark: '#a02020',
    darkContrast: '#ffffff',
  },
  warning: {
    light: '#ffd060',
    lightContrast: '#000000',
    main: '#ffb820',
    mainContrast: '#000000',
    dark: '#c49000',
    darkContrast: '#000000',
  },
  success: {
    light: '#50ff78',
    lightContrast: '#000000',
    main: '#30e050',
    mainContrast: '#000000',
    dark: '#20a838',
    darkContrast: '#000000',
  },
  info: {
    light: '#60d8ff',
    lightContrast: '#000000',
    main: '#30b8e0',
    mainContrast: '#000000',
    dark: '#2090b0',
    darkContrast: '#000000',
  },
}
