import type { PartialElement } from '@furystack/shades'
import { Shade, createComponent } from '@furystack/shades'
import { cssVariableTheme } from '../../services/css-variable-theme.js'
import type { Palette } from '../../services/theme-provider-service.js'
import { ThemeProviderService } from '../../services/theme-provider-service.js'
import { FormService } from '../form.js'

export type CheckboxProps = {
  /**
   * Whether the checkbox is checked
   */
  checked?: boolean
  /**
   * Whether the checkbox is in an indeterminate state
   */
  indeterminate?: boolean
  /**
   * Whether the checkbox is disabled
   */
  disabled?: boolean
  /**
   * The palette color for the checkbox
   */
  color?: keyof Palette
  /**
   * Callback when the checked state changes
   */
  onchange?: (event: Event) => void
  /**
   * Label text or element displayed next to the checkbox
   */
  labelTitle?: JSX.Element | string
  /**
   * The name attribute for the underlying input element
   */
  name?: string
  /**
   * The value attribute for the underlying input element
   */
  value?: string
  /**
   * Whether the checkbox is required
   */
  required?: boolean
  /**
   * Optional props for the label element
   */
  labelProps?: PartialElement<HTMLLabelElement>
}

const setCheckboxColors = ({
  element,
  themeProvider,
  props,
}: {
  element: HTMLElement
  themeProvider: ThemeProviderService
  props: CheckboxProps
}): void => {
  const color = themeProvider.theme.palette[props.color || 'primary'].main
  element.style.setProperty('--checkbox-color', color)
}

export const Checkbox = Shade<CheckboxProps>({
  shadowDomName: 'shade-checkbox',
  css: {
    display: 'inline-flex',
    alignItems: 'center',

    '& label': {
      display: 'inline-flex',
      alignItems: 'center',
      gap: cssVariableTheme.spacing.sm,
      cursor: 'pointer',
      fontSize: cssVariableTheme.typography.fontSize.sm,
      color: cssVariableTheme.text.primary,
      userSelect: 'none',
      webkitUserSelect: 'none',
    },

    '& .checkbox-control': {
      position: 'relative',
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      width: '20px',
      height: '20px',
      flexShrink: '0',
    },

    '& input[type="checkbox"]': {
      appearance: 'none',
      webkitAppearance: 'none',
      width: '20px',
      height: '20px',
      margin: '0',
      border: `2px solid ${cssVariableTheme.text.secondary}`,
      borderRadius: cssVariableTheme.shape.borderRadius.xs,
      backgroundColor: 'transparent',
      cursor: 'pointer',
      transition: `all ${cssVariableTheme.transitions.duration.fast} ${cssVariableTheme.transitions.easing.default}`,
      outline: 'none',
    },

    '& input[type="checkbox"]:hover:not(:disabled)': {
      borderColor: 'var(--checkbox-color)',
    },

    '& input[type="checkbox"]:focus-visible': {
      boxShadow: cssVariableTheme.action.focusRing,
    },

    '& input[type="checkbox"]:checked': {
      backgroundColor: 'var(--checkbox-color)',
      borderColor: 'var(--checkbox-color)',
    },

    '& input[type="checkbox"]:checked::after': {
      content: '""',
      position: 'absolute',
      left: '6px',
      top: '2px',
      width: '5px',
      height: '10px',
      border: `solid ${cssVariableTheme.background.paper}`,
      borderWidth: '0 2px 2px 0',
      transform: 'rotate(45deg)',
      pointerEvents: 'none',
    },

    '&[data-indeterminate] input[type="checkbox"]': {
      backgroundColor: 'var(--checkbox-color)',
      borderColor: 'var(--checkbox-color)',
    },

    '&[data-indeterminate] input[type="checkbox"]::after': {
      content: '""',
      position: 'absolute',
      left: '4px',
      top: '8px',
      width: '10px',
      height: '2px',
      backgroundColor: cssVariableTheme.background.paper,
      border: 'none',
      transform: 'none',
      pointerEvents: 'none',
    },

    '&[data-disabled] label': {
      color: cssVariableTheme.text.disabled,
      cursor: 'not-allowed',
    },

    '&[data-disabled] input[type="checkbox"]': {
      opacity: cssVariableTheme.action.disabledOpacity,
      cursor: 'not-allowed',
    },
  },
  constructed: ({ injector, element }) => {
    if (injector.cachedSingletons.has(FormService)) {
      const input = element.querySelector('input[type="checkbox"]') as HTMLInputElement
      const formService = injector.getInstance(FormService)
      formService.inputs.add(input)
      return () => formService.inputs.delete(input)
    }
  },
  render: ({ props, injector, element }) => {
    const themeProvider = injector.getInstance(ThemeProviderService)

    if (props.disabled) {
      element.setAttribute('data-disabled', '')
    } else {
      element.removeAttribute('data-disabled')
    }

    if (props.indeterminate) {
      element.setAttribute('data-indeterminate', '')
    } else {
      element.removeAttribute('data-indeterminate')
    }

    setCheckboxColors({ element, themeProvider, props })

    const handleChange = function (this: GlobalEventHandlers, ev: Event) {
      if (props.indeterminate) {
        const input = element.querySelector('input[type="checkbox"]') as HTMLInputElement
        input.indeterminate = true
      }
      props.onchange?.call(this, ev)
    }

    return (
      <label {...props.labelProps}>
        <span className="checkbox-control">
          <input
            type="checkbox"
            checked={props.checked}
            disabled={props.disabled}
            name={props.name}
            value={props.value}
            required={props.required}
            onchange={handleChange}
          />
        </span>
        {props.labelTitle ? <span className="checkbox-label">{props.labelTitle}</span> : null}
      </label>
    )
  },
})
