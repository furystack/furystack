import { Shade, PartialElement, createComponent } from '@furystack/shades'
import { ThemeProviderService } from '..'
import { Theme } from '../services'
import { promisifyAnimation } from '../utils/promisify-animation'

export interface TextInputProps extends PartialElement<HTMLInputElement> {
  onTextChange?: (text: string) => void
  labelTitle?: string
  labelProps?: PartialElement<HTMLLabelElement>
  autofocus?: boolean
  variant?: 'contained' | 'outlined'
  getValidityErrorMessage?: (validity: ValidityState) => string
}

export type TextInputState = {
  theme: Theme
  value?: string
  focused?: boolean
  validity?: ValidityState
}

export const Input = Shade<TextInputProps, TextInputState>({
  shadowDomName: 'shade-input',
  getInitialState: ({ injector, props }) => ({
    theme: injector.getInstance(ThemeProviderService).theme.getValue(),
    value: props.value,
    focused: props.autofocus || false,
    validity: { valid: true } as ValidityState,
  }),
  resources: ({ injector, updateState }) => [
    injector.getInstance(ThemeProviderService).theme.subscribe((theme) => updateState({ theme })),
  ],
  compareState: ({ oldState, newState }) => {
    console.log({ oldState, newState })

    if (!oldState.focused && newState.focused) {
      console.log('focus')
    }
    if (oldState.focused && !newState.focused) {
      console.log('blur')
    }

    return false
  },
  render: ({ props, injector, getState, updateState }) => {
    const themeProvider = injector.getInstance(ThemeProviderService)
    const { theme, value } = getState()
    const { palette } = theme

    console.log('render')

    return (
      <label
        {...props.labelProps}
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          fontSize: '10px',
          color: props.disabled ? 'rgb(170, 170, 170)' : '#bbb',
          marginBottom: '1em',
          padding: '1em',
          borderRadius: '5px',
          border: props.variant === 'outlined' ? '1px solid #bbb' : 'none',
          ...props.labelProps?.style,
        }}
      >
        <span>{props.labelTitle}</span>

        <input
          onchange={(ev) => {
            const el = ev.target as HTMLInputElement
            const newValue = el.value
            updateState({ value: newValue }, true)
            props.onTextChange && props.onTextChange(newValue)
            props.onchange && (props.onchange as any)(ev)
            if (!el?.validity?.valid) {
              console.log(el.validity)
              promisifyAnimation(
                el.parentElement,
                [{ color: palette.primary.main }, { color: themeProvider.getTextColor(palette.error.main) }],
                { duration: 500, easing: 'ease-in-out', fill: 'forwards' },
              )
            }
          }}
          onfocus={() => {
            updateState({ focused: true })
            // if (!props.disabled) {
            //   promisifyAnimation(
            //     element.querySelector('label'),
            //     [{ color: themeProvider.getTextColor(theme.background.default) }, { color: palette.primary.main }],
            //     {
            //       duration: 500,
            //       easing: 'cubic-bezier(0.455, 0.030, 0.515, 0.955)',
            //       fill: 'forwards',
            //     },
            //   )
            //   promisifyAnimation(
            //     element.querySelector('input'),
            //     [
            //       { boxShadow: '0px 0px 0px rgba(128,128,128,0.1)' },
            //       { boxShadow: `0px 3px 0px ${palette.primary.main}` },
            //     ],
            //     {
            //       duration: 200,
            //       fill: 'forwards',
            //     },
            //   )
            // }
          }}
          onblur={() => {
            updateState({ focused: false })
            // if (!props.disabled) {
            //   promisifyAnimation(
            //     element.querySelector('label'),
            //     [{ color: palette.primary.main }, { color: themeProvider.getTextColor(theme.background.default) }],
            //     {
            //       duration: 200,
            //       easing: 'cubic-bezier(0.455, 0.030, 0.515, 0.955)',
            //       fill: 'forwards',
            //     },
            //   )
            //   promisifyAnimation(
            //     element.querySelector('input'),
            //     [
            //       { boxShadow: '0px 3px 0px rgba(128,128,128,0.4)' },
            //       { boxShadow: '0px 0px 0px rgba(128,128,128,0.1)' },
            //     ],
            //     {
            //       duration: 400,
            //       fill: 'forwards',
            //     },
            //   )
            // }
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
      </label>
    )
  },
})
