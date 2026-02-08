import { createComponent, Shade } from '@furystack/shades'
import type { Palette } from '@furystack/shades-common-components'
import { Badge, Button, Chip, PageContainer, PageHeader, Paper, Typography } from '@furystack/shades-common-components'

const paletteColors: Array<keyof Palette> = ['primary', 'secondary', 'error', 'warning', 'success', 'info']

const MailIcon = () => <span style={{ fontSize: '24px', lineHeight: '1', display: 'inline-flex' }}>✉️</span>

const NotificationIcon = () => <span style={{ fontSize: '24px', lineHeight: '1', display: 'inline-flex' }}>🔔</span>

export const BadgePage = Shade({
  shadowDomName: 'shades-badge-page',
  render: ({ useSearchState }) => {
    const [state, setState] = useSearchState('badge', { count: 5 })

    return (
      <PageContainer maxWidth="900px" centered>
        <PageHeader
          icon="🔢"
          title="Badge"
          description="Badges generate a small indicator on the top-right corner of their child element. They are useful for showing counts, status indicators, or drawing attention to items."
        />

        <Paper elevation={3} style={{ padding: '32px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <Typography variant="h3" style={{ margin: '0' }}>
            Basic
          </Typography>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '24px', alignItems: 'center' }}>
            <Badge count={state.count}>
              <MailIcon />
            </Badge>
            <Badge count={state.count} color="primary">
              <MailIcon />
            </Badge>
            <Badge count={state.count} color="secondary">
              <NotificationIcon />
            </Badge>
          </div>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <Button variant="outlined" onclick={() => setState({ count: Math.max(0, state.count - 1) })}>
              -
            </Button>
            <span style={{ minWidth: '32px', textAlign: 'center' }}>{state.count}</span>
            <Button variant="outlined" onclick={() => setState({ count: state.count + 1 })}>
              +
            </Button>
          </div>

          <Typography variant="h3" style={{ margin: '0' }}>
            Colors
          </Typography>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '24px', alignItems: 'center' }}>
            {paletteColors.map((color) => (
              <Badge count={8} color={color}>
                <Chip color={color}>{color}</Chip>
              </Badge>
            ))}
          </div>

          <Typography variant="h3" style={{ margin: '0' }}>
            Dot variant
          </Typography>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '24px', alignItems: 'center' }}>
            <Badge dot>
              <MailIcon />
            </Badge>
            <Badge dot color="primary">
              <NotificationIcon />
            </Badge>
            <Badge dot color="success">
              <MailIcon />
            </Badge>
          </div>

          <Typography variant="h3" style={{ margin: '0' }}>
            Maximum value
          </Typography>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '24px', alignItems: 'center' }}>
            <Badge count={99}>
              <MailIcon />
            </Badge>
            <Badge count={100}>
              <MailIcon />
            </Badge>
            <Badge count={1000} max={999}>
              <MailIcon />
            </Badge>
          </div>

          <Typography variant="h3" style={{ margin: '0' }}>
            Show zero
          </Typography>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '24px', alignItems: 'center' }}>
            <Badge count={0}>
              <MailIcon />
            </Badge>
            <Badge count={0} showZero>
              <MailIcon />
            </Badge>
          </div>

          <Typography variant="h3" style={{ margin: '0' }}>
            Visibility
          </Typography>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '24px', alignItems: 'center' }}>
            <Badge count={5} visible={true}>
              <MailIcon />
            </Badge>
            <Badge count={5} visible={false}>
              <MailIcon />
            </Badge>
          </div>
        </Paper>
      </PageContainer>
    )
  },
})
