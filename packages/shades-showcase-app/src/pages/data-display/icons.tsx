import { createComponent, Shade } from '@furystack/shades'
import type { IconDefinition, Palette } from '@furystack/shades-common-components'
import {
  Button,
  Icon,
  icons,
  Input,
  PageContainer,
  PageHeader,
  Paper,
  ToggleButtonGroup,
  Typography,
} from '@furystack/shades-common-components'

const paletteColors: Array<keyof Palette> = ['primary', 'secondary', 'error', 'warning', 'success', 'info']

type IconEntry = { key: string; icon: IconDefinition }

const allIcons: IconEntry[] = Object.entries(icons).map(([key, icon]) => ({
  key,
  icon,
}))

const getGroupedIcons = (entries: IconEntry[]): Array<{ category: string; items: IconEntry[] }> => {
  const groups: Record<string, IconEntry[]> = {}
  for (const entry of entries) {
    const cat = entry.icon.category || 'Other'
    if (!groups[cat]) groups[cat] = []
    groups[cat].push(entry)
  }
  const categoryOrder = ['Actions', 'Navigation', 'Status', 'Content', 'UI', 'Common', 'Other']
  return categoryOrder.filter((cat) => groups[cat]?.length).map((cat) => ({ category: cat, items: groups[cat] }))
}

const matchesSearch = (entry: IconEntry, query: string): boolean => {
  const q = query.toLowerCase()
  if (entry.key.toLowerCase().includes(q)) return true
  if (entry.icon.name?.toLowerCase().includes(q)) return true
  if (entry.icon.description?.toLowerCase().includes(q)) return true
  if (entry.icon.keywords?.some((kw) => kw.toLowerCase().includes(q))) return true
  if (entry.icon.category?.toLowerCase().includes(q)) return true
  return false
}

const iconCellStyle: Partial<CSSStyleDeclaration> = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: '8px',
  padding: '12px',
  borderRadius: '8px',
  minWidth: '80px',
}

export const IconsPage = Shade({
  shadowDomName: 'shades-icons-page',
  render: ({ useSearchState }) => {
    const [state, setState] = useSearchState('icons', {
      selectedSize: 'medium' as 'small' | 'medium' | 'large',
      selectedColor: '' as string,
      search: '' as string,
    })

    const size = state.selectedSize
    const color = (state.selectedColor || undefined) as keyof Palette | undefined

    const filtered = state.search ? allIcons.filter((entry) => matchesSearch(entry, state.search)) : allIcons
    const grouped = getGroupedIcons(filtered)

    return (
      <PageContainer centered>
        <PageHeader
          icon={<Icon icon={icons.star} />}
          title="Icons"
          description={`A built-in icon set with ${allIcons.length} stroke and fill variants. All icons are original SVG designs on a 24x24 grid.`}
        />

        <Paper elevation={3} style={{ padding: '32px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <Input
            labelTitle="Search icons"
            placeholder="Filter by name, keyword, or category..."
            value={state.search}
            getStartIcon={() => <Icon icon={icons.search} size="small" />}
            onTextChange={(value) => setState({ ...state, search: value })}
          />

          <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'center' }}>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <Typography variant="body1" style={{ margin: '0', fontWeight: '600' }}>
                Size:
              </Typography>
              <ToggleButtonGroup
                exclusive
                value={size}
                onValueChange={(v) => setState({ ...state, selectedSize: v as 'small' | 'medium' | 'large' })}
              >
                {(['small', 'medium', 'large'] as const).map((s) => (
                  <Button data-value={s} variant={size === s ? 'contained' : 'outlined'}>
                    {s}
                  </Button>
                ))}
              </ToggleButtonGroup>
            </div>

            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <Typography variant="body1" style={{ margin: '0', fontWeight: '600' }}>
                Color:
              </Typography>
              <ToggleButtonGroup
                exclusive
                value={state.selectedColor || 'inherit'}
                onValueChange={(v) => setState({ ...state, selectedColor: v === 'inherit' ? '' : (v as string) })}
              >
                <Button data-value="inherit" variant={!state.selectedColor ? 'contained' : 'outlined'}>
                  inherit
                </Button>
                {paletteColors.map((c) => (
                  <Button data-value={c} variant={state.selectedColor === c ? 'contained' : 'outlined'}>
                    {c}
                  </Button>
                ))}
              </ToggleButtonGroup>
            </div>
          </div>

          {state.search && (
            <Typography variant="body2" style={{ margin: '0', opacity: '0.7' }}>
              {filtered.length} of {allIcons.length} icons match "{state.search}"
            </Typography>
          )}
        </Paper>

        {grouped.map(({ category, items }) => (
          <Paper
            elevation={3}
            style={{ padding: '32px', display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '16px' }}
          >
            <Typography variant="h3" style={{ margin: '0' }}>
              {category}{' '}
              <Typography variant="caption" style={{ margin: '0', opacity: '0.5' }}>
                ({items.length})
              </Typography>
            </Typography>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
              {items.map(({ key, icon }) => (
                <div style={iconCellStyle} title={icon.description || key}>
                  <Icon icon={icon} size={size} color={color} />
                  <Typography
                    variant="caption"
                    style={{ margin: '0', textAlign: 'center', opacity: '0.7', fontSize: '11px' }}
                  >
                    {icon.name || key}
                  </Typography>
                </div>
              ))}
            </div>
          </Paper>
        ))}

        <Paper
          elevation={3}
          style={{ padding: '32px', display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '16px' }}
        >
          <Typography variant="h3" style={{ margin: '0' }}>
            Size Comparison
          </Typography>
          <div style={{ display: 'flex', gap: '24px', alignItems: 'center' }}>
            {(
              [
                { size: 'small' as const, label: 'small (16px)' },
                { size: 'medium' as const, label: 'medium (24px)' },
                { size: 'large' as const, label: 'large (32px)' },
                { size: 48, label: 'custom (48px)' },
              ] as const
            ).map(({ size: s, label }) => (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                <Icon icon={icons.home} size={s} />
                <Typography variant="caption" style={{ margin: '0' }}>
                  {label}
                </Typography>
              </div>
            ))}
          </div>
        </Paper>

        <Paper
          elevation={3}
          style={{ padding: '32px', display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '16px' }}
        >
          <Typography variant="h3" style={{ margin: '0' }}>
            Color Palette
          </Typography>
          <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
            {paletteColors.map((c) => (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                <Icon icon={icons.checkCircle} size="large" color={c} />
                <Typography variant="caption" style={{ margin: '0' }}>
                  {c}
                </Typography>
              </div>
            ))}
          </div>
        </Paper>
      </PageContainer>
    )
  },
})
