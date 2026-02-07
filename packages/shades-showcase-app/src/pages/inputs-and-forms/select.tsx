import { createComponent, Shade } from '@furystack/shades'
import { PageContainer, PageHeader, Paper, Select } from '@furystack/shades-common-components'

const fruitOptions = [
  { value: 'apple', label: 'Apple' },
  { value: 'banana', label: 'Banana' },
  { value: 'cherry', label: 'Cherry' },
  { value: 'dragonfruit', label: 'Dragonfruit' },
  { value: 'elderberry', label: 'Elderberry' },
]

const colorOptions = [
  { value: 'red', label: 'Red' },
  { value: 'green', label: 'Green' },
  { value: 'blue', label: 'Blue' },
  { value: 'yellow', label: 'Yellow', disabled: true },
  { value: 'purple', label: 'Purple' },
]

const countryOptions = [
  { value: 'us', label: 'United States' },
  { value: 'uk', label: 'United Kingdom' },
  { value: 'de', label: 'Germany' },
  { value: 'fr', label: 'France' },
  { value: 'jp', label: 'Japan' },
  { value: 'au', label: 'Australia' },
  { value: 'br', label: 'Brazil' },
  { value: 'ca', label: 'Canada' },
  { value: 'in', label: 'India' },
  { value: 'mx', label: 'Mexico' },
]

export const SelectPage = Shade({
  shadowDomName: 'select-page',
  render: () => {
    return (
      <PageContainer maxWidth="1200px" centered>
        <PageHeader
          icon="📋"
          title="Select"
          description="Select components provide a dropdown menu for choosing a single option from a list. Three visual variants are available: default, outlined, and contained. Supports keyboard navigation, disabled options, validation, and helper text."
        />
        <Paper elevation={3} style={{ padding: '32px' }}>
          <div style={{ display: 'flex', gap: '32px' }}>
            {([undefined, 'outlined', 'contained'] as const).map((variant) => (
              <div style={{ flex: '1' }}>
                <h3>{variant || 'default'}</h3>
                <Select
                  variant={variant}
                  labelTitle="Fruit"
                  options={fruitOptions}
                  placeholder="Choose a fruit..."
                  getHelperText={() => 'Select your favorite fruit'}
                />
                <Select
                  variant={variant}
                  labelTitle="Color"
                  options={colorOptions}
                  value="green"
                  getHelperText={() => 'Yellow is disabled'}
                />
                <Select
                  variant={variant}
                  labelTitle="Required Field"
                  options={fruitOptions}
                  required
                  placeholder="You must select one..."
                  getHelperText={({ state }) => {
                    if (!state.value) {
                      return 'This field is required'
                    }
                    return `You selected: ${state.value}`
                  }}
                />
                <Select
                  variant={variant}
                  labelTitle="Country"
                  options={countryOptions}
                  placeholder="Pick a country..."
                  getHelperText={() => 'Scrollable dropdown with many options'}
                />
                <Select
                  variant={variant}
                  labelTitle="Disabled Select"
                  options={fruitOptions}
                  value="cherry"
                  disabled
                  getHelperText={() => 'This select is disabled'}
                />
                <Select
                  variant={variant}
                  labelTitle="With Validation"
                  options={fruitOptions}
                  placeholder="Choose..."
                  defaultColor="secondary"
                  getValidationResult={({ state }) => {
                    if (state.value === 'banana') {
                      return { isValid: false, message: 'Banana is not allowed!' }
                    }
                    return { isValid: true }
                  }}
                  getHelperText={({ state, validationResult }) => {
                    if (validationResult?.isValid === false) {
                      return validationResult.message
                    }
                    return state.value ? `Good choice: ${state.value}` : 'Try selecting banana...'
                  }}
                />
              </div>
            ))}
          </div>
        </Paper>
      </PageContainer>
    )
  },
})
