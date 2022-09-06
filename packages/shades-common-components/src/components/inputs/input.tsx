import { Shade, PartialElement, createComponent, attachStyles } from '@furystack/shades'
import { ThemeProviderService } from '../..'
import { Theme } from '../../services'

export interface TextInputProps extends PartialElement<HTMLInputElement> {
  onTextChange?: (text: string) => void
  labelTitle?: JSX.Element | string
  labelProps?: PartialElement<HTMLLabelElement>
  autofocus?: boolean
  variant?: 'contained' | 'outlined'
  getHelperText?: (options: { state: TextInputState }) => JSX.Element | string
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
              state.validity?.valid === false ? state.theme.palette.error.main : state.theme.palette.primary.main,
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
              ? state.theme.palette.primary.main
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

    return false
  },
  render: ({ props, getState, updateState, injector }) => {
    const state = getState()
    const { value } = state
    const themeProvider = injector.getInstance(ThemeProviderService)

    return (
      <label {...props.labelProps} style={getLabelStyle({ props, state, themeProvider })}>
        {props.labelTitle}

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
            padding: '0.6em 0',
            ...props.style,
          }}
          value={value}
        />
        <span className="helperText">{props.getHelperText?.({ state })}</span>
      </label>
    )
  },
})
