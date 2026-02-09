import type { PartialElement } from '@furystack/shades'
import { Shade, createComponent } from '@furystack/shades'
import { ObservableValue } from '@furystack/utils'
import { cssVariableTheme } from '../../services/css-variable-theme.js'
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

    // Base label styles
    '& label': {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
      fontSize: cssVariableTheme.typography.fontSize.xs,
      fontWeight: cssVariableTheme.typography.fontWeight.medium,
      letterSpacing: '0.01em',
      padding: '12px 14px',
      borderRadius: cssVariableTheme.shape.borderRadius.md,
      transition: `all ${cssVariableTheme.transitions.duration.normal} ${cssVariableTheme.transitions.easing.default}`,
      cursor: 'text',
      color: cssVariableTheme.text.secondary,
      background: 'transparent',
      border: '2px solid transparent',
      boxShadow: 'none',
    },

    // Outlined variant - default border
    '&[data-variant="outlined"] label': {
      borderColor: cssVariableTheme.action.subtleBorder,
    },

    // Contained variant - background using color-mix for theme-aware alpha
    '&[data-variant="contained"] label': {
      borderColor: cssVariableTheme.action.subtleBorder,
      background: 'color-mix(in srgb, var(--input-primary-color) 8%, transparent)',
    },

    // Focus state using :focus-within (color change for all variants)
    '&:focus-within label': {
      color: 'var(--input-primary-color)',
    },

    // Focus state for outlined/contained variants - add border and shadow
    '&[data-variant="outlined"]:focus-within label, &[data-variant="contained"]:focus-within label': {
      borderColor: 'var(--input-primary-color)',
      boxShadow: cssVariableTheme.action.focusRing,
    },
    '&[data-variant="contained"]:focus-within label': {
      background: 'color-mix(in srgb, var(--input-primary-color) 12%, transparent)',
    },

    // Invalid/error state
    '&[data-invalid] label': {
      color: 'var(--input-error-color)',
    },
    '&[data-invalid][data-variant="outlined"] label, &[data-invalid][data-variant="contained"] label': {
      borderColor: 'var(--input-error-color)',
    },
    '&[data-invalid][data-variant="contained"] label': {
      background: 'color-mix(in srgb, var(--input-error-color) 8%, transparent)',
    },
    '&[data-invalid]:focus-within label': {
      color: 'var(--input-error-color)',
    },
    '&[data-invalid][data-variant="outlined"]:focus-within label, &[data-invalid][data-variant="contained"]:focus-within label':
      {
        borderColor: 'var(--input-error-color)',
        boxShadow: cssVariableTheme.action.focusRing,
      },
    '&[data-invalid][data-variant="contained"]:focus-within label': {
      background: 'color-mix(in srgb, var(--input-error-color) 12%, transparent)',
    },

    // Disabled state
    '&[data-disabled] label': {
      color: cssVariableTheme.text.disabled,
      filter: 'grayscale(100%)',
      opacity: cssVariableTheme.action.disabledOpacity,
      cursor: 'not-allowed',
    },
    '&[data-disabled]:focus-within label': {
      boxShadow: 'none',
    },

    '& .input-row': {
      display: 'flex',
      alignItems: 'center',
      width: '100%',
      gap: cssVariableTheme.spacing.sm,
    },
    '& input': {
      color: 'inherit',
      border: 'none',
      backgroundColor: 'transparent',
      outline: 'none',
      fontSize: cssVariableTheme.typography.fontSize.sm,
      fontWeight: cssVariableTheme.typography.fontWeight.normal,
      width: '100%',
      textOverflow: 'ellipsis',
      padding: '0',
      marginTop: cssVariableTheme.spacing.sm,
      marginBottom: '2px',
      flexGrow: '1',
      lineHeight: '1.5',
    },
    '& .helperText': {
      fontSize: cssVariableTheme.typography.fontSize.xs,
      marginTop: '6px',
      opacity: '0.85',
      lineHeight: '1.4',
    },
    '& .startIcon, & .endIcon': {
      display: 'flex',
      alignItems: 'center',
      fontSize: cssVariableTheme.typography.fontSize.lg,
    },
  },
  render: ({ props, injector, useObservable, useDisposable, useHostProps, useRef }) => {
    const inputRef = useRef<HTMLInputElement>('formInput')
    const helperRef = useRef<HTMLSpanElement>('helperText')
    const startIconRef = useRef<HTMLSpanElement>('startIcon')
    const endIconRef = useRef<HTMLSpanElement>('endIcon')

    useDisposable('form-registration', () => {
      const formService = injector.cachedSingletons.has(FormService) ? injector.getInstance(FormService) : null
      if (formService) {
        queueMicrotask(() => {
          if (inputRef.current) formService.inputs.add(inputRef.current)
        })
      }
      return {
        [Symbol.dispose]: () => {
          if (inputRef.current && formService) formService.inputs.delete(inputRef.current)
        },
      }
    })

    const themeProvider = injector.getInstance(ThemeProviderService)

    const isInvalidObs = useDisposable('isInvalid', () => new ObservableValue(false))
    const [isInvalid] = useObservable('isInvalid', isInvalidObs)

    const primaryColor = themeProvider.theme.palette[props.defaultColor || 'primary'].main
    useHostProps({
      'data-variant': props.variant || undefined,
      'data-disabled': props.disabled ? '' : undefined,
      'data-invalid': isInvalid ? '' : undefined,
      style: {
        '--input-primary-color': primaryColor,
        '--input-error-color': themeProvider.theme.palette.error.main,
      },
    })

    const updateState = (newState: TextInputState) => {
      const input = inputRef.current

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

      // Update invalid state (triggers re-render to update host attribute via useHostProps)
      const invalid = validationResult?.isValid === false || newState.validity?.valid === false
      if (invalid !== isInvalidObs.getValue()) {
        isInvalidObs.setValue(invalid)
      }

      const helper = helperRef.current
      const helperNode =
        (validationResult?.isValid === false && validationResult?.message) ||
        props.getHelperText?.({ state: newState, validationResult }) ||
        getDefaultMessagesForValidityState(newState.validity) ||
        ''
      if (helper) {
        helper.replaceChildren(helperNode)
      }

      const startIcon = startIconRef.current
      if (startIcon) {
        startIcon.replaceChildren(props.getStartIcon?.({ state: newState, validationResult }) || '')
      }

      const endIcon = endIconRef.current
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
        validity: inputRef.current?.validity || ({} as ValidityState),
      }),
      { onChange: updateState },
    )

    return (
      <label {...props.labelProps}>
        {props.labelTitle}

        <div className="input-row">
          {props.getStartIcon ? (
            <span className="startIcon" ref={startIconRef}>
              {props.getStartIcon?.({ state })}
            </span>
          ) : null}
          <input
            ref={inputRef}
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
              setState({ ...state, value: el.value, focused: true, validity: el.validity })
            }}
            onblur={(ev) => {
              const el = ev.target as HTMLInputElement
              setState({ ...state, value: el.value, focused: false, validity: el.validity })
            }}
            {...props}
            style={props.style}
            value={state.value}
          />
          {props.getEndIcon ? (
            <span className="endIcon" ref={endIconRef}>
              {props.getEndIcon({ state })}
            </span>
          ) : null}
        </div>
        <span className="helperText" ref={helperRef}>
          {props.getHelperText?.({ state })}
        </span>
      </label>
    )
  },
})
