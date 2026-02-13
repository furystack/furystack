import { createComponent, Shade } from '@furystack/shades'
import {
  Button,
  Chip,
  Icon,
  icons,
  PageContainer,
  PageHeader,
  Paper,
  Tooltip,
} from '@furystack/shades-common-components'

export const TooltipPage = Shade({
  shadowDomName: 'shades-tooltip-page',
  render: () => {
    return (
      <PageContainer centered>
        <PageHeader
          icon={<Icon icon={icons.messageCircle} />}
          title="Tooltip"
          description="Tooltips display informative text when users hover over, focus on, or tap an element. They support multiple placements, custom delay, and can be disabled."
        />

        <Paper elevation={3} style={{ padding: '32px', display: 'flex', flexDirection: 'column', gap: '32px' }}>
          <h3 style={{ margin: '0' }}>Basic</h3>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '24px', alignItems: 'center' }}>
            <Tooltip title="This is a tooltip">
              <span style={{ cursor: 'default', textDecoration: 'underline dotted', textUnderlineOffset: '4px' }}>
                Hover me
              </span>
            </Tooltip>
            <Tooltip title="Button tooltip">
              <Button variant="contained" color="primary">
                Button with tooltip
              </Button>
            </Tooltip>
            <Tooltip title="Chip tooltip">
              <Chip color="secondary">Chip with tooltip</Chip>
            </Tooltip>
          </div>

          <h3 style={{ margin: '0' }}>Placement</h3>
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: '24px',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '48px 0',
            }}
          >
            <Tooltip title="Top placement" placement="top">
              <Button variant="outlined">Top</Button>
            </Tooltip>
            <Tooltip title="Bottom placement" placement="bottom">
              <Button variant="outlined">Bottom</Button>
            </Tooltip>
            <Tooltip title="Left placement" placement="left">
              <Button variant="outlined">Left</Button>
            </Tooltip>
            <Tooltip title="Right placement" placement="right">
              <Button variant="outlined">Right</Button>
            </Tooltip>
          </div>

          <h3 style={{ margin: '0' }}>With delay</h3>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '24px', alignItems: 'center' }}>
            <Tooltip title="No delay (default)">
              <Button variant="outlined">No delay</Button>
            </Tooltip>
            <Tooltip title="200ms delay" delay={200}>
              <Button variant="outlined">200ms</Button>
            </Tooltip>
            <Tooltip title="500ms delay" delay={500}>
              <Button variant="outlined">500ms</Button>
            </Tooltip>
            <Tooltip title="1000ms delay" delay={1000}>
              <Button variant="outlined">1000ms</Button>
            </Tooltip>
          </div>

          <h3 style={{ margin: '0' }}>Disabled</h3>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '24px', alignItems: 'center' }}>
            <Tooltip title="You won't see this" disabled>
              <Button variant="outlined">Disabled tooltip</Button>
            </Tooltip>
            <Tooltip title="This one works">
              <Button variant="outlined">Enabled tooltip</Button>
            </Tooltip>
          </div>

          <h3 style={{ margin: '0' }}>On focusable elements</h3>
          <p style={{ margin: '0', fontSize: '14px', opacity: '0.7' }}>
            Tooltips also appear when the trigger element receives focus (try tabbing to these buttons).
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '24px', alignItems: 'center' }}>
            <Tooltip title="Focused via keyboard" placement="bottom">
              <Button variant="contained" color="primary">
                Tab to me
              </Button>
            </Tooltip>
            <Tooltip title="Another focusable" placement="bottom">
              <Button variant="contained" color="secondary">
                Or me
              </Button>
            </Tooltip>
          </div>
        </Paper>
      </PageContainer>
    )
  },
})
