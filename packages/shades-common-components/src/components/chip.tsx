import type { PartialElement } from '@furystack/shades'
import { Shade, createComponent } from '@furystack/shades'
import { buildTransition, cssVariableTheme } from '../services/css-variable-theme.js'
import { paletteFullColors } from '../services/palette-css-vars.js'
import type { Palette } from '../services/theme-provider-service.js'
import { Icon } from './icons/icon.js'
import { close } from './icons/icon-definitions.js'

export type ChipProps = PartialElement<HTMLElement> & {
  variant?: 'filled' | 'outlined'
  color?: keyof Palette
  size?: 'small' | 'medium'
  disabled?: boolean
  clickable?: boolean
  onDelete?: (ev: MouseEvent) => void
}

const defaultColors = {
  main: cssVariableTheme.text.secondary,
  mainContrast: cssVariableTheme.background.default,
  light: cssVariableTheme.text.primary,
  lightContrast: cssVariableTheme.background.default,
  dark: cssVariableTheme.text.disabled,
  darkContrast: cssVariableTheme.background.default,
}

export const Chip = Shade<ChipProps>({
  tagName: 'shade-chip',
  css: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: cssVariableTheme.spacing.xs,
    maxWidth: '100%',
    fontFamily: cssVariableTheme.typography.fontFamily,
    fontSize: cssVariableTheme.typography.fontSize.sm,
    fontWeight: cssVariableTheme.typography.fontWeight.medium,
    lineHeight: '1',
    borderRadius: cssVariableTheme.shape.borderRadius.lg,
    whiteSpace: 'nowrap',
    verticalAlign: 'middle',
    boxSizing: 'border-box',
    userSelect: 'none',
    transition: buildTransition(
      ['background', cssVariableTheme.transitions.duration.fast, cssVariableTheme.transitions.easing.default],
      ['box-shadow', cssVariableTheme.transitions.duration.fast, cssVariableTheme.transitions.easing.default],
      ['color', cssVariableTheme.transitions.duration.fast, cssVariableTheme.transitions.easing.default],
      ['opacity', cssVariableTheme.transitions.duration.fast, cssVariableTheme.transitions.easing.default],
    ),

    // Size: medium (default)
    height: '32px',
    padding: `0 ${cssVariableTheme.spacing.md}`,

    '&[data-size="small"]': {
      height: '24px',
      padding: `0 ${cssVariableTheme.spacing.sm}`,
      fontSize: cssVariableTheme.typography.fontSize.xs,
    },

    // Disabled state
    '&[data-disabled]': {
      opacity: cssVariableTheme.action.disabledOpacity,
      pointerEvents: 'none',
    },

    // Clickable state
    '&[data-clickable]': {
      cursor: 'pointer',
    },

    '&[data-clickable]:active:not([data-disabled])': {
      transform: 'scale(0.96)',
    },

    // ==========================================
    // FILLED VARIANT (default)
    // ==========================================

    '&:not([data-variant])': {
      background: 'color-mix(in srgb, var(--chip-color-main) 15%, transparent)',
      color: 'var(--chip-color-main)',
    },

    '&:not([data-variant])[data-clickable]:hover:not([data-disabled])': {
      background: 'color-mix(in srgb, var(--chip-color-main) 25%, transparent)',
    },

    '&[data-variant="filled"]': {
      background: 'color-mix(in srgb, var(--chip-color-main) 15%, transparent)',
      color: 'var(--chip-color-main)',
    },

    '&[data-variant="filled"][data-clickable]:hover:not([data-disabled])': {
      background: 'color-mix(in srgb, var(--chip-color-main) 25%, transparent)',
    },

    // ==========================================
    // OUTLINED VARIANT
    // ==========================================

    '&[data-variant="outlined"]': {
      background: 'transparent',
      color: 'var(--chip-color-main)',
      boxShadow: '0px 0px 0px 1px var(--chip-color-main)',
    },

    '&[data-variant="outlined"][data-clickable]:hover:not([data-disabled])': {
      background: 'color-mix(in srgb, var(--chip-color-main) 10%, transparent)',
    },

    // ==========================================
    // DELETE BUTTON
    // ==========================================

    '& .chip-delete': {
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      cursor: 'pointer',
      borderRadius: cssVariableTheme.shape.borderRadius.full,
      border: 'none',
      background: 'transparent',
      color: 'inherit',
      padding: '0',
      marginLeft: cssVariableTheme.spacing.xs,
      marginRight: `calc(-1 * ${cssVariableTheme.spacing.xs})`,
      width: '18px',
      height: '18px',
      fontSize: cssVariableTheme.typography.fontSize.md,
      lineHeight: '1',
      opacity: '0.7',
      transition: buildTransition(
        ['opacity', cssVariableTheme.transitions.duration.fast, cssVariableTheme.transitions.easing.default],
        ['background', cssVariableTheme.transitions.duration.fast, cssVariableTheme.transitions.easing.default],
      ),
    },

    '& .chip-delete:hover': {
      opacity: '1',
      background: 'color-mix(in srgb, currentColor 15%, transparent)',
    },

    // Label truncation
    '& .chip-label': {
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      whiteSpace: 'nowrap',
    },
  },
  render: ({ props, children, element }) => {
    const { variant, color, size, disabled, clickable, onDelete, style, ...rest } = props

    if (variant) {
      element.setAttribute('data-variant', variant)
    } else {
      element.removeAttribute('data-variant')
    }

    if (size === 'small') {
      element.setAttribute('data-size', 'small')
    } else {
      element.removeAttribute('data-size')
    }

    if (disabled) {
      element.setAttribute('data-disabled', '')
    } else {
      element.removeAttribute('data-disabled')
    }

    if (clickable || rest.onclick) {
      element.setAttribute('data-clickable', '')
    } else {
      element.removeAttribute('data-clickable')
    }

    const colors = color ? paletteFullColors[color] : defaultColors
    element.style.setProperty('--chip-color-main', colors.main)
    element.style.setProperty('--chip-color-main-contrast', colors.mainContrast)
    element.style.setProperty('--chip-color-light', colors.light)
    element.style.setProperty('--chip-color-dark', colors.dark)
    element.style.setProperty('--chip-color-dark-contrast', colors.darkContrast)

    if (style) {
      Object.assign(element.style, style)
    }

    return (
      <>
        <span className="chip-label">{children}</span>
        {onDelete ? (
          <span
            className="chip-delete"
            role="button"
            onclick={(ev: MouseEvent) => {
              ev.stopPropagation()
              onDelete(ev)
            }}
          >
            <Icon icon={close} size={14} />
          </span>
        ) : null}
      </>
    )
  },
})
