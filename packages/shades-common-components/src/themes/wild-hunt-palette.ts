import type { Palette } from '../services/theme-provider-service.js'

/**
 * Color palette inspired by The Witcher 3: Wild Hunt.
 * Silver-steel primary evoking Geralt's witcher medallion and silver sword,
 * deep crimson secondary channeling the Wild Hunt's spectral aura and the Igni sign.
 */
export const wildHuntPalette: Palette = {
  primary: {
    light: '#d0d4da',
    lightContrast: '#000000',
    main: '#a8b0bc',
    mainContrast: '#000000',
    dark: '#78828e',
    darkContrast: '#ffffff',
  },
  secondary: {
    light: '#d44a4a',
    lightContrast: '#ffffff',
    main: '#a82020',
    mainContrast: '#ffffff',
    dark: '#7a1010',
    darkContrast: '#ffffff',
  },
  error: {
    light: '#cf5050',
    lightContrast: '#000000',
    main: '#b03030',
    mainContrast: '#ffffff',
    dark: '#801818',
    darkContrast: '#ffffff',
  },
  warning: {
    light: '#c89848',
    lightContrast: '#000000',
    main: '#a87828',
    mainContrast: '#000000',
    dark: '#785818',
    darkContrast: '#ffffff',
  },
  success: {
    light: '#5a8a50',
    lightContrast: '#000000',
    main: '#3a6a30',
    mainContrast: '#ffffff',
    dark: '#284a20',
    darkContrast: '#ffffff',
  },
  info: {
    light: '#6888a8',
    lightContrast: '#000000',
    main: '#486888',
    mainContrast: '#ffffff',
    dark: '#2a4a68',
    darkContrast: '#ffffff',
  },
}
