import { createComponent, Shade } from '@furystack/shades'
import { PageContainer, PageHeader, Paper, Switch } from '@furystack/shades-common-components'
import { ObservableValue } from '@furystack/utils'

export const SwitchPage = Shade({
  shadowDomName: 'switch-page',
  render: ({ useDisposable, useObservable }) => {
    const controlledValue = useDisposable('controlledValue', () => new ObservableValue(true))
    const [isControlledChecked] = useObservable('isControlledChecked', controlledValue)

    return (
      <PageContainer maxWidth="1200px" centered>
        <PageHeader
          icon="🔀"
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
              onchange={() => controlledValue.setValue(!controlledValue.getValue())}
            />
          </div>
        </Paper>
      </PageContainer>
    )
  },
})
