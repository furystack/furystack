import { createComponent, Shade } from '@furystack/shades'
import {
  Avatar,
  cssVariableTheme,
  Dropdown,
  NotyService,
  ThemeProviderService,
} from '@furystack/shades-common-components'

import { applyTheme, themeDropdownItems, themeEntries } from '../theme-registry.js'

export const ThemeSwitch = Shade({
  customElementName: 'theme-switch',
  render: ({ injector, useStoredState, useDisposable }) => {
    const themeProvider = injector.getInstance(ThemeProviderService)
    const notyService = injector.getInstance(NotyService)
    const [currentThemeKey, setCurrentThemeKey] = useStoredState<string>('theme', 'dark')

    useDisposable('initial-theme', () => {
      const controller = new AbortController()
      const entry = themeEntries.find((e) => e.key === currentThemeKey)
      if (entry) {
        void entry.loader().then((theme) => {
          if (!controller.signal.aborted) {
            themeProvider.setAssignedTheme(theme)
          }
        })
      }
      return { [Symbol.dispose]: () => controller.abort() }
    })

    const handleSelect = (key: string) => {
      setCurrentThemeKey(key)
      void applyTheme(key, themeProvider).then(() => {
        const entry = themeEntries.find((e) => e.key === key)
        if (entry?.quote) {
          notyService.emit('onNotyAdded', {
            type: 'info',
            title: `Theme: ${entry.label}`,
            body: entry.quote,
          })
        }
      })
    }

    return (
      <Dropdown items={themeDropdownItems} placement="bottomRight" onSelect={handleSelect}>
        <Avatar
          avatarUrl=""
          style={{
            width: '36px',
            height: '36px',
            cursor: 'pointer',
            margin: `0 ${cssVariableTheme.spacing.sm}`,
          }}
        />
      </Dropdown>
    )
  },
})
