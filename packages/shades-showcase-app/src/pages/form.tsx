import { Shade, createComponent } from '@furystack/shades'
import { Button, Form, FormService, Input, Paper } from '@furystack/shades-common-components'

type FormDataType = {
  email: string
  password: string
  confirmPassword: string
}

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
  css: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'column',
  },
  render: () => {
    return (
      <Paper elevation={3} style={{ padding: '32px' }}>
        <h1>Form</h1>
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
    )
  },
})
