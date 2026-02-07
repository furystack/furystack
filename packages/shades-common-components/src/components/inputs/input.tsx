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
  element: JSX.Element<TextInputProps>
}

/**
 * Sets CSS custom properties for dynamic color values.
 * State-based styling (focus, error, disabled) is handled by CSS selectors.
 * Background colors use CSS color-mix() for automatic theme adaptation.
 */
const setInputColors = ({
  element,
  themeProvider,
  props,
}: {
  element: HTMLElement
  themeProvider: ThemeProviderService
  props: TextInputProps
}): void => {
  // Only set the color variables - backgrounds use CSS color-mix()
  const primaryColor = themeProvider.theme.palette[props.defaultColor || 'primary'].main
  element.style.setProperty('--input-primary-color', primaryColor)
  element.style.setProperty('--input-error-color', themeProvider.theme.palette.error.main)
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
      marginTop: '8px',
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

    // Set data attributes for CSS styling
    if (props.variant) {
      element.setAttribute('data-variant', props.variant)
    } else {
      element.removeAttribute('data-variant')
    }
    if (props.disabled) {
      element.setAttribute('data-disabled', '')
    } else {
      element.removeAttribute('data-disabled')
    }

    // Set dynamic color CSS variables (only needs to happen once per render)
    setInputColors({ element, themeProvider, props })

    const updateState = (newState: TextInputState) => {
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

      // Set data-invalid attribute for CSS styling
      if (validationResult?.isValid === false || newState.validity?.valid === false) {
        element.setAttribute('data-invalid', '')
      } else {
        element.removeAttribute('data-invalid')
      }

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
          {props.getEndIcon ? <span className="endIcon">{props.getEndIcon({ state })}</span> : null}
        </div>
        <span className="helperText">{props.getHelperText?.({ state })}</span>
      </label>
    )
  },
})
