import type { PartialElement } from '@furystack/shades'
import { Shade, createComponent } from '@furystack/shades'
import { cssVariableTheme } from '../../services/css-variable-theme.js'
import type { Palette } from '../../services/theme-provider-service.js'
import { ThemeProviderService } from '../../services/theme-provider-service.js'
import type { ComponentSize } from '../component-size.js'
import { FormContextToken } from '../form.js'

const emptyValidity = {} as ValidityState

export type ValidInputValidationResult = { isValid: true }

export type InvalidInputValidationResult = { isValid: false; message: string }

export type InputValidationResult = ValidInputValidationResult | InvalidInputValidationResult

export interface TextInputProps extends Omit<PartialElement<HTMLInputElement>, 'size'> {
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
   * The size of the input.
   * @default 'medium'
   */
  size?: ComponentSize

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
  customElementName: 'shade-input',
  css: {
    display: 'block',
    fontFamily: cssVariableTheme.typography.fontFamily,
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

    // Size: small
    '&[data-size="small"] label': {
      padding: `${cssVariableTheme.spacing.xs} ${cssVariableTheme.spacing.sm}`,
    },
    '&[data-size="small"] input': {
      fontSize: cssVariableTheme.typography.fontSize.xs,
    },
    '&[data-size="small"] .startIcon, &[data-size="small"] .endIcon': {
      fontSize: cssVariableTheme.typography.fontSize.md,
    },

    // Size: large
    '&[data-size="large"] label': {
      padding: `${cssVariableTheme.spacing.md} ${cssVariableTheme.spacing.lg}`,
      fontSize: cssVariableTheme.typography.fontSize.sm,
    },
    '&[data-size="large"] input': {
      fontSize: cssVariableTheme.typography.fontSize.md,
    },
    '&[data-size="large"] .startIcon, &[data-size="large"] .endIcon': {
      fontSize: cssVariableTheme.typography.fontSize.xl,
    },
  },
  render: ({ props, injector, useState, useDisposable, useHostProps, useRef }) => {
    const { size: componentSize, ...nativeProps } = props
    const inputRef = useRef<HTMLInputElement>('formInput')

    useDisposable('form-registration', () => {
      const formService = injector.get(FormContextToken)
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

    const themeProvider = injector.get(ThemeProviderService)

    // We want to use the CSS state hooks for the focused and validity states, so we need to disable the rule
    // eslint-disable-next-line furystack/no-css-state-hooks
    const [focused, setFocused] = useState('focused', props.autofocus || false)
    const [validity, setValidity] = useState('validity', inputRef.current?.validity || emptyValidity)

    // Derive state from props + local state (value is props-driven or read from native input)
    const state: TextInputState = {
      value: props.value ?? inputRef.current?.value ?? '',
      focused,
      validity,
    }

    // Enrich validity with toJSON for serialization
    if (validity && !validity.toJSON) {
      validity.toJSON = () => ({
        valid: validity.valid,
        valueMissing: validity.valueMissing,
        typeMismatch: validity.typeMismatch,
        patternMismatch: validity.patternMismatch,
        tooLong: validity.tooLong,
        tooShort: validity.tooShort,
        rangeUnderflow: validity.rangeUnderflow,
        rangeOverflow: validity.rangeOverflow,
        stepMismatch: validity.stepMismatch,
        badInput: validity.badInput,
      })
    }

    const validationResult = props.getValidationResult?.({ state })
    const isInvalid = validationResult?.isValid === false || validity?.valid === false

    const primaryColor = themeProvider.theme.palette[props.defaultColor || 'primary'].main
    useHostProps({
      'data-variant': props.variant || undefined,
      'data-size': componentSize && componentSize !== 'medium' ? componentSize : undefined,
      'data-disabled': props.disabled ? '' : undefined,
      'data-invalid': isInvalid ? '' : undefined,
      style: {
        '--input-primary-color': primaryColor,
        '--input-error-color': themeProvider.theme.palette.error.main,
      },
    })

    const formServiceForValidity = injector.get(FormContextToken)
    if (formServiceForValidity) {
      formServiceForValidity.setFieldState(props.name as keyof unknown, validationResult || { isValid: true }, validity)
    }

    const helperNode =
      (validationResult?.isValid === false && validationResult?.message) ||
      props.getHelperText?.({ state, validationResult }) ||
      getDefaultMessagesForValidityState(validity) ||
      ''

    return (
      <label {...props.labelProps}>
        {props.labelTitle}

        <div className="input-row">
          {props.getStartIcon ? (
            <span className="startIcon">{props.getStartIcon({ state, validationResult })}</span>
          ) : null}
          <input
            ref={inputRef}
            oninvalid={(ev) => {
              ev.preventDefault()
              setValidity((ev.target as HTMLInputElement).validity)
            }}
            onchange={function (ev) {
              const el = ev.target as HTMLInputElement
              setValidity(el.validity)
              props.onTextChange?.(el.value)
              props?.onchange?.call(this, ev)
            }}
            onfocus={(ev) => {
              setFocused(true)
              setValidity((ev.target as HTMLInputElement).validity)
            }}
            onblur={(ev) => {
              setFocused(false)
              setValidity((ev.target as HTMLInputElement).validity)
            }}
            {...nativeProps}
            style={props.style}
            {...(props.value !== undefined ? { value: props.value } : {})}
          />
          {props.getEndIcon ? <span className="endIcon">{props.getEndIcon({ state, validationResult })}</span> : null}
        </div>
        <span className="helperText">{helperNode}</span>
      </label>
    )
  },
})
