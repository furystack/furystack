import { Shade, createComponent } from '@furystack/shades'
import { buildTransition, cssVariableTheme } from '../services/css-variable-theme.js'

export type TooltipPlacement = 'top' | 'bottom' | 'left' | 'right'

export type TooltipProps = {
  /**
   * The tooltip content to display
   */
  title: JSX.Element | string
  /**
   * Placement of the tooltip relative to its trigger element
   */
  placement?: TooltipPlacement
  /**
   * Delay in milliseconds before the tooltip appears
   */
  delay?: number
  /**
   * Whether the tooltip is disabled
   */
  disabled?: boolean
}

export const Tooltip = Shade<TooltipProps>({
  shadowDomName: 'shade-tooltip',
  css: {
    position: 'relative',
    display: 'inline-flex',

    '& .tooltip-popup': {
      position: 'absolute',
      zIndex: cssVariableTheme.zIndex.tooltip,
      pointerEvents: 'none',
      opacity: '0',
      visibility: 'hidden',
      transition: buildTransition(
        ['opacity', cssVariableTheme.transitions.duration.fast, cssVariableTheme.transitions.easing.default],
        ['visibility', cssVariableTheme.transitions.duration.fast, cssVariableTheme.transitions.easing.default],
      ),
      transitionDelay: '0s',
      padding: `${cssVariableTheme.spacing.xs} ${cssVariableTheme.spacing.sm}`,
      borderRadius: cssVariableTheme.shape.borderRadius.sm,
      backgroundColor: cssVariableTheme.text.primary,
      color: cssVariableTheme.background.default,
      fontSize: cssVariableTheme.typography.fontSize.xs,
      fontFamily: cssVariableTheme.typography.fontFamily,
      fontWeight: cssVariableTheme.typography.fontWeight.medium,
      lineHeight: cssVariableTheme.typography.lineHeight.tight,
      whiteSpace: 'nowrap',
      maxWidth: '300px',
      boxShadow: cssVariableTheme.shadows.md,
    },

    '&:hover .tooltip-popup, &:focus-within .tooltip-popup': {
      opacity: '1',
      visibility: 'visible',
      transitionDelay: 'var(--tooltip-delay, 0s)',
    },

    '&[data-disabled] .tooltip-popup': {
      display: 'none',
    },

    // Placement: top (default)
    '&:not([data-placement]) .tooltip-popup, &[data-placement="top"] .tooltip-popup': {
      bottom: '100%',
      left: '50%',
      transform: 'translateX(-50%)',
      marginBottom: cssVariableTheme.spacing.xs,
    },

    // Placement: bottom
    '&[data-placement="bottom"] .tooltip-popup': {
      top: '100%',
      left: '50%',
      transform: 'translateX(-50%)',
      marginTop: cssVariableTheme.spacing.xs,
    },

    // Placement: left
    '&[data-placement="left"] .tooltip-popup': {
      right: '100%',
      top: '50%',
      transform: 'translateY(-50%)',
      marginRight: cssVariableTheme.spacing.xs,
    },

    // Placement: right
    '&[data-placement="right"] .tooltip-popup': {
      left: '100%',
      top: '50%',
      transform: 'translateY(-50%)',
      marginLeft: cssVariableTheme.spacing.xs,
    },

    // Arrow base styles
    '& .tooltip-arrow': {
      position: 'absolute',
      width: '8px',
      height: '8px',
      backgroundColor: 'inherit',
      transform: 'rotate(45deg)',
    },

    // Arrow: top placement (arrow at bottom of popup)
    '&:not([data-placement]) .tooltip-arrow, &[data-placement="top"] .tooltip-arrow': {
      bottom: '-4px',
      left: '50%',
      marginLeft: '-4px',
    },

    // Arrow: bottom placement (arrow at top of popup)
    '&[data-placement="bottom"] .tooltip-arrow': {
      top: '-4px',
      left: '50%',
      marginLeft: '-4px',
    },

    // Arrow: left placement (arrow at right of popup)
    '&[data-placement="left"] .tooltip-arrow': {
      right: '-4px',
      top: '50%',
      marginTop: '-4px',
    },

    // Arrow: right placement (arrow at left of popup)
    '&[data-placement="right"] .tooltip-arrow': {
      left: '-4px',
      top: '50%',
      marginTop: '-4px',
    },
  },
  render: ({ props, children, element }) => {
    const { placement, delay, disabled } = props

    if (placement) {
      element.setAttribute('data-placement', placement)
    } else {
      element.removeAttribute('data-placement')
    }

    if (disabled) {
      element.setAttribute('data-disabled', '')
    } else {
      element.removeAttribute('data-disabled')
    }

    if (delay !== undefined && delay > 0) {
      element.style.setProperty('--tooltip-delay', `${delay}ms`)
    } else {
      element.style.removeProperty('--tooltip-delay')
    }

    return (
      <>
        {children}
        <div className="tooltip-popup" role="tooltip">
          <span className="tooltip-arrow" />
          {props.title}
        </div>
      </>
    )
  },
})
