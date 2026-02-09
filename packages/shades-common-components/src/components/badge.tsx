import type { PartialElement } from '@furystack/shades'
import { Shade, createComponent } from '@furystack/shades'
import { buildTransition, cssVariableTheme } from '../services/css-variable-theme.js'
import { paletteMainColors } from '../services/palette-css-vars.js'
import type { Palette } from '../services/theme-provider-service.js'

export type BadgeProps = PartialElement<HTMLElement> & {
  /** The count to display in the badge */
  count?: number
  /** If true, renders a small dot instead of a count */
  dot?: boolean
  /** Palette color for the badge */
  color?: keyof Palette
  /** Maximum count to display. Counts above this show `{max}+` */
  max?: number
  /** If true, shows the badge when count is zero */
  showZero?: boolean
  /** Controls badge visibility. Defaults to true */
  visible?: boolean
}

const defaultColors = {
  main: cssVariableTheme.palette.error.main,
  mainContrast: cssVariableTheme.palette.error.mainContrast,
}

export const Badge = Shade<BadgeProps>({
  shadowDomName: 'shade-badge',
  css: {
    display: 'inline-flex',
    position: 'relative',
    verticalAlign: 'middle',
    flexShrink: '0',

    '& .badge-indicator': {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      position: 'absolute',
      top: '0',
      right: '0',
      transform: 'translate(50%, -50%)',
      transformOrigin: '100% 0%',
      fontFamily: cssVariableTheme.typography.fontFamily,
      fontSize: cssVariableTheme.typography.fontSize.xs,
      fontWeight: cssVariableTheme.typography.fontWeight.medium,
      lineHeight: '1',
      minWidth: '20px',
      height: '20px',
      padding: `0 ${cssVariableTheme.spacing.xs}`,
      borderRadius: cssVariableTheme.shape.borderRadius.lg,
      background: 'var(--badge-color-main)',
      color: 'var(--badge-color-contrast)',
      boxSizing: 'border-box',
      whiteSpace: 'nowrap',
      zIndex: '1',
      transition: buildTransition(
        ['transform', cssVariableTheme.transitions.duration.fast, cssVariableTheme.transitions.easing.default],
        ['opacity', cssVariableTheme.transitions.duration.fast, cssVariableTheme.transitions.easing.default],
      ),
    },

    '& .badge-indicator[data-dot]': {
      minWidth: '8px',
      width: '8px',
      height: '8px',
      padding: '0',
      borderRadius: cssVariableTheme.shape.borderRadius.full,
    },

    '& .badge-indicator[data-hidden]': {
      transform: 'translate(50%, -50%) scale(0)',
      opacity: '0',
    },
  },
  render: ({ props, children, useHostProps }) => {
    const { count, dot, color, max = 99, showZero, visible = true, style } = props

    const colors = color ? paletteMainColors[color] : defaultColors
    useHostProps({
      style: {
        '--badge-color-main': colors.main,
        '--badge-color-contrast': colors.mainContrast,
        ...(style as Record<string, string>),
      },
    })

    const shouldHide = !visible || (!dot && !showZero && (count === undefined || count === 0))
    const displayValue = dot ? '' : count !== undefined && count > max ? `${max}+` : (count?.toString() ?? '')

    return (
      <>
        {children}
        <span
          className="badge-indicator"
          {...(dot ? { 'data-dot': '' } : {})}
          {...(shouldHide ? { 'data-hidden': '' } : {})}
        >
          {displayValue}
        </span>
      </>
    )
  },
})
