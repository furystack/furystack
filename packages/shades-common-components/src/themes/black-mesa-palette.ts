import type { Palette } from '../services/theme-provider-service.js'

/**
 * Color palette inspired by the Half-Life Black Mesa Research Facility.
 * Lambda orange primary, teal-cyan secondary,
 * with industrial-toned semantic colors on dark backgrounds.
 */
export const blackMesaPalette: Palette = {
  primary: {
    light: '#ffad42',
    lightContrast: '#000000',
    main: '#ff8c00',
    mainContrast: '#000000',
    dark: '#c66d00',
    darkContrast: '#000000',
  },
  secondary: {
    light: '#62e8e8',
    lightContrast: '#000000',
    main: '#2ec4c4',
    mainContrast: '#000000',
    dark: '#1a9696',
    darkContrast: '#000000',
  },
  error: {
    light: '#ff5252',
    lightContrast: '#000000',
    main: '#d32f2f',
    mainContrast: '#ffffff',
    dark: '#9a0007',
    darkContrast: '#ffffff',
  },
  warning: {
    light: '#ffe04a',
    lightContrast: '#000000',
    main: '#ffc107',
    mainContrast: '#000000',
    dark: '#c79100',
    darkContrast: '#000000',
  },
  success: {
    light: '#60e080',
    lightContrast: '#000000',
    main: '#2e8b57',
    mainContrast: '#ffffff',
    dark: '#1b5e3a',
    darkContrast: '#ffffff',
  },
  info: {
    light: '#64b5f6',
    lightContrast: '#000000',
    main: '#3a8fd4',
    mainContrast: '#ffffff',
    dark: '#1a5c96',
    darkContrast: '#ffffff',
  },
}
