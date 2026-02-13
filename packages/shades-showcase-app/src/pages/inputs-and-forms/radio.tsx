import { createComponent, Shade } from '@furystack/shades'
import { Icon, icons, PageContainer, PageHeader, Paper, Radio, RadioGroup } from '@furystack/shades-common-components'

export const RadioPage = Shade({
  shadowDomName: 'radio-page',
  render: ({ useState }) => {
    const [colorValue, setColorValue] = useState('selectedColor', '')
    const [sizeValue, setSizeValue] = useState('selectedSize', '')

    return (
      <PageContainer centered>
        <PageHeader
          icon={<Icon icon={icons.circleDot} />}
          title="Radio / RadioGroup"
          description="Radio buttons allow users to select a single option from a set. Use RadioGroup to group related options and manage selection state. Supports palette colors, disabled state, horizontal/vertical layout, and FormService integration."
        />
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <Paper elevation={3} style={{ padding: '32px' }}>
            <h3 style={{ marginTop: '0' }}>Basic Radio Buttons</h3>
            <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
              <Radio value="standalone1" name="standalone" labelTitle="Option A" checked />
              <Radio value="standalone2" name="standalone" labelTitle="Option B" />
              <Radio value="standalone3" name="standalone" labelTitle="No label" />
            </div>
          </Paper>

          <Paper elevation={3} style={{ padding: '32px' }}>
            <h3 style={{ marginTop: '0' }}>RadioGroup (Vertical)</h3>
            <div style={{ display: 'flex', gap: '48px' }}>
              <RadioGroup
                name="color-group"
                labelTitle="Favorite Color"
                defaultValue="blue"
                onValueChange={(value) => setColorValue(value)}
              >
                <Radio value="red" labelTitle="Red" />
                <Radio value="green" labelTitle="Green" />
                <Radio value="blue" labelTitle="Blue" />
                <Radio value="purple" labelTitle="Purple" />
              </RadioGroup>

              <div style={{ padding: '8px' }}>
                <strong>Selected:</strong> {colorValue || 'blue (default)'}
              </div>
            </div>
          </Paper>

          <Paper elevation={3} style={{ padding: '32px' }}>
            <h3 style={{ marginTop: '0' }}>RadioGroup (Horizontal)</h3>
            <div style={{ display: 'flex', gap: '48px' }}>
              <RadioGroup
                name="size-group"
                labelTitle="Size"
                orientation="horizontal"
                onValueChange={(value) => setSizeValue(value)}
              >
                <Radio value="small" labelTitle="Small" />
                <Radio value="medium" labelTitle="Medium" />
                <Radio value="large" labelTitle="Large" />
              </RadioGroup>

              <div style={{ padding: '8px' }}>
                <strong>Selected:</strong> {sizeValue || '(none)'}
              </div>
            </div>
          </Paper>

          <Paper elevation={3} style={{ padding: '32px' }}>
            <h3 style={{ marginTop: '0' }}>Palette Colors</h3>
            <div style={{ display: 'flex', gap: '32px', flexWrap: 'wrap' }}>
              {(['primary', 'secondary', 'error', 'warning', 'success', 'info'] as const).map((color) => (
                <Radio value={color} name="colors" labelTitle={color} color={color} checked={color === 'primary'} />
              ))}
            </div>
          </Paper>

          <Paper elevation={3} style={{ padding: '32px' }}>
            <h3 style={{ marginTop: '0' }}>Disabled State</h3>
            <div style={{ display: 'flex', gap: '32px' }}>
              <RadioGroup name="disabled-group" labelTitle="Disabled Group" disabled defaultValue="opt1">
                <Radio value="opt1" labelTitle="Disabled checked" />
                <Radio value="opt2" labelTitle="Disabled unchecked" />
              </RadioGroup>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <Radio value="single-disabled" name="single" labelTitle="Single disabled" disabled />
                <Radio value="single-enabled" name="single" labelTitle="Single enabled" />
              </div>
            </div>
          </Paper>
        </div>
      </PageContainer>
    )
  },
})
