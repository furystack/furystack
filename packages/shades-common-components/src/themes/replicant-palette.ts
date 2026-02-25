import type { Palette } from '../services/theme-provider-service.js'

/**
 * Color palette inspired by Blade Runner's noir aesthetic.
 * Warm amber primary, cold teal secondary,
 * with moody, rain-washed tones for semantic colors.
 */
export const replicantPalette: Palette = {
  primary: {
    light: '#ffc050',
    lightContrast: '#000000',
    main: '#ff9e00',
    mainContrast: '#000000',
    dark: '#c47800',
    darkContrast: '#000000',
  },
  secondary: {
    light: '#50b0b8',
    lightContrast: '#000000',
    main: '#2a8a94',
    mainContrast: '#ffffff',
    dark: '#1a6870',
    darkContrast: '#ffffff',
  },
  error: {
    light: '#d45858',
    lightContrast: '#000000',
    main: '#b83030',
    mainContrast: '#ffffff',
    dark: '#882020',
    darkContrast: '#ffffff',
  },
  warning: {
    light: '#e0a840',
    lightContrast: '#000000',
    main: '#c48c20',
    mainContrast: '#000000',
    dark: '#946818',
    darkContrast: '#ffffff',
  },
  success: {
    light: '#50a878',
    lightContrast: '#000000',
    main: '#308858',
    mainContrast: '#ffffff',
    dark: '#206840',
    darkContrast: '#ffffff',
  },
  info: {
    light: '#60a0c0',
    lightContrast: '#000000',
    main: '#4080a0',
    mainContrast: '#ffffff',
    dark: '#286080',
    darkContrast: '#ffffff',
  },
}
