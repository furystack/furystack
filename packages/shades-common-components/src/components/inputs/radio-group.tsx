import type { ChildrenList } from '@furystack/shades'
import { Shade, createComponent } from '@furystack/shades'
import { cssVariableTheme } from '../../services/css-variable-theme.js'
import type { Palette } from '../../services/theme-provider-service.js'

export type RadioGroupProps = {
  /**
   * The name attribute shared by all radio buttons in the group
   */
  name: string
  /**
   * The currently selected value
   */
  value?: string
  /**
   * The default selected value (used for uncontrolled mode)
   */
  defaultValue?: string
  /**
   * Whether all radio buttons in the group are disabled
   */
  disabled?: boolean
  /**
   * Callback when the selected value changes
   */
  onValueChange?: (value: string) => void
  /**
   * The palette color applied to all radio buttons in the group
   */
  color?: keyof Palette
  /**
   * Label text or element displayed above the group
   */
  labelTitle?: JSX.Element | string
  /**
   * Layout direction of the radio buttons
   */
  orientation?: 'horizontal' | 'vertical'
}

export const RadioGroup: (props: RadioGroupProps, children: ChildrenList) => JSX.Element = Shade<RadioGroupProps>({
  shadowDomName: 'shade-radio-group',
  css: {
    display: 'block',

    '& .radio-group-label': {
      display: 'block',
      fontSize: cssVariableTheme.typography.fontSize.xs,
      fontWeight: cssVariableTheme.typography.fontWeight.medium,
      color: cssVariableTheme.text.secondary,
      marginBottom: cssVariableTheme.spacing.sm,
    },

    '& .radio-group-items': {
      display: 'flex',
      gap: cssVariableTheme.spacing.sm,
    },

    '&[data-orientation="vertical"] .radio-group-items': {
      flexDirection: 'column',
    },

    '&[data-orientation="horizontal"] .radio-group-items': {
      flexDirection: 'row',
      flexWrap: 'wrap',
    },
  },
  render: ({ props, children, useDisposable, useHostProps, useRef }) => {
    const wrapperRef = useRef<HTMLDivElement>('wrapper')

    useDisposable('change-handler', () => {
      const handleChange = (ev: Event) => {
        const target = ev.target as HTMLInputElement
        if (target.type === 'radio' && target.checked) {
          props.onValueChange?.(target.value)
        }
      }

      const el = wrapperRef.current
      el?.addEventListener('change', handleChange)

      return { [Symbol.dispose]: () => el?.removeEventListener('change', handleChange) }
    })

    const orientation = props.orientation || 'vertical'

    // Expose group-level props as data attributes so child Radio components
    // can read them synchronously during their own render cycle.
    useHostProps({
      'data-orientation': orientation,
      role: 'radiogroup',
      'data-group-name': props.name,
      'data-disabled': props.disabled ? '' : undefined,
      'data-group-value': props.value !== undefined ? props.value : undefined,
      'data-group-default-value': props.defaultValue !== undefined ? props.defaultValue : undefined,
    })

    return (
      <div ref={wrapperRef} style={{ display: 'contents' }}>
        {props.labelTitle ? <span className="radio-group-label">{props.labelTitle}</span> : null}
        <div className="radio-group-items">{children}</div>
      </div>
    )
  },
})
