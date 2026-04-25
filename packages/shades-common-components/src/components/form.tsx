import type { Token } from '@furystack/inject'
import { defineService } from '@furystack/inject'
import type { ChildrenList, PartialElement } from '@furystack/shades'
import { Shade, createComponent } from '@furystack/shades'
import { ObservableValue } from '@furystack/utils'
import { cssVariableTheme } from '../services/css-variable-theme.js'
import type { InputValidationResult } from './inputs/input.js'

type UnknownFormValidationResult = { isValid: null }

type ValidFormValidationResult = { isValid: true }

type InvalidFormValidationResult = {
  isValid: false
  reason: 'validation-failed' | 'input-validation-failed' | 'unknown'
}

type FormValidationResult = ValidFormValidationResult | InvalidFormValidationResult | UnknownFormValidationResult

/**
 * Per-form state shared between the `<Form>` host and its child inputs.
 */
export interface FormService<T = unknown> extends Disposable {
  readonly validatedFormData: ObservableValue<T | null>
  readonly rawFormData: ObservableValue<{ [k: string]: FormDataEntryValue } | null>
  readonly validationResult: ObservableValue<FormValidationResult>
  readonly fieldErrors: ObservableValue<{
    [K in string]?: { validationResult: InputValidationResult; validity: ValidityState }
  }>
  readonly inputs: Set<HTMLInputElement>
  readonly isSubmitting: ObservableValue<boolean>
  readonly submitError: ObservableValue<unknown>
  setFieldState(key: keyof T, validationResult: InputValidationResult, validity: ValidityState): void
}

/**
 * Creates a fresh {@link FormService} instance. Called by `<Form>` to populate
 * the `FormContextToken` on the form's child scope so descendant inputs can
 * discover it.
 */
export const createFormService = <T,>(): FormService<T> => {
  const validatedFormData = new ObservableValue<T | null>(null)
  const rawFormData = new ObservableValue<{ [k: string]: FormDataEntryValue } | null>(null)
  const validationResult = new ObservableValue<FormValidationResult>({ isValid: null })
  const fieldErrors = new ObservableValue<{
    [K in string]?: { validationResult: InputValidationResult; validity: ValidityState }
  }>({})
  const inputs = new Set<HTMLInputElement>()
  const isSubmitting = new ObservableValue<boolean>(false)
  const submitError = new ObservableValue<unknown>(undefined)

  const setFieldState = (key: keyof T, fieldValidationResult: InputValidationResult, validity: ValidityState): void => {
    fieldErrors.setValue({
      ...fieldErrors.getValue(),
      [key]: { validationResult: fieldValidationResult, validity },
    })
  }

  return {
    validatedFormData,
    rawFormData,
    validationResult,
    fieldErrors,
    inputs,
    isSubmitting,
    submitError,
    setFieldState,
    [Symbol.dispose](): void {
      // eslint-disable-next-line furystack/prefer-using-wrapper -- Disposal is triggered by the owning <Form> via useDisposable.
      validatedFormData[Symbol.dispose]()
      // eslint-disable-next-line furystack/prefer-using-wrapper -- Disposal is triggered by the owning <Form> via useDisposable.
      rawFormData[Symbol.dispose]()
      // eslint-disable-next-line furystack/prefer-using-wrapper -- Disposal is triggered by the owning <Form> via useDisposable.
      validationResult[Symbol.dispose]()
      // eslint-disable-next-line furystack/prefer-using-wrapper -- Disposal is triggered by the owning <Form> via useDisposable.
      fieldErrors[Symbol.dispose]()
      // eslint-disable-next-line furystack/prefer-using-wrapper -- Disposal is triggered by the owning <Form> via useDisposable.
      isSubmitting[Symbol.dispose]()
      // eslint-disable-next-line furystack/prefer-using-wrapper -- Disposal is triggered by the owning <Form> via useDisposable.
      submitError[Symbol.dispose]()
    },
  }
}

/**
 * Scoped token used by `<Form>` to publish a {@link FormService} instance to
 * descendant inputs. Defaults to `null` so inputs rendered outside a `<Form>`
 * can gracefully skip form integration.
 */
export const FormContextToken: Token<FormService | null, 'scoped'> = defineService({
  name: '@furystack/shades-common-components/FormContextToken',
  lifetime: 'scoped',
  factory: () => null,
})

type FormProps<T> = {
  onSubmit: (formData: T) => void | Promise<void>
  onReset?: () => void
  validate: (formData: unknown) => formData is T
  disableOnSubmit?: boolean
} & PartialElement<Omit<HTMLFormElement, 'onsubmit' | 'onchange' | 'onreset'>>

export const Form: <T>(props: FormProps<T>, children: ChildrenList) => JSX.Element = Shade({
  customElementName: 'shade-form',
  elementBase: HTMLFormElement,
  elementBaseName: 'form',
  css: { fontFamily: cssVariableTheme.typography.fontFamily },
  render: ({ props, children, useDisposable, injector, useHostProps }) => {
    const formService = useDisposable('formService', () => createFormService())
    const formInjector = useDisposable('formInjector', () => {
      const scope = injector.createScope({ owner: 'form' })
      scope.bind(FormContextToken, () => formService)
      return scope
    })

    // Propagate the scoped injector on the host element so child Shade components
    // can discover it via getInjectorFromParent(). This works because useHostProps
    // assigns object values as properties on the host element, which sets the
    // `injector` setter defined on the Shade base class.
    useHostProps({ injector: formInjector })

    const changeHandler = async (ev: Event, shouldSubmit?: boolean) => {
      formService.inputs.forEach((i) => {
        const e = document.createEvent('FocusEvent')
        e.initEvent('blur', true, true)
        i.dispatchEvent(e)
      })
      const formElement = ev.currentTarget as HTMLFormElement
      const formData = Object.fromEntries(new FormData(formElement).entries())
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
          formService.isSubmitting.setValue(true)
          formService.submitError.setValue(undefined)
          if (props.disableOnSubmit) {
            formElement.inert = true
          }
          try {
            await props.onSubmit(formData)
          } catch (error) {
            formService.submitError.setValue(error)
          } finally {
            formService.isSubmitting.setValue(false)
            if (props.disableOnSubmit) {
              formElement.inert = false
            }
          }
        }
      } else {
        formService.validationResult.setValue({ isValid: false, reason: 'validation-failed' })
      }
    }

    useHostProps({
      oninvalid: (ev: Event) => {
        void changeHandler(ev)
      },
      onsubmit: (ev: SubmitEvent) => {
        ev.preventDefault()
        void changeHandler(ev, true)
      },
      onchange: (ev: Event) => {
        void changeHandler(ev)
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
