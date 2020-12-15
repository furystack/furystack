import { Shade, PartialElement, createComponent } from '@furystack/shades'
import { promisifyAnimation } from '../utils/promisify-animation'
import { colors } from './styles'

export interface InputProps extends PartialElement<HTMLInputElement> {
  onTextChange?: (text: string) => void
  labelTitle?: string
  multiLine?: false
}

export interface TextAreaProps extends PartialElement<HTMLTextAreaElement> {
  labelTitle?: string
  multiLine: true
}

export type TextInputProps = InputProps | TextAreaProps

export const Input = Shade<TextInputProps>({
  shadowDomName: 'shade-input',
  render: ({ props, element }) => {
    return (
      <label
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          fontSize: '10px',
          color: props.disabled ? 'rgb(170, 170, 170)' : '#bbb',
          marginBottom: '1em',
          padding: '1em',
        }}>
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
            }}>
            {props.value}
          </div>
        ) : (
          <input
            onchange={(ev) => {
              props.onTextChange && props.onTextChange((ev.target as any).value)
              props.onchange && (props.onchange as any)(ev)
            }}
            onfocus={() => {
              if (!props.disabled) {
                promisifyAnimation(
                  element.querySelector('label'),
                  [{ color: '#bbb' }, { color: colors.primary.main }],
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
                    { boxShadow: `0px 3px 0px ${colors.primary.dark}` },
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
                  [{ color: colors.primary.main }, { color: '#bbb' }],
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
          />
        )}
      </label>
    )
  },
})
