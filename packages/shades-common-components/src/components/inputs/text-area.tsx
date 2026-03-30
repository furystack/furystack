import type { PartialElement } from '@furystack/shades'
import { createComponent, Shade } from '@furystack/shades'
import { cssVariableTheme } from '../../services/css-variable-theme.js'
import type { ComponentSize } from '../component-size.js'

export interface TextAreaProps extends PartialElement<HTMLTextAreaElement> {
  labelTitle?: string
  labelProps?: PartialElement<HTMLLabelElement>
  autofocus?: boolean
  variant?: 'contained' | 'outlined'
  /**
   * The size of the text area.
   * @default 'medium'
   */
  size?: ComponentSize
}

export const TextArea = Shade<TextAreaProps>({
  customElementName: 'shade-text-area',
  css: {
    display: 'block',
    fontFamily: cssVariableTheme.typography.fontFamily,
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

    // Size: small
    '&[data-size="small"] label': {
      padding: cssVariableTheme.spacing.sm,
      fontSize: cssVariableTheme.typography.fontSize.xs,
    },
    '&[data-size="small"] .textarea-content': {
      fontSize: cssVariableTheme.typography.fontSize.xs,
    },

    // Size: large
    '&[data-size="large"] label': {
      padding: cssVariableTheme.spacing.lg,
      fontSize: cssVariableTheme.typography.fontSize.sm,
    },
    '&[data-size="large"] .textarea-content': {
      fontSize: cssVariableTheme.typography.fontSize.md,
    },
  },
  render: ({ props, useHostProps }) => {
    useHostProps({
      'data-variant': props.variant || undefined,
      'data-size': props.size && props.size !== 'medium' ? props.size : undefined,
      'data-disabled': props.disabled ? '' : undefined,
    })

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
