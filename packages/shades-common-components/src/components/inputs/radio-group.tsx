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
  render: ({ props, children, element }) => {
    const orientation = props.orientation || 'vertical'
    element.setAttribute('data-orientation', orientation)
    element.setAttribute('role', 'radiogroup')

    const handleChange = (ev: Event) => {
      const target = ev.target as HTMLInputElement
      if (target.type === 'radio' && target.checked) {
        props.onValueChange?.(target.value)
      }
    }

    element.addEventListener('change', handleChange)

    const applyPropsToRadios = () => {
      const radios = element.querySelectorAll('shade-radio')
      radios.forEach((radio) => {
        const input = radio.querySelector<HTMLInputElement>('input[type="radio"]')
        if (input) {
          input.name = props.name
          if (props.value !== undefined) {
            input.checked = input.value === props.value
          } else if (props.defaultValue !== undefined && !input.hasAttribute('data-default-applied')) {
            input.checked = input.value === props.defaultValue
            input.setAttribute('data-default-applied', '')
          }
          if (props.disabled) {
            input.disabled = true
          }
        }
      })
    }

    requestAnimationFrame(applyPropsToRadios)

    return (
      <>
        {props.labelTitle ? <span className="radio-group-label">{props.labelTitle}</span> : null}
        <div className="radio-group-items">{children}</div>
      </>
    )
  },
})
