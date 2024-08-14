import type { PartialElement } from '@furystack/shades'
import { createComponent, Shade } from '@furystack/shades'
import { ThemeProviderService } from '../../services/theme-provider-service.js'
import { promisifyAnimation } from '../../utils/promisify-animation.js'

export interface TextAreaProps extends PartialElement<HTMLTextAreaElement> {
  labelTitle?: string
  labelProps?: PartialElement<HTMLLabelElement>
  autofocus?: boolean
  variant?: 'contained' | 'outlined'
}

export const TextArea = Shade<TextAreaProps>({
  shadowDomName: 'shade-text-area',
  render: ({ props, element, injector }) => {
    const themeProvider = injector.getInstance(ThemeProviderService)
    const { theme } = themeProvider
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
          borderRadius: '5px',
          border: props.variant === 'outlined' ? '1px solid #bbb' : 'none',
          ...props.labelProps?.style,
        }}
      >
        <span>{props.labelTitle}</span>

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
          onfocus={() => {
            if (!props.disabled) {
              void promisifyAnimation(
                element.querySelector('label'),
                [{ color: themeProvider.getTextColor(theme.background.default) }, { color: palette.primary.main }],
                {
                  duration: 500,
                  easing: 'cubic-bezier(0.455, 0.030, 0.515, 0.955)',
                  fill: 'forwards',
                },
              )
              void promisifyAnimation(
                element.querySelector('div[contenteditable="true"]'),
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
              void promisifyAnimation(
                element.querySelector('label'),
                [{ color: palette.primary.main }, { color: themeProvider.getTextColor(theme.background.default) }],
                {
                  duration: 200,
                  easing: 'cubic-bezier(0.455, 0.030, 0.515, 0.955)',
                  fill: 'forwards',
                },
              )
              void promisifyAnimation(
                element.querySelector('div[contenteditable="true"]'),
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
        >
          {props.value}
        </div>
      </label>
    )
  },
})
