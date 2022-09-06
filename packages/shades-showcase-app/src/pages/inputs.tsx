import { createComponent, Shade } from '@furystack/shades'
import { Autocomplete, Input, TextArea } from '@furystack/shades-common-components'

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
                labelTitle="Input Field"
                value={'Test value'}
                required
                pattern="[a-zA-Z0-9]{3,}"
                minLength={3}
                maxLength={10}
                getHelperText={({ state }) => {
                  if (!state.validity.valid) {
                    if (state.validity.valueMissing) {
                      return 'The value is required!'
                    }
                    if (state.validity.patternMismatch) {
                      return 'Invalid characters!'
                    }
                    if (state.validity.tooShort) {
                      return 'Too short!'
                    }
                    if (state.validity.tooLong) {
                      return 'Too long!'
                    }
                  }
                  return 'A simple text input field'
                }}
              />
              <Input
                variant={variant}
                labelTitle="Number Field"
                value={'0'}
                required
                min="1"
                max="100"
                step="0.5"
                type="number"
                getHelperText={({ state }) => {
                  if (!state.validity.valid) {
                    if (state.validity.valueMissing) {
                      return 'The value is required!'
                    }
                    if (state.validity.stepMismatch) {
                      return 'The value has to be divisible by 0.5'
                    }
                    if (state.validity.rangeUnderflow) {
                      return 'Has to be bigger than 1!'
                    }
                    if (state.validity.rangeOverflow) {
                      return 'Must be less than 100!'
                    }
                    return 'Invalid number!'
                  }
                  return 'A simple text field'
                }}
              />
              <TextArea variant={variant} labelTitle="Text Area" value={'Test value'} />
              <Autocomplete suggestions={['value1', 'foo', 'bar']} />
            </div>
          ))}
        </div>
      </div>
    )
  },
})
