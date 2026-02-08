import type { PartialElement } from '@furystack/shades'
import { Shade, createComponent } from '@furystack/shades'
import { buildTransition, cssVariableTheme } from '../services/css-variable-theme.js'
import { paletteMainColors } from '../services/palette-css-vars.js'
import { Icon } from './icons/icon.js'
import {
  checkCircle,
  close as closeIcon,
  errorCircle,
  info as infoIcon,
  warning as warningIcon,
} from './icons/icon-definitions.js'

export type AlertSeverity = 'error' | 'warning' | 'info' | 'success'

export type AlertProps = PartialElement<HTMLElement> & {
  severity?: AlertSeverity
  variant?: 'filled' | 'outlined' | 'standard'
  title?: string
  onClose?: (ev: MouseEvent) => void
  icon?: JSX.Element | string
}

const severityColorMap: Record<AlertSeverity, { main: string; mainContrast: string; light: string }> = {
  error: { ...paletteMainColors.error, light: cssVariableTheme.palette.error.light },
  warning: { ...paletteMainColors.warning, light: cssVariableTheme.palette.warning.light },
  info: { ...paletteMainColors.info, light: cssVariableTheme.palette.info.light },
  success: { ...paletteMainColors.success, light: cssVariableTheme.palette.success.light },
}

const defaultIcons: Record<AlertSeverity, JSX.Element> = {
  error: (<Icon icon={errorCircle} size="small" />) as unknown as JSX.Element,
  warning: (<Icon icon={warningIcon} size="small" />) as unknown as JSX.Element,
  info: (<Icon icon={infoIcon} size="small" />) as unknown as JSX.Element,
  success: (<Icon icon={checkCircle} size="small" />) as unknown as JSX.Element,
}

export const Alert = Shade<AlertProps>({
  shadowDomName: 'shade-alert',
  css: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: cssVariableTheme.spacing.md,
    padding: `${cssVariableTheme.spacing.md} ${cssVariableTheme.spacing.lg}`,
    fontFamily: cssVariableTheme.typography.fontFamily,
    fontSize: cssVariableTheme.typography.fontSize.sm,
    lineHeight: '1.5',
    borderRadius: cssVariableTheme.shape.borderRadius.md,
    boxSizing: 'border-box',
    transition: buildTransition(
      ['background', cssVariableTheme.transitions.duration.fast, cssVariableTheme.transitions.easing.default],
      ['color', cssVariableTheme.transitions.duration.fast, cssVariableTheme.transitions.easing.default],
      ['box-shadow', cssVariableTheme.transitions.duration.fast, cssVariableTheme.transitions.easing.default],
    ),

    // ==========================================
    // STANDARD VARIANT (default)
    // ==========================================

    '&:not([data-variant]), &[data-variant="standard"]': {
      background: 'color-mix(in srgb, var(--alert-color-main) 12%, transparent)',
      color: 'var(--alert-color-main)',
    },

    // ==========================================
    // FILLED VARIANT
    // ==========================================

    '&[data-variant="filled"]': {
      background: 'var(--alert-color-main)',
      color: 'var(--alert-color-main-contrast)',
    },

    // ==========================================
    // OUTLINED VARIANT
    // ==========================================

    '&[data-variant="outlined"]': {
      background: 'transparent',
      color: 'var(--alert-color-main)',
      boxShadow: '0px 0px 0px 1px var(--alert-color-main)',
    },

    // ==========================================
    // ICON
    // ==========================================

    '& .alert-icon': {
      display: 'flex',
      alignItems: 'center',
      fontSize: '20px',
      lineHeight: '1',
      flexShrink: '0',
      paddingTop: '1px',
    },

    // ==========================================
    // CONTENT
    // ==========================================

    '& .alert-content': {
      flex: '1',
      minWidth: '0',
    },

    '& .alert-title': {
      fontWeight: cssVariableTheme.typography.fontWeight.semibold,
      marginBottom: cssVariableTheme.spacing.xs,
    },

    '& .alert-message': {
      opacity: '0.9',
    },

    // ==========================================
    // CLOSE BUTTON
    // ==========================================

    '& .alert-close': {
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      cursor: 'pointer',
      borderRadius: cssVariableTheme.shape.borderRadius.full,
      border: 'none',
      background: 'transparent',
      color: 'inherit',
      padding: '4px',
      marginTop: '-2px',
      marginRight: `-${cssVariableTheme.spacing.sm}`,
      fontSize: '14px',
      lineHeight: '1',
      opacity: '0.7',
      flexShrink: '0',
      transition: buildTransition(
        ['opacity', cssVariableTheme.transitions.duration.fast, cssVariableTheme.transitions.easing.default],
        ['background', cssVariableTheme.transitions.duration.fast, cssVariableTheme.transitions.easing.default],
      ),
    },

    '& .alert-close:hover': {
      opacity: '1',
      background: 'color-mix(in srgb, currentColor 15%, transparent)',
    },
  },
  render: ({ props, children, element }) => {
    const { severity = 'info', variant, title, onClose, icon, style } = props

    if (variant) {
      element.setAttribute('data-variant', variant)
    } else {
      element.removeAttribute('data-variant')
    }

    element.setAttribute('data-severity', severity)
    element.setAttribute('role', 'alert')

    const colors = severityColorMap[severity]
    element.style.setProperty('--alert-color-main', colors.main)
    element.style.setProperty('--alert-color-main-contrast', colors.mainContrast)
    element.style.setProperty('--alert-color-light', colors.light)

    if (style) {
      Object.assign(element.style, style)
    }

    const displayIcon = icon ?? defaultIcons[severity]

    return (
      <>
        <span className="alert-icon">{displayIcon}</span>
        <div className="alert-content">
          {title ? <div className="alert-title">{title}</div> : null}
          <div className="alert-message">{children}</div>
        </div>
        {onClose ? (
          <span
            className="alert-close"
            role="button"
            onclick={(ev: MouseEvent) => {
              ev.stopPropagation()
              onClose(ev)
            }}
          >
            <Icon icon={closeIcon} size="small" />
          </span>
        ) : null}
      </>
    )
  },
})
