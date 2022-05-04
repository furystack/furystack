import { Shade, PartialElement, createComponent } from '@furystack/shades'
import { ThemeProviderService } from '..'
import { Theme } from '../services'
import { promisifyAnimation } from '../utils/promisify-animation'

export interface InputProps extends PartialElement<HTMLInputElement> {
  onTextChange?: (text: string) => void
  labelTitle?: string
  multiLine?: false
  labelProps?: PartialElement<HTMLLabelElement>
  autofocus?: boolean
}

export interface TextAreaProps extends PartialElement<HTMLTextAreaElement> {
  labelTitle?: string
  multiLine: true
  labelProps?: PartialElement<HTMLLabelElement>
  autofocus?: boolean
}

export type TextInputProps = InputProps | TextAreaProps

export type TextInputState = {
  theme: Theme
  value?: string
}

export const Input = Shade<TextInputProps, TextInputState>({
  shadowDomName: 'shade-input',
  getInitialState: ({ injector, props }) => ({
    theme: injector.getInstance(ThemeProviderService).theme.getValue(),
    value: props.value,
  }),
  resources: ({ injector, updateState }) => [
    injector.getInstance(ThemeProviderService).theme.subscribe((theme) => updateState({ theme })),
  ],
  render: ({ props, element, injector, getState, updateState }) => {
    const themeProvider = injector.getInstance(ThemeProviderService)
    const { theme, value } = getState()
    const { palette } = theme

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
          ...props.labelProps?.style,
        }}
      >
        {props.labelTitle}
        {props.multiLine ? (
          <div
            contentEditable={props.readOnly === true || props.disabled === true ? 'inherit' : 'true'}
            {...props}
            style={{
              border: 'none',
              backgroundColor: 'transparent',
              outline: 'none',
              fontSize: '12px',
              width: '100%',
              textOverflow: 'ellipsis',
              ...props.style,
            }}
          >
            {value}
          </div>
        ) : (
          <input
            onchange={(ev) => {
              const newValue = (ev.target as HTMLInputElement).value
              updateState({ value: newValue }, true)
              props.onTextChange && props.onTextChange(newValue)
              props.onchange && (props.onchange as any)(ev)
            }}
            onfocus={() => {
              if (!props.disabled) {
                promisifyAnimation(
                  element.querySelector('label'),
                  [{ color: themeProvider.getTextColor(theme.background.default) }, { color: palette.primary.main }],
                  {
                    duration: 500,
                    easing: 'cubic-bezier(0.455, 0.030, 0.515, 0.955)',
                    fill: 'forwards',
                  },
                )
                promisifyAnimation(
                  element.querySelector('input'),
                  [
                    { boxShadow: '0px 0px 0px rgba(128,128,128,0.1)' },
                    { boxShadow: `0px 3px 0px ${palette.primary.main}` },
                  ],
                  {
                    duration: 200,
                    fill: 'forwards',
                  },
                )
              }
            }}
            onblur={() => {
              if (!props.disabled) {
                promisifyAnimation(
                  element.querySelector('label'),
                  [{ color: palette.primary.main }, { color: themeProvider.getTextColor(theme.background.default) }],
                  {
                    duration: 200,
                    easing: 'cubic-bezier(0.455, 0.030, 0.515, 0.955)',
                    fill: 'forwards',
                  },
                )
                promisifyAnimation(
                  element.querySelector('input'),
                  [
                    { boxShadow: '0px 3px 0px rgba(128,128,128,0.4)' },
                    { boxShadow: '0px 0px 0px rgba(128,128,128,0.1)' },
                  ],
                  {
                    duration: 400,
                    fill: 'forwards',
                  },
                )
              }
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
        )}
      </label>
    )
  },
})
