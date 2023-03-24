import { Shade, createComponent } from '@furystack/shades'
import { Button, Form, FormService, Input } from '@furystack/shades-common-components'

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
      <div>
        <pre>Raw: {JSON.stringify(rawFormData, null, 2)}</pre>
        <pre>Validated: {JSON.stringify(validatedFormData, null, 2)}</pre>
        <pre>Status: {JSON.stringify(validationResult, null, 2)}</pre>
        <pre>Field errors: {JSON.stringify(fieldErrors, null, 2)}</pre>
      </div>
    )
  },
})

export const FormPage = Shade({
  shadowDomName: 'forms-page',
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
        <h1>Form</h1>
        <div style={{ display: 'flex', gap: '32px' }}>
          <Form<FormDataType>
            onSubmit={console.log}
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
            <hr />
            <FormStatusMonitor />
          </Form>
        </div>
      </div>
    )
  },
})
