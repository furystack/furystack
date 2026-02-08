import { createComponent, Shade } from '@furystack/shades'
import {
  Button,
  ButtonGroup,
  PageContainer,
  PageHeader,
  Paper,
  SegmentedControl,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from '@furystack/shades-common-components'
import { ObservableValue } from '@furystack/utils'

const ToggleExclusiveDemo = Shade({
  tagName: 'toggle-exclusive-demo',
  render: ({ useDisposable, useObservable }) => {
    const alignment$ = useDisposable('alignment', () => new ObservableValue('center'))
    const [alignment] = useObservable('alignmentValue', alignment$)

    return (
      <div>
        <div style={{ marginBottom: '8px', fontSize: '0.85rem', opacity: '0.7' }}>
          <span>Exclusive (selected: {alignment})</span>
        </div>
        <ToggleButtonGroup
          exclusive
          value={alignment}
          onValueChange={(val) => alignment$.setValue(val as string)}
          color="primary"
        >
          <ToggleButton value="left">⫷ Left</ToggleButton>
          <ToggleButton value="center">☰ Center</ToggleButton>
          <ToggleButton value="right">⫸ Right</ToggleButton>
        </ToggleButtonGroup>
      </div>
    )
  },
})

const ToggleMultiDemo = Shade({
  tagName: 'toggle-multi-demo',
  render: ({ useDisposable, useObservable }) => {
    const formats$ = useDisposable('formats', () => new ObservableValue<string[]>(['bold']))
    const [formats] = useObservable('formatsValue', formats$)

    return (
      <div>
        <div style={{ marginBottom: '8px', fontSize: '0.85rem', opacity: '0.7' }}>
          <span>Multi-select (selected: {formats.join(', ') || 'none'})</span>
        </div>
        <ToggleButtonGroup
          value={formats}
          onValueChange={(val) => formats$.setValue(val as string[])}
          color="secondary"
        >
          <ToggleButton value="bold">𝐁</ToggleButton>
          <ToggleButton value="italic">𝐼</ToggleButton>
          <ToggleButton value="underline">U̲</ToggleButton>
          <ToggleButton value="strikethrough">S̶</ToggleButton>
        </ToggleButtonGroup>
      </div>
    )
  },
})

const ToggleVerticalDemo = Shade({
  tagName: 'toggle-vertical-demo',
  render: ({ useDisposable, useObservable }) => {
    const view$ = useDisposable('view', () => new ObservableValue('list'))
    const [view] = useObservable('viewValue', view$)

    return (
      <div>
        <div style={{ marginBottom: '8px', fontSize: '0.85rem', opacity: '0.7' }}>
          <span>Exclusive vertical (selected: {view})</span>
        </div>
        <ToggleButtonGroup
          exclusive
          orientation="vertical"
          value={view}
          onValueChange={(val) => view$.setValue(val as string)}
          color="info"
        >
          <ToggleButton value="list">☰ List</ToggleButton>
          <ToggleButton value="grid">⊞ Grid</ToggleButton>
          <ToggleButton value="table">⊟ Table</ToggleButton>
        </ToggleButtonGroup>
      </div>
    )
  },
})

const SegmentedControlDemo = Shade({
  tagName: 'segmented-control-demo',
  render: ({ useDisposable, useObservable }) => {
    const period$ = useDisposable('period', () => new ObservableValue('weekly'))
    const [period] = useObservable('periodValue', period$)

    return (
      <div>
        <div style={{ marginBottom: '8px', fontSize: '0.85rem', opacity: '0.7' }}>
          <span>Default (selected: {period})</span>
        </div>
        <SegmentedControl
          options={[
            { value: 'daily', label: 'Daily' },
            { value: 'weekly', label: 'Weekly' },
            { value: 'monthly', label: 'Monthly' },
            { value: 'yearly', label: 'Yearly' },
          ]}
          value={period}
          onValueChange={(val) => period$.setValue(val)}
        />
      </div>
    )
  },
})

export const ButtonGroupPage = Shade({
  tagName: 'button-group-page',
  render: () => {
    return (
      <PageContainer maxWidth="800px" centered>
        <PageHeader
          icon="🔗"
          title="Button Group"
          description="ButtonGroup groups related buttons together. ToggleButtonGroup adds selection state (exclusive or multi-select). SegmentedControl provides a compact tab-like option selector."
        />

        {/* ButtonGroup - static, no state */}
        <Paper elevation={3} style={{ padding: '32px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <Typography variant="h3" style={{ margin: '0', color: 'inherit' }}>
            ButtonGroup
          </Typography>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <div style={{ marginBottom: '8px', fontSize: '0.85rem', opacity: '0.7' }}>Default (flat)</div>
              <ButtonGroup>
                <Button>One</Button>
                <Button>Two</Button>
                <Button>Three</Button>
              </ButtonGroup>
            </div>

            <div>
              <div style={{ marginBottom: '8px', fontSize: '0.85rem', opacity: '0.7' }}>Outlined</div>
              <ButtonGroup variant="outlined" color="primary">
                <Button variant="outlined" color="primary">
                  One
                </Button>
                <Button variant="outlined" color="primary">
                  Two
                </Button>
                <Button variant="outlined" color="primary">
                  Three
                </Button>
              </ButtonGroup>
            </div>

            <div>
              <div style={{ marginBottom: '8px', fontSize: '0.85rem', opacity: '0.7' }}>Contained</div>
              <ButtonGroup variant="contained" color="primary">
                <Button variant="contained" color="primary">
                  One
                </Button>
                <Button variant="contained" color="primary">
                  Two
                </Button>
                <Button variant="contained" color="primary">
                  Three
                </Button>
              </ButtonGroup>
            </div>

            <div>
              <div style={{ marginBottom: '8px', fontSize: '0.85rem', opacity: '0.7' }}>Vertical</div>
              <ButtonGroup orientation="vertical" variant="outlined" color="secondary">
                <Button variant="outlined" color="secondary">
                  Top
                </Button>
                <Button variant="outlined" color="secondary">
                  Middle
                </Button>
                <Button variant="outlined" color="secondary">
                  Bottom
                </Button>
              </ButtonGroup>
            </div>
          </div>
        </Paper>

        {/* ToggleButtonGroup - each demo is isolated */}
        <Paper
          elevation={3}
          style={{ padding: '32px', display: 'flex', flexDirection: 'column', gap: '24px', marginTop: '24px' }}
        >
          <Typography variant="h3" style={{ margin: '0', color: 'inherit' }}>
            ToggleButtonGroup
          </Typography>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <ToggleExclusiveDemo />
            <ToggleMultiDemo />
            <ToggleVerticalDemo />
          </div>
        </Paper>

        {/* SegmentedControl - each demo is isolated */}
        <Paper
          elevation={3}
          style={{ padding: '32px', display: 'flex', flexDirection: 'column', gap: '24px', marginTop: '24px' }}
        >
          <Typography variant="h3" style={{ margin: '0', color: 'inherit' }}>
            SegmentedControl
          </Typography>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <SegmentedControlDemo />

            <div>
              <div style={{ marginBottom: '8px', fontSize: '0.85rem', opacity: '0.7' }}>
                Small size with secondary color
              </div>
              <SegmentedControl
                size="small"
                color="secondary"
                options={[
                  { value: 'sm', label: 'S' },
                  { value: 'md', label: 'M' },
                  { value: 'lg', label: 'L' },
                  { value: 'xl', label: 'XL' },
                ]}
                value="md"
              />
            </div>

            <div>
              <div style={{ marginBottom: '8px', fontSize: '0.85rem', opacity: '0.7' }}>With a disabled option</div>
              <SegmentedControl
                options={[
                  { value: 'free', label: 'Free' },
                  { value: 'pro', label: 'Pro' },
                  { value: 'enterprise', label: 'Enterprise', disabled: true },
                ]}
                value="free"
              />
            </div>

            <div>
              <div style={{ marginBottom: '8px', fontSize: '0.85rem', opacity: '0.7' }}>Fully disabled</div>
              <SegmentedControl
                disabled
                options={[
                  { value: 'on', label: 'On' },
                  { value: 'off', label: 'Off' },
                ]}
                value="on"
              />
            </div>
          </div>
        </Paper>
      </PageContainer>
    )
  },
})
