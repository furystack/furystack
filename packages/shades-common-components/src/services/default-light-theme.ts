import { defaultPalette } from './default-palette.js'
import type { Theme } from './theme-provider-service.js'

export const defaultLightTheme: Theme = {
  name: 'default-light-theme',
  palette: defaultPalette,
  text: {
    primary: 'rgba(0, 0, 0, 0.87)',
    secondary: 'rgba(0, 0, 0, 0.54)',
    disabled: 'rgba(0, 0, 0, 0.38)',
  },
  button: {
    active: 'rgba(0, 0, 0, 0.54)',
    hover: 'rgba(0, 0, 0, 0.04)',
    selected: 'rgba(0, 0, 0, 0.08)',
    disabled: 'rgba(0, 0, 0, 0.26)',
    disabledBackground: 'rgba(0, 0, 0, 0.12)',
  },
  background: {
    default: '#fafafa',
    paper: '#fff',
  },
  divider: 'rgba(0, 0, 0, 0.12)',
}
