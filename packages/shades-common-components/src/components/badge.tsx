import type { PartialElement } from '@furystack/shades'
import { Shade, createComponent } from '@furystack/shades'
import { buildTransition, cssVariableTheme } from '../services/css-variable-theme.js'
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

const colorMap: Record<keyof Palette, { main: string; mainContrast: string }> = {
  primary: {
    main: cssVariableTheme.palette.primary.main,
    mainContrast: cssVariableTheme.palette.primary.mainContrast,
  },
  secondary: {
    main: cssVariableTheme.palette.secondary.main,
    mainContrast: cssVariableTheme.palette.secondary.mainContrast,
  },
  error: {
    main: cssVariableTheme.palette.error.main,
    mainContrast: cssVariableTheme.palette.error.mainContrast,
  },
  warning: {
    main: cssVariableTheme.palette.warning.main,
    mainContrast: cssVariableTheme.palette.warning.mainContrast,
  },
  success: {
    main: cssVariableTheme.palette.success.main,
    mainContrast: cssVariableTheme.palette.success.mainContrast,
  },
  info: {
    main: cssVariableTheme.palette.info.main,
    mainContrast: cssVariableTheme.palette.info.mainContrast,
  },
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
  render: ({ props, children, element }) => {
    const { count, dot, color, max = 99, showZero, visible = true, style } = props

    const colors = color ? colorMap[color] : defaultColors
    element.style.setProperty('--badge-color-main', colors.main)
    element.style.setProperty('--badge-color-contrast', colors.mainContrast)

    if (style) {
      Object.assign(element.style, style)
    }

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
