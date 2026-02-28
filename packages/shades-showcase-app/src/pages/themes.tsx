import { createComponent, Shade } from '@furystack/shades'
import type { Theme } from '@furystack/shades-common-components'
import {
  Button,
  Chip,
  cssVariableTheme,
  defaultDarkTheme,
  defaultLightTheme,
  Icon,
  icons,
  Input,
  PageContainer,
  PageHeader,
  Paper,
  ThemeProviderService,
  Typography,
} from '@furystack/shades-common-components'
import type { DeepPartial } from '@furystack/utils'

type ThemeEntry = {
  key: string
  label: string
  loader: () => Promise<DeepPartial<Theme>>
}

const themeEntries: ThemeEntry[] = [
  { key: 'dark', label: 'Dark', loader: async () => defaultDarkTheme },
  { key: 'light', label: 'Light', loader: async () => defaultLightTheme },
  {
    key: 'paladin',
    label: 'Paladin',
    loader: async () => (await import('@furystack/shades-common-components/themes/paladin')).paladinTheme,
  },
  {
    key: 'chieftain',
    label: 'Chieftain',
    loader: async () => (await import('@furystack/shades-common-components/themes/chieftain')).chieftainTheme,
  },
  {
    key: 'neon-runner',
    label: 'Neon Runner',
    loader: async () => (await import('@furystack/shades-common-components/themes/neon-runner')).neonRunnerTheme,
  },
  {
    key: 'vault-dweller',
    label: 'Vault Dweller',
    loader: async () => (await import('@furystack/shades-common-components/themes/vault-dweller')).vaultDwellerTheme,
  },
  {
    key: 'shadow-broker',
    label: 'Shadow Broker',
    loader: async () => (await import('@furystack/shades-common-components/themes/shadow-broker')).shadowBrokerTheme,
  },
  {
    key: 'dragonborn',
    label: 'Dragonborn',
    loader: async () => (await import('@furystack/shades-common-components/themes/dragonborn')).dragonbornTheme,
  },
  {
    key: 'plumber',
    label: 'Plumber',
    loader: async () => (await import('@furystack/shades-common-components/themes/plumber')).plumberTheme,
  },
  {
    key: 'auditore',
    label: 'Auditore',
    loader: async () => (await import('@furystack/shades-common-components/themes/auditore')).auditoreTheme,
  },
  {
    key: 'replicant',
    label: 'Replicant',
    loader: async () => (await import('@furystack/shades-common-components/themes/replicant')).replicantTheme,
  },
  {
    key: 'sandworm',
    label: 'Sandworm',
    loader: async () => (await import('@furystack/shades-common-components/themes/sandworm')).sandwormTheme,
  },
  {
    key: 'architect',
    label: 'Architect',
    loader: async () => (await import('@furystack/shades-common-components/themes/architect')).architectTheme,
  },
  {
    key: 'wild-hunt',
    label: 'Wild Hunt',
    loader: async () => (await import('@furystack/shades-common-components/themes/wild-hunt')).wildHuntTheme,
  },
  {
    key: 'black-mesa',
    label: 'Black Mesa',
    loader: async () => (await import('@furystack/shades-common-components/themes/black-mesa')).blackMesaTheme,
  },
  {
    key: 'jedi',
    label: 'Jedi',
    loader: async () => (await import('@furystack/shades-common-components/themes/jedi')).jediTheme,
  },
  {
    key: 'sith',
    label: 'Sith',
    loader: async () => (await import('@furystack/shades-common-components/themes/sith')).sithTheme,
  },
  {
    key: 'xenomorph',
    label: 'Xenomorph',
    loader: async () => (await import('@furystack/shades-common-components/themes/xenomorph')).xenomorphTheme,
  },
  {
    key: 'hawkins',
    label: 'Hawkins',
    loader: async () => (await import('@furystack/shades-common-components/themes/hawkins')).hawkinsTheme,
  },
]

type ThemeBlockProps = {
  entry: ThemeEntry
}

const ThemeBlock = Shade<ThemeBlockProps>({
  shadowDomName: 'theme-showcase-block',
  render: ({ props, injector, useDisposable, useHostProps, useRef }) => {
    const wrapperRef = useRef<HTMLDivElement>('wrapper')

    const childInjector = useDisposable('childInjector', () => {
      const child = injector.createChild()
      child.setExplicitInstance(new ThemeProviderService(), ThemeProviderService)
      return child
    })

    useHostProps({ injector: childInjector })

    useDisposable('loadTheme', () => {
      void props.entry.loader().then((theme) => {
        if (wrapperRef.current) {
          const themeProvider = childInjector.getInstance(ThemeProviderService)
          themeProvider.setAssignedTheme(theme, wrapperRef.current)
        }
      })
      return { [Symbol.dispose]: () => {} }
    })

    const handleApply = () => {
      const globalThemeProvider = injector.getInstance(ThemeProviderService)
      void props.entry.loader().then((theme) => {
        globalThemeProvider.setAssignedTheme(theme)
        localStorage.setItem('theme', JSON.stringify(props.entry.key))
      })
    }

    return (
      <div
        ref={wrapperRef}
        style={{
          background: cssVariableTheme.background.default,
          color: cssVariableTheme.text.primary,
          fontFamily: cssVariableTheme.typography.fontFamily,
          borderRadius: cssVariableTheme.shape.borderRadius.lg,
          boxShadow: cssVariableTheme.shadows.md,
          padding: cssVariableTheme.spacing.lg,
          display: 'flex',
          flexDirection: 'column',
          gap: cssVariableTheme.spacing.md,
          minWidth: '300px',
          overflow: 'hidden',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h4" style={{ margin: '0' }}>
            {props.entry.label}
          </Typography>
          <Button variant="outlined" onclick={handleApply}>
            Apply
          </Button>
        </div>

        <div style={{ display: 'flex', gap: cssVariableTheme.spacing.sm, flexWrap: 'wrap' }}>
          <Button variant="contained">Primary</Button>
          <Button variant="outlined">Outlined</Button>
          <Button variant="text">Text</Button>
        </div>

        <Input placeholder="Sample input..." />

        <div style={{ display: 'flex', gap: cssVariableTheme.spacing.sm, flexWrap: 'wrap' }}>
          <Chip color="primary">Primary</Chip>
          <Chip color="secondary">Secondary</Chip>
          <Chip color="success">Success</Chip>
          <Chip color="error">Error</Chip>
          <Chip color="warning">Warning</Chip>
          <Chip color="info">Info</Chip>
        </div>

        <Paper
          elevation={1}
          style={{
            padding: cssVariableTheme.spacing.md,
          }}
        >
          <Typography variant="body2" style={{ margin: '0' }}>
            Paper surface with elevation
          </Typography>
        </Paper>
      </div>
    )
  },
})

export const ThemesPage = Shade({
  shadowDomName: 'shades-themes-page',
  render: () => {
    return (
      <PageContainer centered>
        <PageHeader
          icon={<Icon icon={icons.sun} />}
          title="Themes"
          description="Browse all available themes side-by-side. Each block renders with its own scoped CSS variables and theme provider."
        />
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
            gap: cssVariableTheme.spacing.xl,
            padding: `0 0 ${cssVariableTheme.spacing.xl} 0`,
          }}
        >
          {themeEntries.map((entry) => (
            <ThemeBlock entry={entry} />
          ))}
        </div>
      </PageContainer>
    )
  },
})
