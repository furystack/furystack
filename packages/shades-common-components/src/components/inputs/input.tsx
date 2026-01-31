import type { PartialElement } from '@furystack/shades'
import { Shade, createComponent } from '@furystack/shades'
import { ObservableValue } from '@furystack/utils'
import type { Palette } from '../../services/theme-provider-service.js'
import { ThemeProviderService } from '../../services/theme-provider-service.js'
import { FormService } from '../form.js'

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

declare global {
  interface ValidityState {
    toJSON: () => Partial<ValidityState>
  }
}

export type TextInputState = {
  value: string
  focused: boolean
  validity: ValidityState
  element: JSX.Element<TextInputProps>
}

/**
 * Computes and sets CSS custom properties on the label element based on current state
 */
const setLabelCSSProperties = ({
  label,
  themeProvider,
  props,
  state,
  validationResult,
}: {
  label: HTMLLabelElement
  themeProvider: ThemeProviderService
  props: TextInputProps
  state: TextInputState
  validationResult?: InputValidationResult
}): void => {
  const isError = state.validity?.valid === false || validationResult?.isValid === false
  const isOutlined = props.variant === 'outlined'
  const isContained = props.variant === 'contained'

  const primaryColor = themeProvider.theme.palette[props.defaultColor || 'primary'].main
  const errorColor = themeProvider.theme.palette.error.main
  const activeColor = isError ? errorColor : primaryColor

  // Set CSS custom properties for dynamic theme values
  label.style.setProperty('--input-color-disabled', themeProvider.theme.text.disabled)
  label.style.setProperty('--input-color-error', errorColor)
  label.style.setProperty('--input-color-focused', primaryColor)
  label.style.setProperty('--input-color-default', themeProvider.theme.text.secondary)

  // Compute current color based on state
  const currentColor = props.disabled
    ? themeProvider.theme.text.disabled
    : isError
      ? errorColor
      : state.focused
        ? primaryColor
        : themeProvider.theme.text.secondary
  label.style.setProperty('--input-color', currentColor)

  // Background for contained variant
  const bgAlpha = state.focused ? 0.12 : 0.08
  const background = isContained
    ? themeProvider.getRgbFromColorString(activeColor).update('a', bgAlpha).toString()
    : 'transparent'
  label.style.setProperty('--input-background', background)

  // Border color
  const inactiveBorderColor = themeProvider
    .getRgbFromColorString(themeProvider.theme.text.secondary)
    .update('a', 0.3)
    .toString()
  const borderColor =
    isOutlined || isContained
      ? isError
        ? errorColor
        : state.focused
          ? primaryColor
          : inactiveBorderColor
      : 'transparent'
  label.style.setProperty('--input-border-color', borderColor)

  // Focus shadow
  const focusShadow =
    state.focused && !props.disabled
      ? `0 0 0 3px ${themeProvider.getRgbFromColorString(activeColor).update('a', 0.15).toString()}`
      : 'none'
  label.style.setProperty('--input-focus-shadow', focusShadow)

  // Apply any custom label styles from props
  if (props.labelProps?.style) {
    Object.assign(label.style, props.labelProps.style)
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
  css: {
    display: 'block',
    marginBottom: '1.25em',
    '& label': {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
      fontSize: '11px',
      fontWeight: '500',
      letterSpacing: '0.01em',
      padding: '12px 14px',
      borderRadius: '8px',
      transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
      cursor: 'text',
      color: 'var(--input-color)',
      background: 'var(--input-background)',
      border: '2px solid var(--input-border-color)',
      boxShadow: 'var(--input-focus-shadow)',
    },
    '&[data-disabled] label': {
      filter: 'grayscale(100%)',
      opacity: '0.5',
      cursor: 'not-allowed',
    },
    '& .input-row': {
      display: 'flex',
      alignItems: 'center',
      width: '100%',
      gap: '8px',
    },
    '& input': {
      color: 'inherit',
      border: 'none',
      backgroundColor: 'transparent',
      outline: 'none',
      fontSize: '13px',
      fontWeight: '400',
      width: '100%',
      textOverflow: 'ellipsis',
      padding: '0',
      marginTop: '8px',
      marginBottom: '2px',
      flexGrow: '1',
      lineHeight: '1.5',
    },
    '& .helperText': {
      fontSize: '11px',
      marginTop: '6px',
      opacity: '0.85',
      lineHeight: '1.4',
    },
    '& .startIcon, & .endIcon': {
      display: 'flex',
      alignItems: 'center',
      fontSize: '16px',
    },
  },
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

    // Set data-disabled attribute for CSS styling
    if (props.disabled) {
      element.setAttribute('data-disabled', '')
    } else {
      element.removeAttribute('data-disabled')
    }

    const updateState = (newState: TextInputState) => {
      const label = element.querySelector('label') as HTMLLabelElement
      const input = element.querySelector('input') as HTMLInputElement

      newState.value = input?.value || newState.value
      newState.validity = input?.validity || newState.validity
      newState.validity.toJSON = () => {
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

      if (validationResult?.isValid === false || newState.validity?.valid === false) {
        element.setAttribute('data-validation-failed', 'true')
      } else {
        element.removeAttribute('data-validation-failed')
      }

      // Set CSS custom properties for dynamic theme values
      setLabelCSSProperties({ label, themeProvider, props, state: newState, validationResult })

      const helper = element.querySelector<HTMLSpanElement>('span.helperText')
      const helperNode =
        (validationResult?.isValid === false && validationResult?.message) ||
        props.getHelperText?.({ state: newState, validationResult }) ||
        getDefaultMessagesForValidityState(newState.validity) ||
        ''
      if (helper) {
        helper.replaceChildren(helperNode)
      }

      const startIcon = element.querySelector<HTMLSpanElement>('span.startIcon')
      if (startIcon) {
        startIcon.replaceChildren(props.getStartIcon?.({ state: newState, validationResult }) || '')
      }

      const endIcon = element.querySelector<HTMLSpanElement>('span.endIcon')
      if (endIcon) {
        endIcon.replaceChildren(props.getEndIcon?.({ state: newState, validationResult }) || '')
      }

      if (injector.cachedSingletons.has(FormService)) {
        const formService = injector.getInstance(FormService)
        formService.setFieldState(props.name as keyof unknown, validationResult || { isValid: true }, newState.validity)
      }
    }

    const [state, setState] = useObservable<TextInputState>(
      'inputState',
      new ObservableValue({
        value: props.value || '',
        focused: props.autofocus || false,
        validity: element.querySelector('input')?.validity || ({} as ValidityState),
        element,
      }),
      { onChange: updateState },
    )

    // Initialize CSS custom properties on the label after render
    const initLabel = () => {
      const label = element.querySelector('label') as HTMLLabelElement
      if (label) {
        setLabelCSSProperties({ label, themeProvider, props, state })
      }
    }
    requestAnimationFrame(initLabel)

    return (
      <label {...props.labelProps}>
        {props.labelTitle}

        <div className="input-row">
          {props.getStartIcon ? <span className="startIcon">{props.getStartIcon?.({ state })}</span> : null}
          <input
            oninvalid={(ev) => {
              ev.preventDefault()
              const el = ev.target as HTMLInputElement
              setState({ ...state, validity: el.validity })
            }}
            onchange={function (ev) {
              const el = ev.target as HTMLInputElement
              const newValue = el.value
              setState({ ...state, value: newValue, validity: el?.validity })
              props.onTextChange?.(newValue)
              props?.onchange?.call(this, ev)
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
            style={props.style}
            value={state.value}
          />
          {props.getEndIcon ? <span className="endIcon">{props.getEndIcon({ state })}</span> : null}
        </div>
        <span className="helperText">{props.getHelperText?.({ state })}</span>
      </label>
    )
  },
})
