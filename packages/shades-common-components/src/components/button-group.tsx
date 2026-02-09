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
  render: ({ props, children, useHostProps, useRef }) => {
    const { orientation = 'horizontal', disabled, variant, color, style } = props
    const radius = cssVariableTheme.shape.borderRadius.md
    const wrapperRef = useRef<HTMLDivElement>('wrapper')

    useHostProps({
      role: 'group',
      'data-orientation': orientation,
      'data-variant': variant || undefined,
      'data-disabled': disabled ? '' : undefined,
      'data-color': color || undefined,
      ...(style ? { style: style as Record<string, string> } : {}),
    })

    // Apply inline styles to child elements so they appear joined.
    // Inline styles are needed because child Button components have their
    // own scoped CSS for margin and borderRadius that can't be overridden
    // from the parent's shadow DOM stylesheet alone.
    requestAnimationFrame(() => {
      const childElements = Array.from(wrapperRef.current?.children ?? []) as HTMLElement[]
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

    return (
      <div ref={wrapperRef} style={{ display: 'contents' }}>
        {children}
      </div>
    )
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
  render: ({ props, children, useHostProps }) => {
    useHostProps({
      'data-value': props.value || undefined,
      type: 'button',
    })

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
    render: ({ props, children, useDisposable, useHostProps, useRef }) => {
      const groupRef = useRef<HTMLDivElement>('group')

      // Mutable container so the click handler always reads the latest props
      const state = useDisposable('state', () => ({
        props,
        [Symbol.dispose]: () => {},
      }))
      state.props = props

      useDisposable('click-handler', () => {
        const handleClick = (ev: Event) => {
          const target = (ev.target as HTMLElement).closest('button[data-value]')
          if (!target || target.hasAttribute('disabled')) return

          const clickedValue = target.getAttribute('data-value')
          if (!clickedValue) return

          const currentProps = state.props
          if (currentProps.exclusive) {
            const currentValue = Array.isArray(currentProps.value) ? currentProps.value[0] : currentProps.value
            const newValue = currentValue === clickedValue ? '' : clickedValue
            currentProps.onValueChange?.(newValue)
          } else {
            const currentValues = Array.isArray(currentProps.value)
              ? currentProps.value
              : currentProps.value
                ? [currentProps.value]
                : ([] as string[])
            const newValues = currentValues.includes(clickedValue)
              ? currentValues.filter((v) => v !== clickedValue)
              : [...currentValues, clickedValue]
            currentProps.onValueChange?.(newValues)
          }
        }

        let el: HTMLElement | null = null
        queueMicrotask(() => {
          el = groupRef.current
          el?.addEventListener('click', handleClick)
        })
        return { [Symbol.dispose]: () => el?.removeEventListener('click', handleClick) }
      })

      const { orientation = 'horizontal', disabled, color, style } = props
      const selectedValues = Array.isArray(props.value) ? props.value : props.value ? [props.value] : ([] as string[])

      const colors = color ? paletteFullColors[color] : defaultToggleColors
      useHostProps({
        role: 'group',
        'data-orientation': orientation,
        style: {
          '--toggle-color-main': colors.main,
          ...(style as Record<string, string>),
        },
      })

      const radius = cssVariableTheme.shape.borderRadius.md

      // Update child toggle button states and apply grouping styles
      requestAnimationFrame(() => {
        const buttons = Array.from(groupRef.current?.querySelectorAll('button[data-value]') ?? [])
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

      return (
        <div ref={groupRef} style={{ display: 'contents' }}>
          {children}
        </div>
      )
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
  render: ({ props, useHostProps }) => {
    const { options, value, onValueChange, color, disabled, size, style } = props

    const colors = color
      ? { main: paletteFullColors[color].main, mainContrast: paletteFullColors[color].mainContrast }
      : defaultSegmentedColors

    useHostProps({
      role: 'radiogroup',
      'data-size': size === 'small' ? 'small' : undefined,
      style: {
        '--seg-color-main': colors.main,
        '--seg-color-main-contrast': colors.mainContrast,
        ...(style as Record<string, string>),
      },
    })

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
