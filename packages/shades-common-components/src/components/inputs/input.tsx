import type { PartialElement } from '@furystack/shades'
import { Shade, createComponent, attachStyles } from '@furystack/shades'
import { ObservableValue } from '@furystack/utils'
import { FormService, ThemeProviderService } from '../..'
import type { Palette } from '../../services'

export type ValidInputValidationResult = { isValid: true }

export type InvalidInputValidationResult = { isValid: false; message: string }

export type InputValidationResult = ValidInputValidationResult | InvalidInputValidationResult

export interface TextInputProps extends PartialElement<HTMLInputElement> {
  /**
   * Callback that will be called when the input value changes
   */
  onTextChange?: (text: string) => void
  /**
   * An optional label title element or string
   */
  labelTitle?: JSX.Element | string

  /**
   * Optional props for the label element
   */
  labelProps?: PartialElement<HTMLLabelElement>

  /**
   * Boolean that indicates if the field will be focused automatically
   */
  autofocus?: boolean
  /**
   * The variant of the input
   */
  variant?: 'contained' | 'outlined'
  /**
   * The default color of the input (Error color will be used in case of invalid input value)
   */
  defaultColor?: keyof Palette

  /**
   * Callback for retrieving the custom validation result
   * @returns The custom validation state
   */
  getValidationResult?: (options: { state: TextInputState }) => InputValidationResult

  /**
   * Optional callback for the helper text
   */
  getHelperText?: (options: { state: TextInputState; validationResult?: InputValidationResult }) => JSX.Element | string

  /**
   * Optional callback for retrieving an icon element on the left side of the input field
   */
  getStartIcon?: (options: { state: TextInputState; validationResult?: InputValidationResult }) => JSX.Element | string

  /**
   * Optional callback for retrieving an icon element on the right side of the input field
   */
  getEndIcon?: (options: { state: TextInputState; validationResult?: InputValidationResult }) => JSX.Element | string
}

export type TextInputState = {
  value: string
  focused: boolean
  validity: ValidityState
  element: JSX.Element<TextInputProps>
}

const getLabelStyle = ({
  themeProvider,
  props,
  state,
  validationResult,
}: {
  themeProvider: ThemeProviderService
  props: TextInputProps
  state: TextInputState
  validationResult?: InputValidationResult
}): Partial<CSSStyleDeclaration> => {
  return {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    fontSize: '10px',
    color: props.disabled
      ? themeProvider.theme.text.disabled
      : state.validity?.valid === false || validationResult?.isValid === false
      ? themeProvider.theme.palette.error.main
      : state.focused
      ? themeProvider.theme.text.primary
      : themeProvider.theme.text.secondary,
    marginBottom: '1em',
    padding: '1em',
    borderRadius: '5px',
    background:
      props.variant === 'contained'
        ? themeProvider
            .getRgbFromColorString(
              state.validity?.valid === false || validationResult?.isValid === false
                ? themeProvider.theme.palette.error.main
                : themeProvider.theme.palette[props.defaultColor || 'primary'].main,
            )
            .update('a', state.focused ? 0.1 : 0.2)
            .toString()
        : 'transparent',
    boxShadow:
      props.variant === 'outlined' || props.variant === 'contained'
        ? `0 0 0 1px ${
            state.validity?.valid === false || validationResult?.isValid === false
              ? themeProvider.theme.palette.error.main
              : state.focused
              ? themeProvider.theme.palette[props.defaultColor || 'primary'].main
              : themeProvider.theme.text.primary
          }`
        : 'none',
    filter: props.disabled ? 'grayscale(100%)' : 'none',
    opacity: props.disabled ? '0.5' : '1',
    transition:
      'color 0.2s ease-in-out, filter 0.2s ease-in-out, opacity 0.2s ease-in-out, border-color 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
    ...props.labelProps?.style,
  }
}

const getDefaultMessagesForValidityState = (state: ValidityState) => {
  if (!state.valid) {
    if (state.valueMissing) {
      return 'Value is required'
    }
    if (state.typeMismatch) {
      return 'Value is not valid'
    }
    if (state.patternMismatch) {
      return 'Value does not match the pattern'
    }
    if (state.tooLong) {
      return 'Value is too long'
    }
    if (state.tooShort) {
      return 'Value is too short'
    }
    if (state.rangeUnderflow) {
      return 'Value is too low'
    }
    if (state.rangeOverflow) {
      return 'Value is too high'
    }
    if (state.stepMismatch) {
      return 'Value is not a valid step'
    }
    if (state.badInput) {
      return 'Value is not valid'
    }
  }
}

export const Input = Shade<TextInputProps>({
  shadowDomName: 'shade-input',
  constructed: ({ injector, element }) => {
    if (injector.cachedSingletons.has(FormService)) {
      const input = element.querySelector('input') as HTMLInputElement
      const formService = injector.getInstance(FormService)
      formService.inputs.add(input)
      return () => formService.inputs.delete(input)
    }
  },
  render: ({ props, injector, useObservable, element }) => {
    const themeProvider = injector.getInstance(ThemeProviderService)

    const updateState = (newState: TextInputState) => {
      const label = element.querySelector('label') as HTMLLabelElement
      const input = element.querySelector('input') as HTMLInputElement

      newState.value = input?.value || newState.value
      newState.validity = input?.validity || newState.validity
      ;(newState.validity as any).toJSON = () => {
        return {
          valid: newState.validity.valid,
          valueMissing: newState.validity.valueMissing,
          typeMismatch: newState.validity.typeMismatch,
          patternMismatch: newState.validity.patternMismatch,
          tooLong: newState.validity.tooLong,
          tooShort: newState.validity.tooShort,
          rangeUnderflow: newState.validity.rangeUnderflow,
          rangeOverflow: newState.validity.rangeOverflow,
          stepMismatch: newState.validity.stepMismatch,
          badInput: newState.validity.badInput,
        }
      }

      const validationResult = props.getValidationResult?.({ state: newState })

      validationResult?.isValid === false || newState.validity?.valid === false
        ? element.setAttribute('data-validation-failed', 'true')
        : element.removeAttribute('data-validation-failed')

      attachStyles(label, { style: getLabelStyle({ themeProvider, props, state: newState, validationResult }) })

      const helper = element.querySelector<HTMLSpanElement>('span.helperText')
      const helperNode =
        (validationResult?.isValid === false && validationResult?.message) ||
        props.getHelperText?.({ state: newState, validationResult }) ||
        getDefaultMessagesForValidityState(newState.validity) ||
        ''
      helper?.replaceChildren(helperNode)

      const startIcon = element.querySelector<HTMLSpanElement>('span.startIcon')
      startIcon?.replaceChildren(props.getStartIcon?.({ state: newState, validationResult }) || '')
      const endIcon = element.querySelector<HTMLSpanElement>('span.endIcon')
      endIcon?.replaceChildren(props.getEndIcon?.({ state: newState, validationResult }) || '')

      if (injector.cachedSingletons.has(FormService)) {
        const formService = injector.getInstance(FormService)
        formService.setFieldState(props.name as keyof unknown, validationResult || { isValid: true }, newState.validity)
      }
      return newState
    }

    const [state, setState] = useObservable<TextInputState>(
      'inputState',
      new ObservableValue({
        value: props.value || '',
        focused: props.autofocus || false,
        validity: element.querySelector('input')?.validity || ({} as ValidityState),
        element,
      }),
      updateState,
    )

    return (
      <label {...props.labelProps} style={getLabelStyle({ props, state, themeProvider })}>
        {props.labelTitle}

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            width: '100%',
          }}
        >
          {props.getStartIcon ? <span className="startIcon">{props.getStartIcon?.({ state })}</span> : null}
          <input
            oninvalid={(ev) => {
              ev.preventDefault()
              const el = ev.target as HTMLInputElement
              setState({ ...state, validity: el.validity })
            }}
            onchange={(ev) => {
              const el = ev.target as HTMLInputElement
              const newValue = el.value
              setState({ ...state, value: newValue, validity: el?.validity })
              props.onTextChange?.(newValue)
              props.onchange && (props.onchange as any)(ev)
            }}
            onfocus={(ev) => {
              const el = ev.target as HTMLInputElement
              setState({ ...state, focused: true, validity: el.validity })
            }}
            onblur={(ev) => {
              const el = ev.target as HTMLInputElement
              setState({ ...state, focused: false, validity: el.validity })
            }}
            {...props}
            style={{
              color: 'inherit',
              border: 'none',
              backgroundColor: 'transparent',
              outline: 'none',
              fontSize: '12px',
              width: '100%',
              textOverflow: 'ellipsis',
              padding: '0',
              marginTop: '0.6em',
              marginBottom: '0.4em',
              flexGrow: '1',
              ...props.style,
            }}
            value={state.value}
          />
          {props.getEndIcon ? <span className="endIcon">{props.getEndIcon({ state })}</span> : null}
        </div>
        <span className="helperText">{props.getHelperText?.({ state })}</span>
      </label>
    )
  },
})
