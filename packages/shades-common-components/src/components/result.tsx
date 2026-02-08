import type { PartialElement } from '@furystack/shades'
import { Shade, createComponent } from '@furystack/shades'
import { cssVariableTheme } from '../services/css-variable-theme.js'
import { paletteMainColors } from '../services/palette-css-vars.js'

/**
 * Result status types. Includes both semantic statuses and HTTP error codes.
 */
export type ResultStatus = 'success' | 'error' | 'warning' | 'info' | '403' | '404' | '500'

export type ResultProps = PartialElement<HTMLElement> & {
  /** The status determines the icon and color of the result */
  status: ResultStatus
  /** The main title text */
  title: string
  /** Optional subtitle text below the title */
  subtitle?: string
  /** Optional custom icon to override the default status icon */
  icon?: string
}

const statusColorMap: Record<ResultStatus, string> = {
  success: paletteMainColors.success.main,
  error: paletteMainColors.error.main,
  warning: paletteMainColors.warning.main,
  info: paletteMainColors.info.main,
  '403': paletteMainColors.warning.main,
  '404': paletteMainColors.info.main,
  '500': paletteMainColors.error.main,
}

const defaultIcons: Record<ResultStatus, string> = {
  success: '✅',
  error: '❌',
  warning: '⚠️',
  info: 'ℹ️',
  '403': '🚫',
  '404': '🔍',
  '500': '💥',
}

const defaultTitles: Record<ResultStatus, string> = {
  success: 'Success',
  error: 'Error',
  warning: 'Warning',
  info: 'Information',
  '403': '403 - Forbidden',
  '404': '404 - Not Found',
  '500': '500 - Internal Server Error',
}

/**
 * Result component for displaying operation outcomes, status pages, and feedback.
 * Supports success, error, warning, info statuses and common HTTP error codes (403, 404, 500).
 */
export const Result = Shade<ResultProps>({
  shadowDomName: 'shade-result',
  css: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    textAlign: 'center',
    padding: `${cssVariableTheme.spacing.xl} ${cssVariableTheme.spacing.lg}`,
    fontFamily: cssVariableTheme.typography.fontFamily,
    boxSizing: 'border-box',

    // ==========================================
    // ICON
    // ==========================================

    '& .result-icon': {
      fontSize: '64px',
      lineHeight: '1',
      marginBottom: cssVariableTheme.spacing.lg,
      color: 'var(--result-status-color)',
    },

    // ==========================================
    // TITLE
    // ==========================================

    '& .result-title': {
      fontSize: cssVariableTheme.typography.fontSize.xl,
      fontWeight: cssVariableTheme.typography.fontWeight.bold,
      color: cssVariableTheme.text.primary,
      margin: '0',
      marginBottom: cssVariableTheme.spacing.sm,
      lineHeight: cssVariableTheme.typography.lineHeight.tight,
    },

    // ==========================================
    // SUBTITLE
    // ==========================================

    '& .result-subtitle': {
      fontSize: cssVariableTheme.typography.fontSize.md,
      color: cssVariableTheme.text.secondary,
      margin: '0',
      marginBottom: cssVariableTheme.spacing.lg,
      lineHeight: cssVariableTheme.typography.lineHeight.normal,
      maxWidth: '480px',
    },

    // ==========================================
    // EXTRA (actions area)
    // ==========================================

    '& .result-extra': {
      display: 'flex',
      gap: cssVariableTheme.spacing.md,
      marginTop: cssVariableTheme.spacing.md,
      flexWrap: 'wrap',
      justifyContent: 'center',
    },
  },
  render: ({ props, children, element }) => {
    const { status, title, subtitle, icon, style } = props

    const displayIcon = icon ?? defaultIcons[status]
    const statusColor = statusColorMap[status]

    element.setAttribute('data-status', status)
    element.style.setProperty('--result-status-color', statusColor)

    if (style) {
      Object.assign(element.style, style)
    }

    const hasChildren = children && (Array.isArray(children) ? children.length > 0 : true)

    return (
      <>
        <span className="result-icon" role="img">
          {displayIcon}
        </span>
        <h3 className="result-title">{title}</h3>
        {subtitle ? <p className="result-subtitle">{subtitle}</p> : null}
        {hasChildren ? <div className="result-extra">{children}</div> : null}
      </>
    )
  },
})

export { defaultIcons as resultDefaultIcons, defaultTitles as resultDefaultTitles }
