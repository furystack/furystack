import { createComponent, Shade } from '@furystack/shades'
import type { ButtonProps } from '@furystack/shades-common-components'
import { Button, defaultDarkTheme, defaultLightTheme, ThemeProviderService } from '@furystack/shades-common-components'

export const ThemeSwitch = Shade<Omit<ButtonProps, 'onclick'>>({
  shadowDomName: 'theme-switch',
  render: ({ props, injector, useStoredState }) => {
    const [theme, setTheme] = useStoredState<'dark' | 'light'>('theme', 'dark')

    const themeProvider = injector.getInstance(ThemeProviderService)

    themeProvider.set(theme === 'dark' ? defaultDarkTheme : defaultLightTheme)

    return (
      <>
        <Button
          {...props}
          onclick={() => {
            setTheme('dark')
          }}
        >
          🌜
        </Button>
        <Button
          {...props}
          onclick={() => {
            setTheme('light')
          }}
        >
          ☀️
        </Button>
      </>
    )
  },
})
