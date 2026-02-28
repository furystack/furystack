import type { MenuEntry, Theme, ThemeProviderService } from '@furystack/shades-common-components'
import { defaultDarkTheme, defaultLightTheme } from '@furystack/shades-common-components'
import type { DeepPartial } from '@furystack/utils'

export type ThemeEntry = {
  key: string
  label: string
  loader: () => Promise<DeepPartial<Theme>>
  quote?: string
}

const defaultThemes: ThemeEntry[] = [
  { key: 'dark', label: 'Dark', loader: async () => defaultDarkTheme },
  { key: 'light', label: 'Light', loader: async () => defaultLightTheme },
]

const specialThemes: ThemeEntry[] = [
  {
    key: 'paladin',
    label: 'Paladin',
    loader: async () => (await import('@furystack/shades-common-components/themes/paladin')).paladinTheme,
    quote: 'Cheat Enabled, You Wascally Wabbit!',
  },
  {
    key: 'chieftain',
    label: 'Chieftain',
    loader: async () => (await import('@furystack/shades-common-components/themes/chieftain')).chieftainTheme,
    quote: 'It is a good day to die!',
  },
  {
    key: 'neon-runner',
    label: 'Neon Runner',
    loader: async () => (await import('@furystack/shades-common-components/themes/neon-runner')).neonRunnerTheme,
    quote: 'Wake up, Samurai. We have a city to burn.',
  },
  {
    key: 'vault-dweller',
    label: 'Vault Dweller',
    loader: async () => (await import('@furystack/shades-common-components/themes/vault-dweller')).vaultDwellerTheme,
    quote: 'War. War never changes.',
  },
  {
    key: 'shadow-broker',
    label: 'Shadow Broker',
    loader: async () => (await import('@furystack/shades-common-components/themes/shadow-broker')).shadowBrokerTheme,
    quote: "I'm the Shadow Broker. I know everything.",
  },
  {
    key: 'dragonborn',
    label: 'Dragonborn',
    loader: async () => (await import('@furystack/shades-common-components/themes/dragonborn')).dragonbornTheme,
    quote: 'Fus Ro Dah!',
  },
  {
    key: 'plumber',
    label: 'Plumber',
    loader: async () => (await import('@furystack/shades-common-components/themes/plumber')).plumberTheme,
    quote: "It's-a me, Mario!",
  },
  {
    key: 'auditore',
    label: 'Auditore',
    loader: async () => (await import('@furystack/shades-common-components/themes/auditore')).auditoreTheme,
    quote: 'Nothing is true, everything is permitted.',
  },
  {
    key: 'replicant',
    label: 'Replicant',
    loader: async () => (await import('@furystack/shades-common-components/themes/replicant')).replicantTheme,
    quote: 'All those moments will be lost in time, like tears in rain.',
  },
  {
    key: 'sandworm',
    label: 'Sandworm',
    loader: async () => (await import('@furystack/shades-common-components/themes/sandworm')).sandwormTheme,
    quote: 'The spice must flow.',
  },
  {
    key: 'architect',
    label: 'Architect',
    loader: async () => (await import('@furystack/shades-common-components/themes/architect')).architectTheme,
    quote: 'There is no spoon.',
  },
  {
    key: 'wild-hunt',
    label: 'Wild Hunt',
    loader: async () => (await import('@furystack/shades-common-components/themes/wild-hunt')).wildHuntTheme,
    quote: "Wind's howling.",
  },
  {
    key: 'black-mesa',
    label: 'Black Mesa',
    loader: async () => (await import('@furystack/shades-common-components/themes/black-mesa')).blackMesaTheme,
    quote: 'Rise and shine, Mr. Freeman. Rise and shine.',
  },
  {
    key: 'jedi',
    label: 'Jedi',
    loader: async () => (await import('@furystack/shades-common-components/themes/jedi')).jediTheme,
    quote: 'Do or do not. There is no try.',
  },
  {
    key: 'sith',
    label: 'Sith',
    loader: async () => (await import('@furystack/shades-common-components/themes/sith')).sithTheme,
    quote: 'Peace is a lie. There is only passion.',
  },
  {
    key: 'xenomorph',
    label: 'Xenomorph',
    loader: async () => (await import('@furystack/shades-common-components/themes/xenomorph')).xenomorphTheme,
    quote: 'In space, no one can hear you scream.',
  },
  {
    key: 'hawkins',
    label: 'Hawkins',
    loader: async () => (await import('@furystack/shades-common-components/themes/hawkins')).hawkinsTheme,
    quote: "Friends don't lie.",
  },
]

export const themeEntries: ThemeEntry[] = [...defaultThemes, ...specialThemes]

export const themeDropdownItems: MenuEntry[] = [
  {
    type: 'group',
    key: 'default-group',
    label: 'Default',
    children: defaultThemes.map((e) => ({ key: e.key, label: e.label })),
  },
  { type: 'divider' },
  {
    type: 'group',
    key: 'special-group',
    label: 'Special Themes',
    children: specialThemes.map((e) => ({ key: e.key, label: e.label })),
  },
]

export const applyTheme = async (key: string, themeProvider: ThemeProviderService): Promise<void> => {
  const entry = themeEntries.find((e) => e.key === key)
  if (entry) {
    const theme = await entry.loader()
    themeProvider.setAssignedTheme(theme)
  }
}
