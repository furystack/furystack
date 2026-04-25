import { createComponent, Shade } from '@furystack/shades'
import {
  Button,
  Chip,
  cssVariableTheme,
  Icon,
  icons,
  Input,
  PageContainer,
  PageHeader,
  Paper,
  ThemeProviderService,
  Typography,
} from '@furystack/shades-common-components'

import { type ThemeEntry, applyTheme, themeEntries } from '../theme-registry.js'

type ThemeBlockProps = {
  entry: ThemeEntry
}

const ThemeBlock = Shade<ThemeBlockProps>({
  customElementName: 'theme-showcase-block',
  render: ({ props, injector, useDisposable, useRef }) => {
    const wrapperRef = useRef<HTMLDivElement>('wrapper')

    useDisposable('loadTheme', () => {
      const controller = new AbortController()
      void props.entry.loader().then((theme) => {
        if (!controller.signal.aborted && wrapperRef.current) {
          // Scope the theme's CSS variables to the wrapper element — the
          // global ThemeProviderService singleton manages only CSS-variable
          // emission, so this keeps each block visually isolated without
          // requiring a per-block service instance.
          const themeProvider = injector.get(ThemeProviderService)
          themeProvider.setAssignedTheme(theme, wrapperRef.current)
        }
      })
      return { [Symbol.dispose]: () => controller.abort() }
    })

    const handleApply = () => {
      const globalThemeProvider = injector.get(ThemeProviderService)
      void applyTheme(props.entry.key, globalThemeProvider).then(() => {
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
  customElementName: 'shades-themes-page',
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
