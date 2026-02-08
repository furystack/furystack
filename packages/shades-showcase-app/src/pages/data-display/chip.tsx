import { createComponent, Shade } from '@furystack/shades'
import type { Palette } from '@furystack/shades-common-components'
import { Chip, PageContainer, PageHeader, Paper, Typography } from '@furystack/shades-common-components'

const paletteColors: Array<keyof Palette> = ['primary', 'secondary', 'error', 'warning', 'success', 'info']

export const ChipPage = Shade({
  tagName: 'shades-chip-page',
  render: ({ useSearchState }) => {
    const [state, setState] = useSearchState('chip', { deletedChips: [] as string[] })

    const handleDelete = (label: string) => {
      setState({ deletedChips: [...state.deletedChips, label] })
    }

    const handleReset = () => {
      setState({ deletedChips: [] })
    }

    return (
      <PageContainer maxWidth="900px" centered>
        <PageHeader
          icon="🏷️"
          title="Chip"
          description="Chips are compact elements that represent an input, attribute, or action. They support multiple color variants, sizes, and can be made clickable or deletable."
        />

        <Paper elevation={3} style={{ padding: '32px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <Typography variant="h3" style={{ margin: '0' }}>
            Filled (default)
          </Typography>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center' }}>
            <Chip>Default</Chip>
            {paletteColors.map((color) => (
              <Chip color={color}>{color}</Chip>
            ))}
          </div>

          <Typography variant="h3" style={{ margin: '0' }}>
            Outlined
          </Typography>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center' }}>
            <Chip variant="outlined">Default</Chip>
            {paletteColors.map((color) => (
              <Chip variant="outlined" color={color}>
                {color}
              </Chip>
            ))}
          </div>

          <Typography variant="h3" style={{ margin: '0' }}>
            Small size
          </Typography>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center' }}>
            <Chip size="small">Default</Chip>
            {paletteColors.map((color) => (
              <Chip size="small" color={color}>
                {color}
              </Chip>
            ))}
          </div>

          <Typography variant="h3" style={{ margin: '0' }}>
            Clickable
          </Typography>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center' }}>
            {paletteColors.map((color) => (
              <Chip color={color} clickable onclick={() => alert(`Clicked ${color}`)}>
                {color}
              </Chip>
            ))}
          </div>

          <Typography variant="h3" style={{ margin: '0' }}>
            Deletable
          </Typography>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center' }}>
            {paletteColors
              .filter((color) => !state.deletedChips.includes(color))
              .map((color) => (
                <Chip color={color} onDelete={() => handleDelete(color)}>
                  {color}
                </Chip>
              ))}
            {state.deletedChips.length > 0 ? (
              <Chip variant="outlined" clickable onclick={handleReset}>
                Reset
              </Chip>
            ) : null}
          </div>

          <Typography variant="h3" style={{ margin: '0' }}>
            Disabled
          </Typography>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center' }}>
            <Chip disabled>Default</Chip>
            <Chip disabled color="primary">
              Primary
            </Chip>
            <Chip disabled variant="outlined" color="secondary">
              Outlined
            </Chip>
            <Chip disabled onDelete={() => {}}>
              Deletable
            </Chip>
          </div>
        </Paper>
      </PageContainer>
    )
  },
})
