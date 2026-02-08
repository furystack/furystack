import type { PartialElement } from '@furystack/shades'
import { Shade, createComponent } from '@furystack/shades'
import { ObservableValue } from '@furystack/utils'
import { buildTransition, cssVariableTheme } from '../../services/css-variable-theme.js'
import type { Palette } from '../../services/theme-provider-service.js'
import { ThemeProviderService } from '../../services/theme-provider-service.js'
import { FormService } from '../form.js'

export type InputNumberProps = {
  /**
   * The current numeric value
   */
  value?: number

  /**
   * Minimum allowed value
   */
  min?: number

  /**
   * Maximum allowed value
   */
  max?: number

  /**
   * Step increment for +/- buttons and keyboard arrows
   * @default 1
   */
  step?: number

  /**
   * Number of decimal places to display
   */
  precision?: number

  /**
   * Callback when the value changes
   */
  onValueChange?: (value: number | undefined) => void

  /**
   * Custom formatter to display the value in the input
   */
  formatter?: (value: number | undefined) => string

  /**
   * Custom parser to convert the displayed text back to a number
   */
  parser?: (displayValue: string) => number | undefined

  /**
   * An optional label title element or string
   */
  labelTitle?: JSX.Element | string

  /**
   * Optional props for the label element
   */
  labelProps?: PartialElement<HTMLLabelElement>

  /**
   * The variant of the input
   */
  variant?: 'contained' | 'outlined'

  /**
   * The color of the input
   */
  color?: keyof Palette

  /**
   * Whether the input is disabled
   */
  disabled?: boolean

  /**
   * Whether the input is read-only
   */
  readOnly?: boolean

  /**
   * The name attribute for form integration
   */
  name?: string

  /**
   * Helper text displayed below the input
   */
  helperText?: string

  /**
   * Placeholder text
   */
  placeholder?: string
}

const clampValue = (value: number, min?: number, max?: number): number => {
  if (min !== undefined && value < min) return min
  if (max !== undefined && value > max) return max
  return value
}

const roundToPrecision = (value: number, precision?: number): number => {
  if (precision === undefined) return value
  const factor = Math.pow(10, precision)
  return Math.round(value * factor) / factor
}

const formatValue = (
  value: number | undefined,
  precision?: number,
  formatter?: InputNumberProps['formatter'],
): string => {
  if (value === undefined) return ''
  if (formatter) return formatter(value)
  if (precision !== undefined) return value.toFixed(precision)
  return String(value)
}

const parseValue = (text: string, parser?: InputNumberProps['parser']): number | undefined => {
  if (parser) return parser(text)
  if (text === '' || text === '-') return undefined
  const num = Number(text)
  return isNaN(num) ? undefined : num
}

export const InputNumber = Shade<InputNumberProps>({
  shadowDomName: 'shade-input-number',
  css: {
    display: 'block',
    marginBottom: '1.25em',

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

    '&[data-variant="outlined"] label': {
      borderColor: cssVariableTheme.action.subtleBorder,
    },

    '&[data-variant="contained"] label': {
      borderColor: cssVariableTheme.action.subtleBorder,
      background: 'color-mix(in srgb, var(--input-number-color) 8%, transparent)',
    },

    '&:focus-within label': {
      color: 'var(--input-number-color)',
    },

    '&[data-variant="outlined"]:focus-within label, &[data-variant="contained"]:focus-within label': {
      borderColor: 'var(--input-number-color)',
      boxShadow: cssVariableTheme.action.focusRing,
    },
    '&[data-variant="contained"]:focus-within label': {
      background: 'color-mix(in srgb, var(--input-number-color) 12%, transparent)',
    },

    '&[data-disabled] label': {
      color: cssVariableTheme.text.disabled,
      filter: 'grayscale(100%)',
      opacity: cssVariableTheme.action.disabledOpacity,
      cursor: 'not-allowed',
    },
    '&[data-disabled]:focus-within label': {
      boxShadow: 'none',
    },

    '& .input-number-row': {
      display: 'flex',
      alignItems: 'center',
      width: '100%',
      gap: cssVariableTheme.spacing.xs,
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
      textAlign: 'center',
      appearance: 'textfield',
    },

    '& input::-webkit-outer-spin-button, & input::-webkit-inner-spin-button': {
      webkitAppearance: 'none',
      margin: '0',
    },

    '& .step-button': {
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      width: '28px',
      height: '28px',
      border: 'none',
      borderRadius: cssVariableTheme.shape.borderRadius.sm,
      background: 'color-mix(in srgb, var(--input-number-color) 15%, transparent)',
      color: 'var(--input-number-color)',
      cursor: 'pointer',
      fontSize: cssVariableTheme.typography.fontSize.md,
      fontWeight: cssVariableTheme.typography.fontWeight.bold,
      lineHeight: '1',
      flexShrink: '0',
      userSelect: 'none',
      transition: buildTransition(
        ['background', cssVariableTheme.transitions.duration.fast, cssVariableTheme.transitions.easing.default],
        ['color', cssVariableTheme.transitions.duration.fast, cssVariableTheme.transitions.easing.default],
        ['transform', cssVariableTheme.transitions.duration.fast, cssVariableTheme.transitions.easing.easeOut],
      ),
    },

    '& .step-button:hover:not(:disabled)': {
      background: 'color-mix(in srgb, var(--input-number-color) 25%, transparent)',
    },

    '& .step-button:active:not(:disabled)': {
      transform: 'scale(0.92)',
    },

    '& .step-button:disabled': {
      cursor: 'not-allowed',
      opacity: '0.4',
    },

    '& .helperText': {
      fontSize: cssVariableTheme.typography.fontSize.xs,
      marginTop: '6px',
      opacity: '0.85',
      lineHeight: '1.4',
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
  render: ({ props, injector, useObservable, useDisposable, element }) => {
    const themeProvider = injector.getInstance(ThemeProviderService)

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

    const primaryColor = themeProvider.theme.palette[props.color || 'primary'].main
    element.style.setProperty('--input-number-color', primaryColor)

    const step = props.step ?? 1

    type InputNumberState = { value: number | undefined; displayValue: string }

    /**
     * Imperatively updates the DOM elements to reflect the current state.
     * Using onChange prevents a full re-render (which would cause flicker).
     */
    const syncDom = (newState: InputNumberState) => {
      const inputEl = element.querySelector('input')
      if (inputEl) {
        inputEl.value = newState.displayValue

        if (newState.value !== undefined) {
          inputEl.setAttribute('aria-valuenow', String(newState.value))
        } else {
          inputEl.removeAttribute('aria-valuenow')
        }
      }

      const buttons = element.querySelectorAll<HTMLButtonElement>('.step-button')
      const isDecDisabled =
        props.disabled ||
        props.readOnly ||
        (props.min !== undefined && newState.value !== undefined && newState.value <= props.min)
      const isIncDisabled =
        props.disabled ||
        props.readOnly ||
        (props.max !== undefined && newState.value !== undefined && newState.value >= props.max)

      if (buttons[0]) buttons[0].disabled = !!isDecDisabled
      if (buttons[1]) buttons[1].disabled = !!isIncDisabled
    }

    const observable = useDisposable(
      'inputNumberObservable',
      () =>
        new ObservableValue<InputNumberState>({
          value: props.value,
          displayValue: formatValue(props.value, props.precision, props.formatter),
        }),
    )

    const [initialState] = useObservable('inputNumberState', observable, { onChange: syncDom })

    const getCurrentValue = () => observable.getValue().value

    const updateValue = (newValue: number | undefined) => {
      if (newValue !== undefined) {
        newValue = roundToPrecision(newValue, props.precision)
        newValue = clampValue(newValue, props.min, props.max)
      }
      const displayValue = formatValue(newValue, props.precision, props.formatter)
      observable.setValue({ value: newValue, displayValue })
      props.onValueChange?.(newValue)
    }

    const handleIncrement = () => {
      if (props.disabled || props.readOnly) return
      const current = getCurrentValue() ?? props.min ?? 0
      updateValue(current + step)
    }

    const handleDecrement = () => {
      if (props.disabled || props.readOnly) return
      const current = getCurrentValue() ?? props.min ?? 0
      updateValue(current - step)
    }

    const isDecrementDisabled =
      props.disabled ||
      props.readOnly ||
      (props.min !== undefined && initialState.value !== undefined && initialState.value <= props.min)
    const isIncrementDisabled =
      props.disabled ||
      props.readOnly ||
      (props.max !== undefined && initialState.value !== undefined && initialState.value >= props.max)

    // Set ARIA attributes imperatively (JSX doesn't reliably set hyphenated attributes)
    requestAnimationFrame(() => {
      const inputEl = element.querySelector('input')
      if (inputEl) {
        inputEl.setAttribute('role', 'spinbutton')
        if (props.min !== undefined) inputEl.setAttribute('aria-valuemin', String(props.min))
        if (props.max !== undefined) inputEl.setAttribute('aria-valuemax', String(props.max))
        if (initialState.value !== undefined) {
          inputEl.setAttribute('aria-valuenow', String(initialState.value))
        } else {
          inputEl.removeAttribute('aria-valuenow')
        }
      }

      const buttons = element.querySelectorAll('.step-button')
      if (buttons[0]) buttons[0].setAttribute('aria-label', 'Decrease value')
      if (buttons[1]) buttons[1].setAttribute('aria-label', 'Increase value')
    })

    return (
      <label {...props.labelProps}>
        {props.labelTitle}
        <div className="input-number-row">
          <button
            type="button"
            className="step-button"
            disabled={isDecrementDisabled}
            onclick={handleDecrement}
            tabIndex={-1}
          >
            −
          </button>
          <input
            type="text"
            inputMode="decimal"
            name={props.name}
            value={initialState.displayValue}
            placeholder={props.placeholder}
            disabled={props.disabled}
            readOnly={props.readOnly}
            onkeydown={(ev: KeyboardEvent) => {
              if (props.disabled || props.readOnly) return
              if (ev.key === 'ArrowUp') {
                ev.preventDefault()
                handleIncrement()
              } else if (ev.key === 'ArrowDown') {
                ev.preventDefault()
                handleDecrement()
              }
            }}
            oninput={(ev: Event) => {
              const el = ev.target as HTMLInputElement
              observable.setValue({ ...observable.getValue(), displayValue: el.value })
            }}
            onblur={(ev: Event) => {
              const el = ev.target as HTMLInputElement
              const parsed = parseValue(el.value, props.parser)
              updateValue(parsed)
            }}
            onchange={(ev: Event) => {
              const el = ev.target as HTMLInputElement
              const parsed = parseValue(el.value, props.parser)
              updateValue(parsed)
            }}
          />
          <button
            type="button"
            className="step-button"
            disabled={isIncrementDisabled}
            onclick={handleIncrement}
            tabIndex={-1}
          >
            +
          </button>
        </div>
        {props.helperText ? <span className="helperText">{props.helperText}</span> : null}
      </label>
    )
  },
})
