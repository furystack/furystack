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
      fontSize: cssVariableTheme.typography.fontSize.xs,
      color: cssVariableTheme.text.secondary,
      padding: '1em',
      borderRadius: cssVariableTheme.shape.borderRadius.md,
      border: 'none',
      transition: `color ${cssVariableTheme.transitions.duration.slow} ${cssVariableTheme.transitions.easing.default}`,
    },
    '&[data-variant="outlined"] label': {
      border: `1px solid ${cssVariableTheme.action.subtleBorder}`,
    },
    '&[data-disabled] label': {
      color: cssVariableTheme.text.disabled,
    },
    '&:focus-within label': {
      color: cssVariableTheme.palette.primary.main,
    },
    '& .textarea-content': {
      border: 'none',
      backgroundColor: 'transparent',
      outline: 'none',
      fontSize: cssVariableTheme.typography.fontSize.sm,
      width: '100%',
      textOverflow: 'ellipsis',
      boxShadow: '0px 0px 0px rgba(128,128,128,0.1)',
      transition: `box-shadow ${cssVariableTheme.transitions.duration.normal} ease`,
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
