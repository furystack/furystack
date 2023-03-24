import { Shade, createComponent } from '@furystack/shades'
import { Button, Input } from '@furystack/shades-common-components'

export const FormsPage = Shade({
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
          <form
            onsubmit={(ev) => {
              ev.preventDefault()

              const target = ev.target as HTMLFormElement

              if (target.checkValidity() && !target.querySelectorAll('[data-validation-failed=true').length) {
                const value = Object.fromEntries(new FormData(target).entries())
                console.log(value)
              }
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
                if (!state.value) {
                  return { isValid: false, message: 'The value is required' }
                }

                const password = new FormData(state.element.closest('form') as HTMLFormElement).get('password')
                if (password !== state.value) {
                  return { isValid: false, message: 'Passwords do not match' }
                }

                return { isValid: true }
              }}
            />
            <input type="hidden" name="hidden" value={{ alma: 2 } as any} />
            <Button type="reset">Reset</Button>
            <Button type="submit">Submit</Button>
          </form>
        </div>
      </div>
    )
  },
})
