import type { Palette } from '../services/theme-provider-service.js'

/**
 * Color palette inspired by the Star Wars Jedi Order.
 * Lightsaber blue primary, warm Tatooine sand secondary,
 * with calm, balanced tones for semantic colors.
 */
export const jediPalette: Palette = {
  primary: {
    light: '#7db8f0',
    lightContrast: '#000000',
    main: '#4a90d9',
    mainContrast: '#ffffff',
    dark: '#2a6ab0',
    darkContrast: '#ffffff',
  },
  secondary: {
    light: '#d8c8a0',
    lightContrast: '#000000',
    main: '#c4a86c',
    mainContrast: '#000000',
    dark: '#9a8450',
    darkContrast: '#000000',
  },
  error: {
    light: '#e87070',
    lightContrast: '#000000',
    main: '#d04848',
    mainContrast: '#ffffff',
    dark: '#a83030',
    darkContrast: '#ffffff',
  },
  warning: {
    light: '#e8c060',
    lightContrast: '#000000',
    main: '#d4a830',
    mainContrast: '#000000',
    dark: '#a88418',
    darkContrast: '#000000',
  },
  success: {
    light: '#68b870',
    lightContrast: '#000000',
    main: '#48984c',
    mainContrast: '#ffffff',
    dark: '#307834',
    darkContrast: '#ffffff',
  },
  info: {
    light: '#68a8e0',
    lightContrast: '#000000',
    main: '#4088c4',
    mainContrast: '#ffffff',
    dark: '#28689e',
    darkContrast: '#ffffff',
  },
}
