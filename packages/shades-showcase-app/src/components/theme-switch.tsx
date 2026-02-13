import { createComponent, Shade } from '@furystack/shades'
import {
  Button,
  Icon,
  icons,
  defaultDarkTheme,
  defaultLightTheme,
  ThemeProviderService,
} from '@furystack/shades-common-components'

export const ThemeSwitch = Shade({
  shadowDomName: 'theme-switch',
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
          <Icon icon={icons.moon} size="small" />
        </Button>
        <Button
          onclick={() => {
            setTheme('light')
          }}
        >
          <Icon icon={icons.sun} size="small" />
        </Button>
      </>
    )
  },
})
