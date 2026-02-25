import type { Palette } from '../services/theme-provider-service.js'

/**
 * Color palette inspired by Assassin's Creed II / Brotherhood.
 * Deep Assassin red primary, Renaissance charcoal secondary,
 * with warm, elegant tones for semantic colors.
 */
export const auditorePalette: Palette = {
  primary: {
    light: '#d03050',
    lightContrast: '#ffffff',
    main: '#b01030',
    mainContrast: '#ffffff',
    dark: '#880820',
    darkContrast: '#ffffff',
  },
  secondary: {
    light: '#606068',
    lightContrast: '#ffffff',
    main: '#3a3a44',
    mainContrast: '#ffffff',
    dark: '#24242c',
    darkContrast: '#ffffff',
  },
  error: {
    light: '#e05050',
    lightContrast: '#ffffff',
    main: '#c42020',
    mainContrast: '#ffffff',
    dark: '#901818',
    darkContrast: '#ffffff',
  },
  warning: {
    light: '#e0a030',
    lightContrast: '#000000',
    main: '#c48820',
    mainContrast: '#000000',
    dark: '#946818',
    darkContrast: '#ffffff',
  },
  success: {
    light: '#50a050',
    lightContrast: '#ffffff',
    main: '#2e802e',
    mainContrast: '#ffffff',
    dark: '#1c601c',
    darkContrast: '#ffffff',
  },
  info: {
    light: '#5090c0',
    lightContrast: '#ffffff',
    main: '#3070a0',
    mainContrast: '#ffffff',
    dark: '#205080',
    darkContrast: '#ffffff',
  },
}
