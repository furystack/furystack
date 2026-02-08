import { createComponent, Shade } from '@furystack/shades'
import type { SelectOptionGroup } from '@furystack/shades-common-components'
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

const foodGroups: SelectOptionGroup[] = [
  {
    label: 'Fruits',
    options: [
      { value: 'apple', label: 'Apple' },
      { value: 'banana', label: 'Banana' },
      { value: 'cherry', label: 'Cherry' },
    ],
  },
  {
    label: 'Vegetables',
    options: [
      { value: 'carrot', label: 'Carrot' },
      { value: 'broccoli', label: 'Broccoli' },
      { value: 'spinach', label: 'Spinach' },
    ],
  },
  {
    label: 'Grains',
    options: [
      { value: 'rice', label: 'Rice' },
      { value: 'wheat', label: 'Wheat' },
      { value: 'oats', label: 'Oats' },
    ],
  },
]

const programmingLanguages = [
  { value: 'ts', label: 'TypeScript' },
  { value: 'js', label: 'JavaScript' },
  { value: 'py', label: 'Python' },
  { value: 'rs', label: 'Rust' },
  { value: 'go', label: 'Go' },
  { value: 'java', label: 'Java' },
  { value: 'cs', label: 'C#' },
  { value: 'cpp', label: 'C++' },
  { value: 'rb', label: 'Ruby' },
  { value: 'swift', label: 'Swift' },
  { value: 'kt', label: 'Kotlin' },
  { value: 'php', label: 'PHP' },
]

export const SelectPage = Shade({
  shadowDomName: 'select-page',
  render: () => {
    return (
      <PageContainer maxWidth="1200px" centered>
        <PageHeader
          icon="📋"
          title="Select"
          description="Select components provide a dropdown menu for choosing options from a list. Supports single and multi-select modes, searchable/filterable dropdowns, option groups, and all visual variants."
        />

        <Paper elevation={3} style={{ padding: '32px', marginBottom: '32px' }}>
          <h2 style={{ marginTop: '0' }}>Single Select</h2>
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
                    return `You selected: ${Array.isArray(state.value) ? state.value.join(', ') : state.value}`
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
                    return state.value
                      ? `Good choice: ${Array.isArray(state.value) ? state.value.join(', ') : state.value}`
                      : 'Try selecting banana...'
                  }}
                />
              </div>
            ))}
          </div>
        </Paper>

        <Paper elevation={3} style={{ padding: '32px', marginBottom: '32px' }}>
          <h2 style={{ marginTop: '0' }}>Multi-Select</h2>
          <div style={{ opacity: '0.7', marginTop: '0', marginBottom: '16px', fontSize: '0.9rem' }}>
            Use mode="multiple" to allow selecting multiple options. Selected values are shown as chips.
          </div>
          <div style={{ display: 'flex', gap: '32px' }}>
            {([undefined, 'outlined', 'contained'] as const).map((variant) => (
              <div style={{ flex: '1' }}>
                <h3>{variant || 'default'}</h3>
                <Select
                  variant={variant}
                  labelTitle="Favorite Fruits"
                  options={fruitOptions}
                  mode="multiple"
                  placeholder="Select fruits..."
                  getHelperText={({ state }) => {
                    const count = Array.isArray(state.value) ? state.value.length : 0
                    return count > 0 ? `${count} selected` : 'Pick one or more'
                  }}
                />
                <Select
                  variant={variant}
                  labelTitle="Colors (with disabled)"
                  options={colorOptions}
                  mode="multiple"
                  value={['red', 'blue']}
                  getHelperText={() => 'Yellow is disabled'}
                />
              </div>
            ))}
          </div>
        </Paper>

        <Paper elevation={3} style={{ padding: '32px', marginBottom: '32px' }}>
          <h2 style={{ marginTop: '0' }}>Searchable Select</h2>
          <div style={{ opacity: '0.7', marginTop: '0', marginBottom: '16px', fontSize: '0.9rem' }}>
            Use showSearch to add a search/filter input inside the dropdown. Filters options in real-time.
          </div>
          <div style={{ display: 'flex', gap: '32px' }}>
            <div style={{ flex: '1' }}>
              <Select
                variant="outlined"
                labelTitle="Search Countries"
                options={countryOptions}
                showSearch
                placeholder="Type to search..."
                getHelperText={() => 'Start typing to filter countries'}
              />
            </div>
            <div style={{ flex: '1' }}>
              <Select
                variant="outlined"
                labelTitle="Languages (multi + search)"
                options={programmingLanguages}
                mode="multiple"
                showSearch
                placeholder="Search languages..."
                getHelperText={({ state }) => {
                  const count = Array.isArray(state.value) ? state.value.length : 0
                  return count > 0 ? `${count} language(s) selected` : 'Search and pick languages'
                }}
              />
            </div>
            <div style={{ flex: '1' }}>
              <Select
                variant="outlined"
                labelTitle="Custom Filter"
                options={fruitOptions}
                showSearch
                filterOption={(text, opt) => opt.value.startsWith(text.toLowerCase())}
                placeholder="Filter by value prefix..."
                getHelperText={() => 'Filters by option value prefix (e.g. "ch" for cherry)'}
              />
            </div>
          </div>
        </Paper>

        <Paper elevation={3} style={{ padding: '32px' }}>
          <h2 style={{ marginTop: '0' }}>Option Groups</h2>
          <div style={{ opacity: '0.7', marginTop: '0', marginBottom: '16px', fontSize: '0.9rem' }}>
            Use optionGroups to organize options under labeled headers.
          </div>
          <div style={{ display: 'flex', gap: '32px' }}>
            <div style={{ flex: '1' }}>
              <Select
                variant="outlined"
                labelTitle="Food Category"
                optionGroups={foodGroups}
                placeholder="Pick a food..."
                getHelperText={() => 'Options are grouped by category'}
              />
            </div>
            <div style={{ flex: '1' }}>
              <Select
                variant="outlined"
                labelTitle="Food (multi + groups)"
                optionGroups={foodGroups}
                mode="multiple"
                placeholder="Select foods..."
                getHelperText={({ state }) => {
                  const count = Array.isArray(state.value) ? state.value.length : 0
                  return count > 0 ? `${count} food(s) selected` : 'Multi-select with groups'
                }}
              />
            </div>
            <div style={{ flex: '1' }}>
              <Select
                variant="outlined"
                labelTitle="Food (searchable groups)"
                optionGroups={foodGroups}
                showSearch
                placeholder="Search foods..."
                getHelperText={() => 'Search filters within groups'}
              />
            </div>
          </div>
        </Paper>
      </PageContainer>
    )
  },
})
