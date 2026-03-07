import { createComponent, Shade } from '@furystack/shades'
import {
  Checkbox,
  Icon,
  icons,
  PageContainer,
  PageHeader,
  Paper,
  Typography,
} from '@furystack/shades-common-components'

export const CheckboxesPage = Shade({
  customElementName: 'checkboxes-page',
  render: ({ useSearchState }) => {
    const [state, setState] = useSearchState('disabled', { isDisabled: false })

    return (
      <PageContainer centered>
        <PageHeader
          icon={<Icon icon={icons.checkSquare} />}
          title="Checkboxes"
          description="The Checkbox component provides a toggleable input for boolean values. It supports checked, unchecked, and indeterminate states, multiple palette colors, disabled state, and integrates with the Form validation system."
        />
        <Paper elevation={3} style={{ padding: '32px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div>
            <Typography variant="h6" style={{ margin: '0 0 12px 0' }}>
              Basic
            </Typography>
            <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
              <Checkbox labelTitle="Unchecked" disabled={state.isDisabled} />
              <Checkbox labelTitle="Checked" checked disabled={state.isDisabled} />
              <Checkbox labelTitle="Indeterminate" indeterminate disabled={state.isDisabled} />
            </div>
          </div>

          <div>
            <Typography variant="h6" style={{ margin: '0 0 12px 0' }}>
              Colors
            </Typography>
            <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
              <Checkbox labelTitle="Primary" color="primary" checked disabled={state.isDisabled} />
              <Checkbox labelTitle="Secondary" color="secondary" checked disabled={state.isDisabled} />
              <Checkbox labelTitle="Error" color="error" checked disabled={state.isDisabled} />
              <Checkbox labelTitle="Warning" color="warning" checked disabled={state.isDisabled} />
              <Checkbox labelTitle="Success" color="success" checked disabled={state.isDisabled} />
              <Checkbox labelTitle="Info" color="info" checked disabled={state.isDisabled} />
            </div>
          </div>

          <div>
            <Typography variant="h6" style={{ margin: '0 0 12px 0' }}>
              Disabled
            </Typography>
            <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
              <Checkbox labelTitle="Disabled unchecked" disabled />
              <Checkbox labelTitle="Disabled checked" checked disabled />
              <Checkbox labelTitle="Disabled indeterminate" indeterminate disabled />
            </div>
          </div>

          <div>
            <Typography variant="h6" style={{ margin: '0 0 12px 0' }}>
              Without labels
            </Typography>
            <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
              <Checkbox disabled={state.isDisabled} />
              <Checkbox checked disabled={state.isDisabled} />
              <Checkbox indeterminate disabled={state.isDisabled} />
              <Checkbox color="secondary" checked disabled={state.isDisabled} />
              <Checkbox color="error" checked disabled={state.isDisabled} />
              <Checkbox color="success" checked disabled={state.isDisabled} />
            </div>
          </div>

          <Checkbox
            labelTitle={state.isDisabled ? 'Enable all checkboxes above' : 'Disable all checkboxes above'}
            checked={state.isDisabled}
            color="secondary"
            onchange={() => {
              setState({ isDisabled: !state.isDisabled })
            }}
          />
        </Paper>
      </PageContainer>
    )
  },
})
