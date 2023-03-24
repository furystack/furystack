import type { ChildrenList } from '@furystack/shades'
import { Shade, createComponent } from '@furystack/shades'
import type { InputValidationResult } from './inputs'
import { Injectable } from '../../../inject/src'
import { ObservableValue } from '../../../utils/src'

type UnknownFormValidationResult = { isValid: null }

type ValidFormValidationResult = { isValid: true }

type InvalidFormValidationResult = {
  isValid: false
  reason: 'validation-failed' | 'form-oninvalid-event' | 'unknown'
}

type FormValidationResult = ValidFormValidationResult | InvalidFormValidationResult | UnknownFormValidationResult

@Injectable({ lifetime: 'scoped' })
class FormService<T> {
  public validatedFormData = new ObservableValue<T | null>(null)

  public rawFormData = new ObservableValue<{ [k: string]: FormDataEntryValue } | null>(null)

  public validationResult = new ObservableValue<FormValidationResult>({ isValid: null })

  public formEvents: Pick<HTMLFormElement, 'onsubmit' | 'oninavlid'> = {
    oninavlid: () => {
      this.rawFormData.setValue(null)
      this.validationResult.setValue({ isValid: false, reason: 'form-oninvalid-event' })
      this.validatedFormData.setValue(null)
    },
    onsubmit: (ev: SubmitEvent) => {
      ev.preventDefault()
      const formData = Object.fromEntries(new FormData(ev.target as HTMLFormElement).entries())
      this.rawFormData.setValue(formData)
      if (this.validate(formData)) {
        this.validationResult.setValue({ isValid: true })
        this.validatedFormData.setValue(formData)
      } else {
        this.validationResult.setValue({ isValid: false, reason: 'validation-failed' })
      }
    },
  }

  public dispose() {
    this.validatedFormData.dispose()
    this.rawFormData.dispose()
    this.validationResult.dispose()
  }

  constructor(public readonly validate: (formData: any) => formData is T) {}
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
        {...props.formService.formEvents}
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
