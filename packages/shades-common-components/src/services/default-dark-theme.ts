import { defaultPalette } from './default-palette'
import type { Theme } from './theme-provider-service'

export const defaultDarkTheme: Theme = {
  text: {
    primary: '#fff',
    secondary: 'rgba(255, 255, 255, 0.7)',
    disabled: 'rgba(255, 255, 255, 0.5)',
  },
  button: {
    active: '#fff',
    hover: 'rgba(255, 255, 255, 0.08)',
    selected: 'rgba(255, 255, 255, 0.16)',
    disabled: 'rgba(255, 255, 255, 0.3)',
    disabledBackground: 'rgba(255, 255, 255, 0.12)',
  },
  background: {
    default: '#303030',
    paper: '#424242',
  },
  palette: defaultPalette,
  divider: 'rgba(0, 0, 0, 0.12)',
}
