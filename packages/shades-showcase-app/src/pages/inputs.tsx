import { createComponent, Shade } from '@furystack/shades'
import { Input, TextArea } from '@furystack/shades-common-components'

export const InputsPage = Shade({
  shadowDomName: 'inputs-page',
  render: () => {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'column',
        }}
      >
        <h1>Inputs</h1>
        <div style={{ display: 'flex', gap: '32px' }}>
          {([undefined, 'outlined', 'contained'] as const).map((variant) => (
            <div>
              <h3>{variant || 'default'}</h3>
              <Input variant={variant} labelTitle="Test Input Field" value={'Test value'} />
              <Input
                variant={variant}
                labelTitle="Required Input Field"
                value={'Test value'}
                required
                pattern="[a-zA-Z0-9]{3,}"
              />
              <TextArea variant={variant} labelTitle="Text Area" value={'Test value'} />
            </div>
          ))}
        </div>
      </div>
    )
  },
})
