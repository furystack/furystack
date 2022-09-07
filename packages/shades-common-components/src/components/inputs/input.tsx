import { Shade, PartialElement, createComponent, attachStyles } from '@furystack/shades'
import { ThemeProviderService } from '../..'
import { Palette, Theme } from '../../services'

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
   * Optional callback for the helper text
   */
  getHelperText?: (options: { state: TextInputState }) => JSX.Element | string

  /**
   * Optional callback for retrieving an icon element on the left side of the input field
   */
  getStartIcon?: (options: { state: TextInputState }) => JSX.Element | string

  /**
   * Optional callback for retrieving an icon element on the right side of the input field
   */
  getEndIcon?: (options: { state: TextInputState }) => JSX.Element | string
}

export type TextInputState = {
  theme: Theme
  value: string
  focused: boolean
  validity: ValidityState
}

const getLabelStyle = ({
  themeProvider,
  props,
  state,
}: {
  themeProvider: ThemeProviderService
  props: TextInputProps
  state: TextInputState
}): Partial<CSSStyleDeclaration> => {
  return {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    fontSize: '10px',
    color: props.disabled
      ? state.theme.text.disabled
      : state.validity?.valid === false
      ? state.theme.palette.error.main
      : state.focused
      ? state.theme.text.primary
      : state.theme.text.secondary,
    marginBottom: '1em',
    padding: '1em',
    borderRadius: '5px',
    background:
      props.variant === 'contained'
        ? themeProvider
            .getRgbFromColorString(
              state.validity?.valid === false
                ? state.theme.palette.error.main
                : state.theme.palette[props.defaultColor || 'primary'].main,
            )
            .update('a', state.focused ? 0.1 : 0.2)
            .toString()
        : 'transparent',
    boxShadow:
      props.variant === 'outlined' || props.variant === 'contained'
        ? `0 0 0 1px ${
            state.validity?.valid === false
              ? state.theme.palette.error.main
              : state.focused
              ? state.theme.palette[props.defaultColor || 'primary'].main
              : state.theme.text.primary
          }`
        : 'none',
    filter: props.disabled ? 'grayscale(100%)' : 'none',
    opacity: props.disabled ? '0.5' : '1',
    transition:
      'color 0.2s ease-in-out, filter 0.2s ease-in-out, opacity 0.2s ease-in-out, border-color 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
    ...props.labelProps?.style,
  }
}

export const Input = Shade<TextInputProps, TextInputState>({
  shadowDomName: 'shade-input',
  getInitialState: ({ injector, props }) => ({
    theme: injector.getInstance(ThemeProviderService).theme.getValue(),
    value: props.value || '',
    focused: props.autofocus || false,
    validity: { valid: true } as ValidityState,
  }),
  resources: ({ injector, updateState }) => [
    injector.getInstance(ThemeProviderService).theme.subscribe((theme) => updateState({ theme })),
  ],
  compareState: ({ newState, element, props, injector }) => {
    const themeProvider = injector.getInstance(ThemeProviderService)
    const label = element.querySelector('label') as HTMLLabelElement
    attachStyles(label, { style: getLabelStyle({ themeProvider, props, state: newState }) })

    const helper = element.querySelector<HTMLSpanElement>('span.helperText')
    const helperNode = props.getHelperText?.({ state: newState }) || ''
    helper?.replaceChildren(helperNode)

    const startIcon = element.querySelector<HTMLSpanElement>('span.startIcon')
    startIcon?.replaceChildren(props.getStartIcon?.({ state: newState }) || '')
    const endIcon = element.querySelector<HTMLSpanElement>('span.endIcon')
    endIcon?.replaceChildren(props.getEndIcon?.({ state: newState }) || '')

    return false
  },
  render: ({ props, getState, updateState, injector }) => {
    const state = getState()
    const { value } = state
    const themeProvider = injector.getInstance(ThemeProviderService)

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
              updateState({ validity: el.validity })
            }}
            onchange={(ev) => {
              const el = ev.target as HTMLInputElement
              const newValue = el.value
              updateState({ value: newValue, validity: el?.validity })
              props.onTextChange?.(newValue)
              props.onchange && (props.onchange as any)(ev)
            }}
            onfocus={() => {
              updateState({ focused: true })
            }}
            onblur={() => {
              updateState({ focused: false })
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
            value={value}
          />
          {props.getEndIcon ? <span className="endIcon">{props.getEndIcon({ state })}</span> : null}
        </div>
        <span className="helperText">{props.getHelperText?.({ state })}</span>
      </label>
    )
  },
})
