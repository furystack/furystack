import { createComponent, Shade } from '@furystack/shades'
import { Autocomplete, Input } from '@furystack/shades-common-components'

export const InputsPage = Shade({
  shadowDomName: 'inputs-page',
  style: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'column',
  },
  render: () => {
    return (
      <>
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
                maxLength={15}
                getStartIcon={({ state }) => <span>{state.validity.valid ? '✅' : '🛑'}</span>}
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
                labelTitle="Password Field"
                value={'passwordValue'}
                required
                minLength={5}
                type="password"
                getEndIcon={({ state }) => <span>{state.validity.valid ? '🔒' : '🔓'}</span>}
                getHelperText={({ state }) => {
                  if (!state.validity.valid) {
                    if (state.validity.valueMissing) {
                      return 'The value is required!'
                    }
                    if (state.validity.tooShort) {
                      return 'Too short!'
                    }
                  }
                  return 'A password field'
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
                  return 'You can enter a number between 1 and 100 in 0.5 steps'
                }}
              />

              <Input
                variant={variant}
                labelTitle="Date Field"
                value={'0'}
                required
                min="2022-01-01"
                max="2025-12-31"
                type="date"
                getHelperText={({ state }) => {
                  if (!state.validity.valid) {
                    if (state.validity.valueMissing) {
                      return 'The value is required!'
                    }
                    if (state.validity.rangeUnderflow) {
                      return 'Minimum allowed date is 2022-01-01!'
                    }
                    if (state.validity.rangeOverflow) {
                      return 'Maximum allowed date is 2025-12-31!'
                    }
                    return 'Invalid date!'
                  }
                  return 'A date input field. You can enter a date between 2022-2025'
                }}
              />
              <Input
                variant={variant}
                labelTitle="Time Field"
                value={'08:15'}
                required
                min="08:00"
                max="16:30"
                type="time"
                getHelperText={({ state }) => {
                  if (!state.validity.valid) {
                    if (state.validity.valueMissing) {
                      return 'The value is required!'
                    }
                    if (state.validity.rangeUnderflow) {
                      return 'Minimum allowed time is 08:00!'
                    }
                    if (state.validity.rangeOverflow) {
                      return 'Maximum allowed time is 16:30!'
                    }
                    return 'Invalid time value!'
                  }
                  return 'A time input field. You can enter a time between 08:00 and 16:30'
                }}
              />

              <Input
                variant={variant}
                labelTitle="Range Field"
                value={'0'}
                required
                min="1"
                max="100"
                step="0.5"
                type="range"
                getHelperText={() => 'You can select a specified range between 1 and 100 in 0.5 steps'}
                getEndIcon={({ state }) => <span>{state.value}</span>}
              />

              <Input
                variant={variant}
                labelTitle="Color Picker"
                value={'0'}
                required
                min="1"
                max="100"
                step="0.5"
                type="color"
                getHelperText={() => 'You can pick a color'}
              />

              <Autocomplete
                suggestions={['Apple', 'Banana', 'Orange', 'Pineapple', 'Strawberry']}
                inputProps={{
                  variant,
                  required: true,
                  labelTitle: 'Autocomplete Field',
                  getHelperText: () => 'You can select a fruit from the list',
                }}
              />
            </div>
          ))}
        </div>
      </>
    )
  },
})
