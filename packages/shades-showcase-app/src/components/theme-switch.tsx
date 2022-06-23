import { createComponent, Shade } from '@furystack/shades'
import {
  Button,
  ButtonProps,
  defaultDarkTheme,
  defaultLightTheme,
  Theme,
  ThemeProviderService,
} from '@furystack/shades-common-components'

export const ThemeSwitch = Shade<Omit<ButtonProps, 'onclick'>, { theme: Theme }>({
  shadowDomName: 'theme-switch',
  getInitialState: ({ injector }) => ({
    theme: injector.getInstance(ThemeProviderService).theme.getValue(),
  }),
  resources: ({ injector, updateState }) => {
    return [injector.getInstance(ThemeProviderService).theme.subscribe((theme) => updateState({ theme }))]
  },
  render: ({ props, injector, getState }) => {
    const themeProvider = injector.getInstance(ThemeProviderService)
    const { theme } = getState()
    return (
      <Button
        {...props}
        onclick={() => {
          themeProvider.theme.setValue(theme === defaultDarkTheme ? defaultLightTheme : defaultDarkTheme)
        }}
      >
        {theme === defaultDarkTheme ? '☀️' : '🌜'}
      </Button>
    )
  },
})
