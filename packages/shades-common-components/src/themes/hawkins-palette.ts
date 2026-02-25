import type { Palette } from '../services/theme-provider-service.js'

/**
 * Color palette inspired by Stranger Things and the town of Hawkins, Indiana.
 * Christmas-light red primary, eerie Upside Down teal secondary,
 * with warm, desaturated 80s tones for semantic colors.
 */
export const hawkinsPalette: Palette = {
  primary: {
    light: '#e05858',
    lightContrast: '#000000',
    main: '#cc3333',
    mainContrast: '#ffffff',
    dark: '#961e1e',
    darkContrast: '#ffffff',
  },
  secondary: {
    light: '#5ea8a8',
    lightContrast: '#000000',
    main: '#3a8888',
    mainContrast: '#ffffff',
    dark: '#246666',
    darkContrast: '#ffffff',
  },
  error: {
    light: '#d85050',
    lightContrast: '#000000',
    main: '#b83030',
    mainContrast: '#ffffff',
    dark: '#881c1c',
    darkContrast: '#ffffff',
  },
  warning: {
    light: '#d4a048',
    lightContrast: '#000000',
    main: '#b88028',
    mainContrast: '#000000',
    dark: '#8c6018',
    darkContrast: '#ffffff',
  },
  success: {
    light: '#5a9860',
    lightContrast: '#000000',
    main: '#3c7842',
    mainContrast: '#ffffff',
    dark: '#285a2e',
    darkContrast: '#ffffff',
  },
  info: {
    light: '#5888a8',
    lightContrast: '#000000',
    main: '#3c6888',
    mainContrast: '#ffffff',
    dark: '#264a68',
    darkContrast: '#ffffff',
  },
}
