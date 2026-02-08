import type { ChildrenList, PartialElement } from '@furystack/shades'
import { Shade, createComponent } from '@furystack/shades'
import { buildTransition, cssVariableTheme } from '../services/css-variable-theme.js'
import { paletteFullColors } from '../services/palette-css-vars.js'
import type { Palette } from '../services/theme-provider-service.js'

// ==========================================
// ButtonGroup
// ==========================================

export type ButtonGroupProps = PartialElement<HTMLElement> & {
  /** Visual variant applied to all buttons in the group */
  variant?: 'contained' | 'outlined'
  /** Theme color applied to all buttons */
  color?: keyof Palette
  /** Layout direction */
  orientation?: 'horizontal' | 'vertical'
  /** Whether all buttons in the group are disabled */
  disabled?: boolean
}

export const ButtonGroup: (props: ButtonGroupProps, children: ChildrenList) => JSX.Element = Shade<ButtonGroupProps>({
  shadowDomName: 'shade-button-group',
  css: {
    display: 'inline-flex',
    borderRadius: cssVariableTheme.shape.borderRadius.md,

    '&[data-orientation="vertical"]': {
      flexDirection: 'column',
    },
  },
  render: ({ props, children, element }) => {
    const { orientation = 'horizontal', disabled, variant, color, style } = props
    const radius = cssVariableTheme.shape.borderRadius.md

    element.setAttribute('role', 'group')
    element.setAttribute('data-orientation', orientation)

    if (variant) {
      element.setAttribute('data-variant', variant)
    } else {
      element.removeAttribute('data-variant')
    }

    if (disabled) {
      element.setAttribute('data-disabled', '')
    } else {
      element.removeAttribute('data-disabled')
    }

    if (color) {
      element.setAttribute('data-color', color)
    } else {
      element.removeAttribute('data-color')
    }

    if (style) {
      Object.assign(element.style, style)
    }

    // Apply inline styles to child elements so they appear joined.
    // Inline styles are needed because child Button components have their
    // own scoped CSS for margin and borderRadius that can't be overridden
    // from the parent's shadow DOM stylesheet alone.
    requestAnimationFrame(() => {
      const childElements = Array.from(element.children) as HTMLElement[]
      const isVertical = orientation === 'vertical'

      childElements.forEach((child, index) => {
        child.style.margin = '0'

        if (childElements.length === 1) {
          child.style.borderRadius = radius
          return
        }

        const isFirst = index === 0
        const isLast = index === childElements.length - 1

        if (isFirst) {
          child.style.borderRadius = isVertical ? `${radius} ${radius} 0 0` : `${radius} 0 0 ${radius}`
        } else if (isLast) {
          child.style.borderRadius = isVertical ? `0 0 ${radius} ${radius}` : `0 ${radius} ${radius} 0`
        } else {
          child.style.borderRadius = '0'
        }
      })
    })

    return <>{children}</>
  },
})

// ==========================================
// ToggleButtonGroup
// ==========================================

export type ToggleButtonProps = PartialElement<HTMLButtonElement> & {
  /** The value this button represents */
  value: string
  /** Whether the button is disabled */
  disabled?: boolean
}

export const ToggleButton = Shade<ToggleButtonProps>({
  shadowDomName: 'shade-toggle-button',
  elementBase: HTMLButtonElement,
  elementBaseName: 'button',
  css: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: `${cssVariableTheme.spacing.sm} ${cssVariableTheme.spacing.lg}`,
    border: 'none',
    borderRadius: '0',
    margin: '0',
    fontSize: cssVariableTheme.typography.fontSize.md,
    fontWeight: cssVariableTheme.typography.fontWeight.medium,
    letterSpacing: cssVariableTheme.typography.letterSpacing.wider,
    lineHeight: '1.75',
    cursor: 'pointer',
    userSelect: 'none',
    background: 'transparent',
    color: 'var(--toggle-color-main)',
    boxShadow: '0px 0px 0px 1px var(--toggle-color-main)',
    transition: buildTransition(
      ['background', cssVariableTheme.transitions.duration.normal, cssVariableTheme.transitions.easing.default],
      ['color', cssVariableTheme.transitions.duration.normal, cssVariableTheme.transitions.easing.default],
      ['box-shadow', cssVariableTheme.transitions.duration.normal, cssVariableTheme.transitions.easing.default],
    ),

    '&:hover:not(:disabled):not([data-selected])': {
      background: 'color-mix(in srgb, var(--toggle-color-main) 10%, transparent)',
    },

    '&[data-selected]': {
      background: 'color-mix(in srgb, var(--toggle-color-main) 20%, transparent)',
      color: 'var(--toggle-color-main)',
      fontWeight: cssVariableTheme.typography.fontWeight.semibold,
    },

    '&[data-selected]:hover:not(:disabled)': {
      background: 'color-mix(in srgb, var(--toggle-color-main) 30%, transparent)',
    },

    '&:disabled': {
      cursor: 'not-allowed',
      opacity: cssVariableTheme.action.disabledOpacity,
    },

    '&:active:not(:disabled)': {
      transform: 'scale(0.96)',
    },
  },
  render: ({ props, children, element }) => {
    if (props.value) {
      element.setAttribute('data-value', props.value)
    }
    element.setAttribute('type', 'button')

    return <>{children}</>
  },
})

const defaultToggleColors = {
  main: cssVariableTheme.text.secondary,
  mainContrast: cssVariableTheme.background.default,
  light: cssVariableTheme.text.primary,
  dark: cssVariableTheme.text.disabled,
}

export type ToggleButtonGroupProps = PartialElement<HTMLElement> & {
  /** Currently selected value(s). Use a string for exclusive mode, or string[] for multi-select. */
  value?: string | string[]
  /** When true, only one button can be selected at a time */
  exclusive?: boolean
  /** Callback when the selected value(s) change */
  onValueChange?: (value: string | string[]) => void
  /** Theme color */
  color?: keyof Palette
  /** Layout direction */
  orientation?: 'horizontal' | 'vertical'
  /** Whether all toggle buttons are disabled */
  disabled?: boolean
}

export const ToggleButtonGroup: (props: ToggleButtonGroupProps, children: ChildrenList) => JSX.Element =
  Shade<ToggleButtonGroupProps>({
    shadowDomName: 'shade-toggle-button-group',
    css: {
      display: 'inline-flex',
      borderRadius: cssVariableTheme.shape.borderRadius.md,

      '&[data-orientation="vertical"]': {
        flexDirection: 'column',
      },
    },
    render: ({ props, children, element, useDisposable }) => {
      useDisposable('click-handler', () => {
        const handleClick = (ev: Event) => {
          const target = (ev.target as HTMLElement).closest('button[data-value]')
          if (!target || target.hasAttribute('disabled')) return

          const clickedValue = target.getAttribute('data-value')
          if (!clickedValue) return

          if (props.exclusive) {
            const currentValue = Array.isArray(props.value) ? props.value[0] : props.value
            const newValue = currentValue === clickedValue ? '' : clickedValue
            props.onValueChange?.(newValue)
          } else {
            const currentValues = Array.isArray(props.value)
              ? props.value
              : props.value
                ? [props.value]
                : ([] as string[])
            const newValues = currentValues.includes(clickedValue)
              ? currentValues.filter((v) => v !== clickedValue)
              : [...currentValues, clickedValue]
            props.onValueChange?.(newValues)
          }
        }

        element.addEventListener('click', handleClick)
        return { [Symbol.dispose]: () => element.removeEventListener('click', handleClick) }
      })

      const { orientation = 'horizontal', disabled, color, style } = props
      const selectedValues = Array.isArray(props.value) ? props.value : props.value ? [props.value] : ([] as string[])

      element.setAttribute('role', 'group')
      element.setAttribute('data-orientation', orientation)

      const colors = color ? paletteFullColors[color] : defaultToggleColors
      element.style.setProperty('--toggle-color-main', colors.main)

      if (style) {
        Object.assign(element.style, style)
      }

      const radius = cssVariableTheme.shape.borderRadius.md

      // Update child toggle button states and apply grouping styles
      requestAnimationFrame(() => {
        const buttons = Array.from(element.querySelectorAll('button[data-value]'))
        const isVertical = orientation === 'vertical'

        buttons.forEach((btn, index) => {
          const val = btn.getAttribute('data-value')
          if (val && selectedValues.includes(val)) {
            btn.setAttribute('data-selected', '')
          } else {
            btn.removeAttribute('data-selected')
          }

          if (disabled) {
            btn.setAttribute('disabled', '')
          }

          // Propagate color CSS variable
          ;(btn as HTMLElement).style.setProperty('--toggle-color-main', colors.main)

          // Apply grouping border-radius via inline styles
          const el = btn as HTMLElement
          if (buttons.length === 1) {
            el.style.borderRadius = radius
          } else if (index === 0) {
            el.style.borderRadius = isVertical ? `${radius} ${radius} 0 0` : `${radius} 0 0 ${radius}`
          } else if (index === buttons.length - 1) {
            el.style.borderRadius = isVertical ? `0 0 ${radius} ${radius}` : `0 ${radius} ${radius} 0`
          } else {
            el.style.borderRadius = '0'
          }
        })
      })

      return <>{children}</>
    },
  })

// ==========================================
// SegmentedControl
// ==========================================

export type SegmentedControlOption = {
  /** Unique value for this option */
  value: string
  /** Display label */
  label: string | JSX.Element
  /** Whether this option is disabled */
  disabled?: boolean
}

export type SegmentedControlProps = PartialElement<HTMLElement> & {
  /** Available options */
  options: SegmentedControlOption[]
  /** Currently selected value */
  value?: string
  /** Callback when the selected option changes */
  onValueChange?: (value: string) => void
  /** Theme color */
  color?: keyof Palette
  /** Whether the entire control is disabled */
  disabled?: boolean
  /** Size variant */
  size?: 'small' | 'medium'
}

const defaultSegmentedColors = {
  main: cssVariableTheme.palette.primary.main,
  mainContrast: cssVariableTheme.palette.primary.mainContrast,
}

export const SegmentedControl = Shade<SegmentedControlProps>({
  shadowDomName: 'shade-segmented-control',
  css: {
    display: 'inline-flex',
    borderRadius: cssVariableTheme.shape.borderRadius.md,
    background: cssVariableTheme.action.hoverBackground,
    padding: '3px',
    gap: '2px',

    '& .segmented-option': {
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: `${cssVariableTheme.spacing.sm} ${cssVariableTheme.spacing.lg}`,
      borderRadius: cssVariableTheme.shape.borderRadius.sm,
      border: 'none',
      background: 'transparent',
      color: cssVariableTheme.text.secondary,
      fontSize: cssVariableTheme.typography.fontSize.md,
      fontWeight: cssVariableTheme.typography.fontWeight.medium,
      fontFamily: 'inherit',
      letterSpacing: '0.3px',
      cursor: 'pointer',
      userSelect: 'none',
      whiteSpace: 'nowrap',
      transition: buildTransition(
        ['background', cssVariableTheme.transitions.duration.fast, cssVariableTheme.transitions.easing.default],
        ['color', cssVariableTheme.transitions.duration.fast, cssVariableTheme.transitions.easing.default],
        ['box-shadow', cssVariableTheme.transitions.duration.fast, cssVariableTheme.transitions.easing.default],
      ),
    },

    '& .segmented-option:hover:not(:disabled):not([data-selected])': {
      color: cssVariableTheme.text.primary,
      background: 'color-mix(in srgb, var(--seg-color-main) 8%, transparent)',
    },

    '& .segmented-option[data-selected]': {
      background: cssVariableTheme.background.paper,
      color: 'var(--seg-color-main)',
      fontWeight: cssVariableTheme.typography.fontWeight.semibold,
      boxShadow: cssVariableTheme.shadows.sm,
    },

    '& .segmented-option:disabled': {
      cursor: 'not-allowed',
      opacity: '0.5',
    },

    '&[data-size="small"] .segmented-option': {
      padding: `${cssVariableTheme.spacing.xs} ${cssVariableTheme.spacing.md}`,
      fontSize: cssVariableTheme.typography.fontSize.sm,
    },
  },
  render: ({ props, element }) => {
    const { options, value, onValueChange, color, disabled, size, style } = props

    element.setAttribute('role', 'radiogroup')

    if (size === 'small') {
      element.setAttribute('data-size', 'small')
    } else {
      element.removeAttribute('data-size')
    }

    const colors = color
      ? { main: paletteFullColors[color].main, mainContrast: paletteFullColors[color].mainContrast }
      : defaultSegmentedColors

    element.style.setProperty('--seg-color-main', colors.main)
    element.style.setProperty('--seg-color-main-contrast', colors.mainContrast)

    if (style) {
      Object.assign(element.style, style)
    }

    const buttons = options.map((option) => {
      const isSelected = value === option.value
      const isDisabled = disabled || option.disabled

      const btn = (
        <button
          type="button"
          className="segmented-option"
          disabled={isDisabled}
          onclick={() => {
            if (!isDisabled && value !== option.value) {
              onValueChange?.(option.value)
            }
          }}
        >
          {option.label}
        </button>
      ) as unknown as HTMLButtonElement

      btn.setAttribute('role', 'radio')
      btn.setAttribute('aria-checked', isSelected ? 'true' : 'false')
      btn.setAttribute('data-value', option.value)
      if (isSelected) {
        btn.setAttribute('data-selected', '')
      }

      return btn
    })

    return <>{buttons}</>
  },
})
