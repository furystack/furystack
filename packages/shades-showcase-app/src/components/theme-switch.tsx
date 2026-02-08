import { createComponent, Shade } from '@furystack/shades'
import { Button, defaultDarkTheme, defaultLightTheme, ThemeProviderService } from '@furystack/shades-common-components'

export const ThemeSwitch = Shade({
  tagName: 'theme-switch',
  render: ({ injector, useStoredState }) => {
    const [theme, setTheme] = useStoredState<'dark' | 'light'>('theme', 'dark')
    const themeProvider = injector.getInstance(ThemeProviderService)
    themeProvider.setAssignedTheme(theme === 'dark' ? defaultDarkTheme : defaultLightTheme)

    return (
      <>
        <Button
          onclick={() => {
            setTheme('dark')
          }}
        >
          🌜
        </Button>
        <Button
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
