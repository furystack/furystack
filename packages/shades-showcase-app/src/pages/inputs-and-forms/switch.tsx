import { createComponent, Shade } from '@furystack/shades'
import { Icon, icons, PageContainer, PageHeader, Paper, Switch } from '@furystack/shades-common-components'

export const SwitchPage = Shade({
  shadowDomName: 'switch-page',
  render: ({ useState }) => {
    const [isControlledChecked, setIsControlledChecked] = useState('controlledValue', true)

    return (
      <PageContainer centered>
        <PageHeader
          icon={<Icon icon={icons.shuffle} />}
          title="Switch"
          description="Switch components provide a toggle control for binary on/off states. They support palette colors, disabled state, two sizes (small and medium), and integrate with the Form component for form handling. Switches use the role='switch' attribute for accessibility."
        />

        <Paper elevation={3} style={{ padding: '32px' }}>
          <h3>Basic Switches</h3>
          <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap', alignItems: 'center' }}>
            <Switch />
            <Switch checked />
            <Switch labelTitle="With label" />
            <Switch checked labelTitle="Checked with label" />
          </div>
        </Paper>

        <Paper elevation={3} style={{ padding: '32px', marginTop: '24px' }}>
          <h3>Colors</h3>
          <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap', alignItems: 'center' }}>
            {(['primary', 'secondary', 'error', 'warning', 'success', 'info'] as const).map((color) => (
              <Switch checked color={color} labelTitle={color} />
            ))}
          </div>
        </Paper>

        <Paper elevation={3} style={{ padding: '32px', marginTop: '24px' }}>
          <h3>Sizes</h3>
          <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap', alignItems: 'center' }}>
            <Switch checked size="small" labelTitle="Small" />
            <Switch checked size="medium" labelTitle="Medium (default)" />
          </div>
        </Paper>

        <Paper elevation={3} style={{ padding: '32px', marginTop: '24px' }}>
          <h3>Disabled</h3>
          <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap', alignItems: 'center' }}>
            <Switch disabled labelTitle="Disabled off" />
            <Switch disabled checked labelTitle="Disabled on" />
            <Switch disabled checked color="secondary" labelTitle="Disabled secondary" />
          </div>
        </Paper>

        <Paper elevation={3} style={{ padding: '32px', marginTop: '24px' }}>
          <h3>Controlled</h3>
          <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap', alignItems: 'center' }}>
            <Switch
              checked={isControlledChecked}
              labelTitle={isControlledChecked ? 'On' : 'Off'}
              onchange={() => setIsControlledChecked(!isControlledChecked)}
            />
          </div>
        </Paper>
      </PageContainer>
    )
  },
})
