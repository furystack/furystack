import { Injectable } from '@furystack/inject'
import type { ChildrenList, PartialElement } from '@furystack/shades'
import { Shade, createComponent } from '@furystack/shades'
import { ObservableValue } from '@furystack/utils'
import type { InputValidationResult } from './inputs/input.js'

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

  public [Symbol.dispose]() {
    this.validatedFormData[Symbol.dispose]()
    this.rawFormData[Symbol.dispose]()
    this.validationResult[Symbol.dispose]()
  }
}

type FormProps<T> = {
  onSubmit: (formData: T) => void
  onReset?: () => void
  validate: (formData: any) => formData is T
} & PartialElement<Omit<HTMLFormElement, 'onsubmit' | 'onchange' | 'onreset'>>

export const Form: <T>(props: FormProps<T>, children: ChildrenList) => JSX.Element = Shade({
  shadowDomName: 'shade-form',
  elementBase: HTMLFormElement,
  elementBaseName: 'form',
  render: ({ props, children, useDisposable, injector, useHostProps }) => {
    const formInjector = useDisposable('formInjector', () => injector.createChild())
    const formService = new FormService()
    formInjector.setExplicitInstance(formService)

    // Propagate the scoped injector on the host element so child Shade components
    // can discover it via getInjectorFromParent(). This works because useHostProps
    // assigns object values as properties on the host element, which sets the
    // `injector` setter defined on the Shade base class.
    useHostProps({ injector: formInjector })

    const changeHandler = (ev: Event, shouldSubmit?: boolean) => {
      formService.inputs.forEach((i) => {
        const e = document.createEvent('FocusEvent')
        e.initEvent('blur', true, true)
        i.dispatchEvent(e)
      })
      const formData = Object.fromEntries(new FormData(ev.currentTarget as HTMLFormElement).entries())
      formService.rawFormData.setValue(formData)
      const currentFieldErrors = formService.fieldErrors.getValue()

      if (
        Object.values(currentFieldErrors).some((v) => v?.validationResult.isValid === false) ||
        [...formService.inputs].some((input) => !input.validity.valid)
      ) {
        formService.validationResult.setValue({ isValid: false, reason: 'input-validation-failed' })
      } else if (props.validate(formData)) {
        formService.validationResult.setValue({ isValid: true })
        formService.validatedFormData.setValue(formData)
        if (shouldSubmit) {
          props.onSubmit(formData)
        }
      } else {
        formService.validationResult.setValue({ isValid: false, reason: 'validation-failed' })
      }
    }

    useHostProps({
      oninvalid: (ev: Event) => {
        changeHandler(ev)
      },
      onsubmit: (ev: SubmitEvent) => {
        ev.preventDefault()
        changeHandler(ev, true)
      },
      onchange: (ev: Event) => {
        changeHandler(ev)
      },
      onreset: () => {
        formService.rawFormData.setValue(null)
        formService.validationResult.setValue({ isValid: null })
        formService.validatedFormData.setValue(null)
      },
    })

    return <>{children}</>
  },
})
