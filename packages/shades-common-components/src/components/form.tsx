import type { ChildrenList, PartialElement } from '@furystack/shades'
import { Shade, createComponent } from '@furystack/shades'
import type { InputValidationResult } from './inputs'
import { Injectable } from '../../../inject/src'
import { ObservableValue } from '../../../utils/src'

type UnknownFormValidationResult = { isValid: null }

type ValidFormValidationResult = { isValid: true }

type InvalidFormValidationResult = {
  isValid: false
  reason: 'validation-failed' | 'input-validation-failed' | 'unknown'
}

type FormValidationResult = ValidFormValidationResult | InvalidFormValidationResult | UnknownFormValidationResult

@Injectable({ lifetime: 'scoped' })
export class FormService<T> {
  public validatedFormData = new ObservableValue<T | null>(null)

  public rawFormData = new ObservableValue<{ [k: string]: FormDataEntryValue } | null>(null)

  public validationResult = new ObservableValue<FormValidationResult>({ isValid: null })

  public fieldErrors = new ObservableValue<{
    [K in string]?: { validationResult: InputValidationResult; validity: ValidityState }
  }>({})

  public inputs = new Set<HTMLInputElement>()

  public setFieldState = (key: keyof T, validationResult: InputValidationResult, validity: ValidityState) => {
    this.fieldErrors.setValue({ ...this.fieldErrors.getValue(), [key]: { validationResult, validity } })
  }

  public dispose() {
    this.validatedFormData.dispose()
    this.rawFormData.dispose()
    this.validationResult.dispose()
  }
}

type FormProps<T> = {
  onSubmit: (formData: T) => void
  onReset?: () => void
  validate: (formData: any) => formData is T
} & PartialElement<Omit<HTMLFormElement, 'onsubmit' | 'onchange' | 'onreset'>>

export const Form: <T>(props: FormProps<T>, children: ChildrenList) => JSX.Element = Shade({
  shadowDomName: 'shade-form',
  render: ({ props, children, useDisposable, element, injector }) => {
    const formInjector = useDisposable('formInjector', () => injector.createChild({ owner: element }))
    element.injector = formInjector
    const formService = new FormService()
    formInjector.setExplicitInstance(formService)

    const changeHandler = (ev: Event, shouldSubmit?: boolean) => {
      ev.preventDefault()
      formService.inputs.forEach((i) => {
        const e = document.createEvent('FocusEvent')
        e.initEvent('blur', true, true)
        i.dispatchEvent(e)
      })
      const formData = Object.fromEntries(new FormData(ev.currentTarget as HTMLFormElement).entries())
      formService.rawFormData.setValue(formData)
      const currentFieldErrors = formService.fieldErrors.getValue()

      if (Object.values(currentFieldErrors).some((v) => v?.validationResult.isValid === false)) {
        formService.validationResult.setValue({ isValid: false, reason: 'input-validation-failed' })
      } else if (props.validate(formData)) {
        formService.validationResult.setValue({ isValid: true })
        formService.validatedFormData.setValue(formData)
        shouldSubmit && props.onSubmit(formData)
      } else {
        formService.validationResult.setValue({ isValid: false, reason: 'validation-failed' })
      }
    }

    return (
      <form
        {...props}
        onsubmit={(ev: SubmitEvent) => {
          changeHandler(ev, true)
        }}
        onchange={changeHandler}
        onreset={() => {
          formService.rawFormData.setValue(null)
          formService.validationResult.setValue({ isValid: null })
          formService.validatedFormData.setValue(null)
        }}
      >
        {children}
      </form>
    )
  },
})
