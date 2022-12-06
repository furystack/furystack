import { createComponent, createFragment, Shade } from '@furystack/shades'
import type { ButtonProps } from '@furystack/shades-common-components'
import { Button, defaultDarkTheme, defaultLightTheme, ThemeProviderService } from '@furystack/shades-common-components'

export const ThemeSwitch = Shade<Omit<ButtonProps, 'onclick'>>({
  shadowDomName: 'theme-switch',
  render: ({ props, injector }) => {
    const themeProvider = injector.getInstance(ThemeProviderService)
    return (
      <>
        <Button
          {...props}
          onclick={() => {
            themeProvider.set(defaultDarkTheme)
          }}
        >
          🌜
        </Button>
        <Button
          {...props}
          onclick={() => {
            themeProvider.set(defaultLightTheme)
          }}
        >
          ☀️
        </Button>
      </>
    )
  },
})
