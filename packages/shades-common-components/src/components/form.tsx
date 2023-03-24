import type { ChildrenList } from '@furystack/shades'
import { Shade, createComponent } from '@furystack/shades'
import type { InputValidationResult } from './inputs'
import { Injectable } from '../../../inject/src'
import { ObservableValue } from '../../../utils/src'

type UnknownFormValidationResult = { isValid: null }

type ValidFormValidationResult = { isValid: true }

type InvalidFormValidationResult<T> = {
  isValid: false
  message: string
  inputValidationResults?: { [K in keyof T]: InputValidationResult }
}

type FormValidationResult = ValidFormValidationResult | InvalidFormValidationResult<any> | UnknownFormValidationResult

@Injectable({ lifetime: 'scoped' })
class FormService<T> {
  public validatedFormData = new ObservableValue<T | null>(null)

  public rawFormData = new ObservableValue<FormData | null>(null)

  public validationResult = new ObservableValue<FormValidationResult>({ isValid: null })

  public formEvents = {
    onsubmit: (ev: SubmitEvent) => {
      ev.preventDefault()
      // const formData = Object.fromEntries(new FormData(ev.target as HTMLFormElement).entries())
      // if (props.validate(formData)) {
      //   props.onSubmit(formData)
      // } else {
      //   props.onValidationFailed({ '': 'Invalid form data' })
      // }
    },
  }

  public dispose() {
    this.validatedFormData.dispose()
    this.rawFormData.dispose()
    this.validationResult.dispose()
  }
}

interface FormProps<T> {
  formService: FormService<T>
  onSubmit: (formData: T) => void
  onReset?: () => void
  validate: (formData: any) => formData is T
  onValidationFailed: (errors: { [key in keyof T]: InputValidationResult }) => void
}

export const Form: <T>(props: FormProps<T>, children: ChildrenList) => JSX.Element = Shade({
  shadowDomName: 'shade-form',
  render: ({ props, children }) => {
    return (
      <form
        // onsubmit={(ev) => {}}
        oninvalid={(ev) => {
          ev.preventDefault()
          // const formData = Object.fromEntries(new FormData(ev.target as HTMLFormElement).entries())
        }}
        onreset={() => {
          props.onReset?.()
        }}
      >
        {children}
      </form>
    )
  },
})
