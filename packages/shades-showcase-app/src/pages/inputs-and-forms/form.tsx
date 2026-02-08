import { Shade, createComponent } from '@furystack/shades'
import {
  Alert,
  Button,
  Checkbox,
  Divider,
  Form,
  FormService,
  Input,
  PageContainer,
  PageHeader,
  Paper,
  Radio,
  RadioGroup,
  Select,
  Switch,
  TextArea,
  Tooltip,
  Typography,
} from '@furystack/shades-common-components'
import { ObservableValue } from '@furystack/utils'

type FormDataType = {
  email: string
  password: string
  confirmPassword: string
}

type AdvancedFormData = {
  fullName: string
  email: string
  experienceLevel: string
  track: string
  acceptTerms: string
}

type FormAlertProps = {
  alertState: ObservableValue<'success' | 'error' | null>
}

const FormAlert = Shade<FormAlertProps>({
  shadowDomName: 'shade-form-alert',
  render: ({ props, useObservable }) => {
    const [currentAlert] = useObservable('currentAlert', props.alertState)

    if (currentAlert === 'success') {
      return (
        <Alert
          severity="success"
          title="Registration Successful"
          variant="filled"
          onClose={() => props.alertState.setValue(null)}
          style={{ marginBottom: '16px' }}
        >
          Your event registration has been submitted.
        </Alert>
      )
    }
    if (currentAlert === 'error') {
      return (
        <Alert
          severity="error"
          title="Validation Failed"
          variant="filled"
          onClose={() => props.alertState.setValue(null)}
          style={{ marginBottom: '16px' }}
        >
          Please fix the errors below and try again.
        </Alert>
      )
    }
    return <></>
  },
})

const FormStatusMonitor = Shade({
  shadowDomName: 'shade-form-status-monitor',
  render: ({ injector, useObservable }) => {
    const formService = injector.getInstance(FormService)
    const [rawFormData] = useObservable('rawFormData', formService.rawFormData)
    const [validatedFormData] = useObservable('validatedFormData', formService.validatedFormData)
    const [validationResult] = useObservable('validationResult', formService.validationResult)
    const [fieldErrors] = useObservable('fieldErrors', formService.fieldErrors)
    return (
      <>
        <pre id="raw">Raw: {JSON.stringify(rawFormData, null, 2)}</pre>
        <pre id="validated">Validated: {JSON.stringify(validatedFormData, null, 2)}</pre>
        <pre id="status">Status: {JSON.stringify(validationResult, null, 2)}</pre>
        <pre id="fieldErrors">Field errors: {JSON.stringify(fieldErrors, null, 2)}</pre>
      </>
    )
  },
})

export const FormPage = Shade({
  shadowDomName: 'forms-page',
  render: ({ useDisposable }) => {
    const alertState = useDisposable('alertState', () => new ObservableValue<'success' | 'error' | null>(null))

    return (
      <PageContainer maxWidth="800px" centered>
        <PageHeader
          icon="📋"
          title="Form Handling"
          description="The Form component wraps native HTML forms with type-safe data handling and validation. It integrates with FormService to provide observable form state, including raw form data, validated data, validation results, and field-level errors. Custom validation functions can be provided to implement complex cross-field validation logic like password confirmation matching."
        />
        <Paper elevation={3} style={{ padding: '32px' }}>
          <div style={{ display: 'flex', gap: '32px' }}>
            <Form<FormDataType>
              onSubmit={(data) => {
                alert(`Submitted: ${JSON.stringify(data, null, 2)}`)
              }}
              style={{
                width: '300px',
              }}
              validate={(formData): formData is FormDataType => {
                return !!(
                  typeof (formData as FormDataType).email === 'string' &&
                  typeof (formData as FormDataType).password === 'string' &&
                  typeof (formData as FormDataType).confirmPassword === 'string'
                )
              }}
            >
              <div id="fieldset">
                <Input labelTitle="Email" name="email" variant="outlined" required type="email" />
                <Input labelTitle="Password" name="password" variant="outlined" required type="password" />
                <Input
                  labelTitle="Confirm password"
                  name="confirmPassword"
                  variant="outlined"
                  required
                  type="password"
                  getValidationResult={({ state }) => {
                    const password = new FormData(state.element.closest('form') as HTMLFormElement).get('password')
                    if (password !== state.value) {
                      return { isValid: false, message: 'Passwords do not match' }
                    }

                    return { isValid: true }
                  }}
                />
                <div style={{ display: 'flex' }}>
                  <Button style={{ flexGrow: '1', justifyContent: 'center' }} type="reset" variant="outlined">
                    Reset
                  </Button>
                  <Button
                    style={{ flexGrow: '1', justifyContent: 'center' }}
                    type="submit"
                    color="primary"
                    variant="contained"
                  >
                    Submit
                  </Button>
                </div>
              </div>
              <hr />
              <FormStatusMonitor />
            </Form>
          </div>
        </Paper>

        <Paper elevation={3} style={{ padding: '32px', marginTop: '24px' }}>
          <Typography variant="h3" style={{ marginTop: '0' }}>
            Advanced Form
          </Typography>
          <Typography variant="body1" style={{ opacity: '0.7' }}>
            An event registration form showcasing all input components with validation, dividers, tooltips, and
            submission feedback alerts.
          </Typography>

          <FormAlert alertState={alertState} />

          <Form<AdvancedFormData>
            onSubmit={() => {
              alertState.setValue('success')
            }}
            validate={(formData): formData is AdvancedFormData => {
              const data = formData as Partial<AdvancedFormData>
              const isValid = !!(
                typeof data.fullName === 'string' &&
                data.fullName.length >= 2 &&
                typeof data.email === 'string' &&
                typeof data.experienceLevel === 'string' &&
                typeof data.track === 'string' &&
                data.acceptTerms === 'yes'
              )
              if (!isValid) {
                alertState.setValue('error')
              }
              return isValid
            }}
          >
            <Divider textAlign="left" style={{ margin: '16px 0' }}>
              Personal Information
            </Divider>

            <div style={{ display: 'flex', gap: '16px' }}>
              <div style={{ flex: '1' }}>
                <Input
                  labelTitle={
                    <Tooltip title="Enter your full legal name as it appears on your ID" placement="top">
                      <span>Full Name</span>
                    </Tooltip>
                  }
                  name="fullName"
                  variant="outlined"
                  required
                  getValidationResult={({ state }) => {
                    if (state.validity.valueMissing) {
                      return { isValid: false, message: 'Full name is required' }
                    }
                    if (state.value.length > 0 && state.value.length < 2) {
                      return { isValid: false, message: 'Name must be at least 2 characters' }
                    }
                    return { isValid: true }
                  }}
                  getHelperText={() => 'As it appears on your ID'}
                />
              </div>
              <div style={{ flex: '1' }}>
                <Input
                  labelTitle="Email"
                  name="email"
                  variant="outlined"
                  required
                  type="email"
                  getValidationResult={({ state }) => {
                    if (state.validity.valueMissing) {
                      return { isValid: false, message: 'Email address is required' }
                    }
                    if (state.validity.typeMismatch) {
                      return { isValid: false, message: 'Please enter a valid email (e.g. name@example.com)' }
                    }
                    return { isValid: true }
                  }}
                  getHelperText={() => "We'll send your registration confirmation here"}
                />
              </div>
            </div>

            <TextArea labelTitle="Bio" variant="outlined" placeholder="Tell us about yourself..." />

            <Divider textAlign="left" style={{ margin: '16px 0' }}>
              Event Preferences
            </Divider>

            <div style={{ marginBottom: '1.25em' }}>
              <RadioGroup name="experienceLevel" labelTitle="Experience Level">
                <Radio value="beginner" labelTitle="Beginner" />
                <Radio value="intermediate" labelTitle="Intermediate" />
                <Radio value="advanced" labelTitle="Advanced" />
              </RadioGroup>
            </div>

            <Select
              name="track"
              labelTitle="Track"
              variant="outlined"
              required
              placeholder="Select a track"
              options={[
                { value: 'frontend', label: 'Frontend' },
                { value: 'backend', label: 'Backend' },
                { value: 'devops', label: 'DevOps' },
                { value: 'design', label: 'Design' },
              ]}
              getValidationResult={({ state }) => {
                if (!state.value) {
                  return { isValid: false, message: 'Please select a track' }
                }
                return { isValid: true }
              }}
            />

            <Divider textAlign="left" style={{ margin: '16px 0' }}>
              Additional Options
            </Divider>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '1.25em' }}>
              <Checkbox name="workshops" value="yes" labelTitle="Workshops" />
              <Checkbox name="networking" value="yes" labelTitle="Networking" />
              <Checkbox name="talks" value="yes" labelTitle="Lightning Talks" />
            </div>

            <div style={{ marginBottom: '1.25em' }}>
              <Switch name="notifications" value="yes" labelTitle="Receive email notifications" />
            </div>

            <Divider style={{ margin: '16px 0' }} />

            <div style={{ marginBottom: '1.25em' }}>
              <Checkbox name="acceptTerms" value="yes" labelTitle="I accept the terms and conditions" required />
            </div>

            <div style={{ display: 'flex', marginTop: '16px' }}>
              <Button style={{ flexGrow: '1', justifyContent: 'center' }} type="reset" variant="outlined">
                Reset
              </Button>
              <Button
                style={{ flexGrow: '1', justifyContent: 'center' }}
                type="submit"
                color="primary"
                variant="contained"
              >
                Register
              </Button>
            </div>

            <hr />
            <FormStatusMonitor />
          </Form>
        </Paper>
      </PageContainer>
    )
  },
})
