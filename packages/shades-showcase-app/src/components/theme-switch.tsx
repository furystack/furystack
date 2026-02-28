import { createComponent, Shade } from '@furystack/shades'
import type { MenuEntry, Theme } from '@furystack/shades-common-components'
import {
  Avatar,
  cssVariableTheme,
  defaultDarkTheme,
  defaultLightTheme,
  Dropdown,
  ThemeProviderService,
} from '@furystack/shades-common-components'
import type { DeepPartial } from '@furystack/utils'

const themeItems: MenuEntry[] = [
  {
    type: 'group',
    key: 'default-group',
    label: 'Default',
    children: [
      { key: 'dark', label: 'Dark' },
      { key: 'light', label: 'Light' },
    ],
  },
  { type: 'divider' },
  {
    type: 'group',
    key: 'special-group',
    label: 'Special Themes',
    children: [
      { key: 'paladin', label: 'Paladin' },
      { key: 'chieftain', label: 'Chieftain' },
      { key: 'neon-runner', label: 'Neon Runner' },
      { key: 'vault-dweller', label: 'Vault Dweller' },
      { key: 'shadow-broker', label: 'Shadow Broker' },
      { key: 'dragonborn', label: 'Dragonborn' },
      { key: 'plumber', label: 'Plumber' },
      { key: 'auditore', label: 'Auditore' },
      { key: 'replicant', label: 'Replicant' },
      { key: 'sandworm', label: 'Sandworm' },
      { key: 'architect', label: 'Architect' },
      { key: 'wild-hunt', label: 'Wild Hunt' },
      { key: 'black-mesa', label: 'Black Mesa' },
      { key: 'jedi', label: 'Jedi' },
      { key: 'sith', label: 'Sith' },
      { key: 'xenomorph', label: 'Xenomorph' },
      { key: 'hawkins', label: 'Hawkins' },
    ],
  },
]

const themeLoaders: Record<string, () => Promise<DeepPartial<Theme>>> = {
  dark: async () => defaultDarkTheme,
  light: async () => defaultLightTheme,
  paladin: async () => (await import('@furystack/shades-common-components/themes/paladin')).paladinTheme,
  chieftain: async () => (await import('@furystack/shades-common-components/themes/chieftain')).chieftainTheme,
  'neon-runner': async () => (await import('@furystack/shades-common-components/themes/neon-runner')).neonRunnerTheme,
  'vault-dweller': async () =>
    (await import('@furystack/shades-common-components/themes/vault-dweller')).vaultDwellerTheme,
  'shadow-broker': async () =>
    (await import('@furystack/shades-common-components/themes/shadow-broker')).shadowBrokerTheme,
  dragonborn: async () => (await import('@furystack/shades-common-components/themes/dragonborn')).dragonbornTheme,
  plumber: async () => (await import('@furystack/shades-common-components/themes/plumber')).plumberTheme,
  auditore: async () => (await import('@furystack/shades-common-components/themes/auditore')).auditoreTheme,
  replicant: async () => (await import('@furystack/shades-common-components/themes/replicant')).replicantTheme,
  sandworm: async () => (await import('@furystack/shades-common-components/themes/sandworm')).sandwormTheme,
  architect: async () => (await import('@furystack/shades-common-components/themes/architect')).architectTheme,
  'wild-hunt': async () => (await import('@furystack/shades-common-components/themes/wild-hunt')).wildHuntTheme,
  'black-mesa': async () => (await import('@furystack/shades-common-components/themes/black-mesa')).blackMesaTheme,
  jedi: async () => (await import('@furystack/shades-common-components/themes/jedi')).jediTheme,
  sith: async () => (await import('@furystack/shades-common-components/themes/sith')).sithTheme,
  xenomorph: async () => (await import('@furystack/shades-common-components/themes/xenomorph')).xenomorphTheme,
  hawkins: async () => (await import('@furystack/shades-common-components/themes/hawkins')).hawkinsTheme,
}

const applyTheme = async (key: string, themeProvider: ThemeProviderService) => {
  const loader = themeLoaders[key]
  if (loader) {
    const theme = await loader()
    themeProvider.setAssignedTheme(theme)
  }
}

export const ThemeSwitch = Shade({
  shadowDomName: 'theme-switch',
  render: ({ injector, useStoredState }) => {
    const themeProvider = injector.getInstance(ThemeProviderService)
    const [currentThemeKey, setCurrentThemeKey] = useStoredState<string>('theme', 'dark')

    void applyTheme(currentThemeKey, themeProvider)

    const handleSelect = (key: string) => {
      setCurrentThemeKey(key)
      void applyTheme(key, themeProvider)
    }

    return (
      <Dropdown items={themeItems} placement="bottomRight" onSelect={handleSelect}>
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
