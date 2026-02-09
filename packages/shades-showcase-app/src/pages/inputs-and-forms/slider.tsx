import { createComponent, Shade } from '@furystack/shades'
import type { SliderMark } from '@furystack/shades-common-components'
import { PageContainer, PageHeader, Paper, Slider, Typography } from '@furystack/shades-common-components'

const BasicSliderDemo = Shade({
  shadowDomName: 'slider-demo-basic',
  render: ({ useState }) => {
    const [current, setCurrent] = useState('value', 40)

    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <span style={{ minWidth: '32px' }}>{current}</span>
        <div style={{ flex: '1' }}>
          <Slider value={current} onValueChange={(v: number | [number, number]) => setCurrent(v as number)} />
        </div>
      </div>
    )
  },
})

const DiscreteSliderDemo = Shade({
  shadowDomName: 'slider-demo-discrete',
  render: ({ useState }) => {
    const [current, setCurrent] = useState('value', 30)

    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <span style={{ minWidth: '32px' }}>{current}</span>
        <div style={{ flex: '1' }}>
          <Slider
            value={current}
            step={10}
            marks={true}
            onValueChange={(v: number | [number, number]) => setCurrent(v as number)}
          />
        </div>
      </div>
    )
  },
})

const RangeSliderDemo = Shade({
  shadowDomName: 'slider-demo-range',
  render: ({ useState }) => {
    const [current, setCurrent] = useState<[number, number]>('value', [20, 80])

    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <span style={{ minWidth: '64px' }}>
          {current[0]} – {current[1]}
        </span>
        <div style={{ flex: '1' }}>
          <Slider
            value={current}
            onValueChange={(v: number | [number, number]) => setCurrent(v as [number, number])}
            color="secondary"
          />
        </div>
      </div>
    )
  },
})

const temperatureMarks: SliderMark[] = [
  { value: 0, label: '0°C' },
  { value: 25, label: '25°C' },
  { value: 50, label: '50°C' },
  { value: 75, label: '75°C' },
  { value: 100, label: '100°C' },
]

export const SliderPage = Shade({
  shadowDomName: 'slider-page',
  render: () => {
    return (
      <PageContainer centered>
        <PageHeader
          icon="🎚️"
          title="Slider"
          description="Sliders allow users to select a value or range from a continuous or discrete set. They support single and range modes, marks, vertical orientation, keyboard navigation, and palette colors."
        />

        <Paper elevation={3} style={{ padding: '32px' }}>
          <Typography variant="h3">Basic Slider</Typography>
          <BasicSliderDemo />
        </Paper>

        <Paper elevation={3} style={{ padding: '32px', marginTop: '24px' }}>
          <Typography variant="h3">Colors</Typography>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {(['primary', 'secondary', 'error', 'warning', 'success', 'info'] as const).map((color) => (
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <span style={{ minWidth: '80px', fontSize: '14px' }}>{color}</span>
                <div style={{ flex: '1' }}>
                  <Slider value={60} color={color} />
                </div>
              </div>
            ))}
          </div>
        </Paper>

        <Paper elevation={3} style={{ padding: '32px', marginTop: '24px' }}>
          <Typography variant="h3">Discrete with Steps</Typography>
          <DiscreteSliderDemo />
        </Paper>

        <Paper elevation={3} style={{ padding: '32px', marginTop: '24px' }}>
          <Typography variant="h3">Custom Marks with Labels</Typography>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ flex: '1' }}>
              <Slider value={50} marks={temperatureMarks} />
            </div>
          </div>
        </Paper>

        <Paper elevation={3} style={{ padding: '32px', marginTop: '24px' }}>
          <Typography variant="h3">Range Slider</Typography>
          <RangeSliderDemo />
        </Paper>

        <Paper elevation={3} style={{ padding: '32px', marginTop: '24px' }}>
          <Typography variant="h3">Vertical</Typography>
          <div style={{ display: 'flex', gap: '48px', flexWrap: 'wrap', alignItems: 'flex-end', minHeight: '240px' }}>
            <Slider value={30} vertical />
            <Slider value={60} vertical color="secondary" />
            <Slider value={[20, 70] as [number, number]} vertical color="success" />
            <Slider value={50} vertical marks={true} step={10} color="info" />
          </div>
        </Paper>

        <Paper elevation={3} style={{ padding: '32px', marginTop: '24px' }}>
          <Typography variant="h3">Disabled</Typography>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <Slider value={40} disabled />
            <Slider value={[30, 70] as [number, number]} disabled color="secondary" />
          </div>
        </Paper>

        <Paper elevation={3} style={{ padding: '32px', marginTop: '24px' }}>
          <Typography variant="h3">Custom Range</Typography>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <div style={{ fontSize: '14px', marginBottom: '8px' }}>Temperature (min: -20, max: 50, step: 5)</div>
              <Slider
                value={20}
                min={-20}
                max={50}
                step={5}
                marks={[
                  { value: -20, label: '-20°' },
                  { value: 0, label: '0°' },
                  { value: 20, label: '20°' },
                  { value: 50, label: '50°' },
                ]}
                color="error"
              />
            </div>
          </div>
        </Paper>
      </PageContainer>
    )
  },
})
