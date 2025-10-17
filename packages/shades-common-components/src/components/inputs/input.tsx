import type { PartialElement } from '@furystack/shades'
import { Shade, attachStyles, createComponent } from '@furystack/shades'
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
  const isError = state.validity?.valid === false || validationResult?.isValid === false
  const isOutlined = props.variant === 'outlined'
  const isContained = props.variant === 'contained'

  return {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    fontSize: '11px',
    fontWeight: '500',
    letterSpacing: '0.01em',
    color: props.disabled
      ? themeProvider.theme.text.disabled
      : isError
        ? themeProvider.theme.palette.error.main
        : state.focused
          ? themeProvider.theme.palette[props.defaultColor || 'primary'].main
          : themeProvider.theme.text.secondary,
    marginBottom: '1.25em',
    padding: '12px 14px',
    borderRadius: '8px',
    background: isContained
      ? themeProvider
          .getRgbFromColorString(
            isError
              ? themeProvider.theme.palette.error.main
              : themeProvider.theme.palette[props.defaultColor || 'primary'].main,
          )
          .update('a', state.focused ? 0.12 : 0.08)
          .toString()
      : 'transparent',
    border:
      isOutlined || isContained
        ? `2px solid ${
            isError
              ? themeProvider.theme.palette.error.main
              : state.focused
                ? themeProvider.theme.palette[props.defaultColor || 'primary'].main
                : themeProvider.getRgbFromColorString(themeProvider.theme.text.secondary).update('a', 0.3).toString()
          }`
        : `2px solid transparent`,
    boxShadow:
      state.focused && !props.disabled
        ? `0 0 0 3px ${themeProvider
            .getRgbFromColorString(
              isError
                ? themeProvider.theme.palette.error.main
                : themeProvider.theme.palette[props.defaultColor || 'primary'].main,
            )
            .update('a', 0.15)
            .toString()}`
        : 'none',
    filter: props.disabled ? 'grayscale(100%)' : 'none',
    opacity: props.disabled ? '0.5' : '1',
    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
    cursor: props.disabled ? 'not-allowed' : 'text',
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

      attachStyles(label, { style: getLabelStyle({ themeProvider, props, state: newState, validationResult }) })

      const helper = element.querySelector<HTMLSpanElement>('span.helperText')
      const helperNode =
        (validationResult?.isValid === false && validationResult?.message) ||
        props.getHelperText?.({ state: newState, validationResult }) ||
        getDefaultMessagesForValidityState(newState.validity) ||
        ''
      if (helper) {
        helper.replaceChildren(helperNode)
        attachStyles(helper, {
          style: {
            fontSize: '11px',
            marginTop: '6px',
            opacity: '0.85',
            lineHeight: '1.4',
          },
        })
      }

      const startIcon = element.querySelector<HTMLSpanElement>('span.startIcon')
      if (startIcon) {
        startIcon.replaceChildren(props.getStartIcon?.({ state: newState, validationResult }) || '')
        attachStyles(startIcon, {
          style: {
            display: 'flex',
            alignItems: 'center',
            fontSize: '16px',
          },
        })
      }

      const endIcon = element.querySelector<HTMLSpanElement>('span.endIcon')
      if (endIcon) {
        endIcon.replaceChildren(props.getEndIcon?.({ state: newState, validationResult }) || '')
        attachStyles(endIcon, {
          style: {
            display: 'flex',
            alignItems: 'center',
            fontSize: '16px',
          },
        })
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
      <label {...props.labelProps} style={getLabelStyle({ props, state, themeProvider })}>
        {props.labelTitle}

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            width: '100%',
            gap: '8px',
          }}
        >
          {props.getStartIcon ? (
            <span className="startIcon" style={{ display: 'flex', alignItems: 'center', fontSize: '16px' }}>
              {props.getStartIcon?.({ state })}
            </span>
          ) : null}
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
            style={{
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
              ...props.style,
            }}
            value={state.value}
          />
          {props.getEndIcon ? (
            <span className="endIcon" style={{ display: 'flex', alignItems: 'center', fontSize: '16px' }}>
              {props.getEndIcon({ state })}
            </span>
          ) : null}
        </div>
        <span
          className="helperText"
          style={{
            fontSize: '11px',
            marginTop: '6px',
            opacity: '0.85',
            lineHeight: '1.4',
          }}
        >
          {props.getHelperText?.({ state })}
        </span>
      </label>
    )
  },
})
