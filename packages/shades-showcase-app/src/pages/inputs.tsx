import { createComponent, createFragment, Shade } from '@furystack/shades'
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
              <Input
                variant={variant}
                labelTitle={
                  <span>
                    <>
                      <p>a</p>
                      <p>b</p>
                      <p>c</p>
                    </>
                    Test Input Field <a href="http://google.com">alma</a>
                  </span>
                }
                value={'Test value'}
                getHelperText={() => <>A simple test input field</>}
              />
              <Input
                variant={variant}
                labelTitle="Required Input Field"
                value={'Test value'}
                required
                pattern="[a-zA-Z0-9]{3,}"
              />
              <>
                <Input variant={variant} labelTitle="Disabled Input Field" value={'Test value'} disabled />
                <TextArea variant={variant} labelTitle="Text Area" value={'Test value'} />
              </>
            </div>
          ))}
        </div>
      </div>
    )
  },
})
