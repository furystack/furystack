import type { PartialElement } from '@furystack/shades'
import { createComponent, Shade } from '@furystack/shades'
import { cssVariableTheme } from '../../services/css-variable-theme.js'

export interface TextAreaProps extends PartialElement<HTMLTextAreaElement> {
  labelTitle?: string
  labelProps?: PartialElement<HTMLLabelElement>
  autofocus?: boolean
  variant?: 'contained' | 'outlined'
}

export const TextArea = Shade<TextAreaProps>({
  shadowDomName: 'shade-text-area',
  css: {
    display: 'block',
    marginBottom: '1em',
    '& label': {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
      fontSize: '10px',
      color: '#bbb',
      padding: '1em',
      borderRadius: '5px',
      border: 'none',
      transition: 'color 0.3s cubic-bezier(0.455, 0.030, 0.515, 0.955)',
    },
    '&[data-variant="outlined"] label': {
      border: '1px solid #bbb',
    },
    '&[data-disabled] label': {
      color: 'rgb(170, 170, 170)',
    },
    '&:focus-within label': {
      color: cssVariableTheme.palette.primary.main,
    },
    '& .textarea-content': {
      border: 'none',
      backgroundColor: 'transparent',
      outline: 'none',
      fontSize: '12px',
      width: '100%',
      textOverflow: 'ellipsis',
      boxShadow: '0px 0px 0px rgba(128,128,128,0.1)',
      transition: 'box-shadow 0.2s ease',
    },
    '&:focus-within .textarea-content': {
      boxShadow: `0px 3px 0px ${cssVariableTheme.palette.primary.main}`,
    },
  },
  render: ({ props, element }) => {
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

    return (
      <label {...props.labelProps} style={props.labelProps?.style}>
        <span>{props.labelTitle}</span>

        <div
          className="textarea-content"
          contentEditable={props.readOnly === true || props.disabled === true ? 'inherit' : 'true'}
          {...props}
          style={props.style}
        >
          {props.value}
        </div>
      </label>
    )
  },
})
