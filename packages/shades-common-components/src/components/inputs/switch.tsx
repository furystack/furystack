import type { PartialElement } from '@furystack/shades'
import { Shade, createComponent } from '@furystack/shades'
import { buildTransition, cssVariableTheme } from '../../services/css-variable-theme.js'
import type { Palette } from '../../services/theme-provider-service.js'
import { ThemeProviderService } from '../../services/theme-provider-service.js'
import { FormService } from '../form.js'

export type SwitchProps = {
  /**
   * Whether the switch is checked (on)
   */
  checked?: boolean
  /**
   * Whether the switch is disabled
   */
  disabled?: boolean
  /**
   * The palette color for the switch
   */
  color?: keyof Palette
  /**
   * Callback when the checked state changes
   */
  onchange?: (event: Event) => void
  /**
   * Label text or element displayed next to the switch
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
   * Whether the switch is required
   */
  required?: boolean
  /**
   * The size of the switch
   */
  size?: 'small' | 'medium'
  /**
   * Optional props for the label element
   */
  labelProps?: PartialElement<HTMLLabelElement>
}

const setSwitchColors = ({
  element,
  themeProvider,
  props,
}: {
  element: HTMLElement
  themeProvider: ThemeProviderService
  props: SwitchProps
}): void => {
  const color = themeProvider.theme.palette[props.color || 'primary'].main
  element.style.setProperty('--switch-color', color)
}

export const Switch = Shade<SwitchProps>({
  shadowDomName: 'shade-switch',
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

    '& .switch-control': {
      position: 'relative',
      display: 'inline-flex',
      alignItems: 'center',
      flexShrink: '0',
    },

    // Medium size (default)
    '& .switch-track': {
      width: '40px',
      height: '22px',
      borderRadius: '11px',
      backgroundColor: cssVariableTheme.text.secondary,
      transition: buildTransition([
        'background-color',
        cssVariableTheme.transitions.duration.fast,
        cssVariableTheme.transitions.easing.default,
      ]),
      position: 'relative',
      opacity: '0.5',
    },

    '& .switch-thumb': {
      position: 'absolute',
      top: '2px',
      left: '2px',
      width: '18px',
      height: '18px',
      borderRadius: '50%',
      backgroundColor: cssVariableTheme.background.paper,
      transition: buildTransition(
        ['transform', cssVariableTheme.transitions.duration.fast, cssVariableTheme.transitions.easing.default],
        ['box-shadow', cssVariableTheme.transitions.duration.fast, cssVariableTheme.transitions.easing.default],
      ),
      boxShadow: cssVariableTheme.shadows.sm,
      pointerEvents: 'none',
    },

    // Small size
    '&[data-size="small"] .switch-track': {
      width: '32px',
      height: '18px',
      borderRadius: '9px',
    },

    '&[data-size="small"] .switch-thumb': {
      width: '14px',
      height: '14px',
    },

    // Hidden input
    '& input[type="checkbox"]': {
      position: 'absolute',
      width: '1px',
      height: '1px',
      margin: '-1px',
      padding: '0',
      overflow: 'hidden',
      clip: 'rect(0, 0, 0, 0)',
      whiteSpace: 'nowrap',
      border: '0',
    },

    // Checked state
    '& input[type="checkbox"]:checked + .switch-track': {
      backgroundColor: 'var(--switch-color)',
      opacity: '1',
    },

    '& input[type="checkbox"]:checked + .switch-track .switch-thumb': {
      transform: 'translateX(18px)',
    },

    '&[data-size="small"] input[type="checkbox"]:checked + .switch-track .switch-thumb': {
      transform: 'translateX(14px)',
    },

    // Hover state
    '& .switch-control:hover .switch-track': {
      opacity: '0.7',
    },

    '& .switch-control:hover input[type="checkbox"]:checked + .switch-track': {
      opacity: '0.85',
    },

    // Focus state
    '& input[type="checkbox"]:focus-visible + .switch-track': {
      boxShadow: cssVariableTheme.action.focusRing,
    },

    // Disabled state
    '&[data-disabled] label': {
      color: cssVariableTheme.text.disabled,
      cursor: 'not-allowed',
    },

    '&[data-disabled] .switch-control': {
      opacity: cssVariableTheme.action.disabledOpacity,
      pointerEvents: 'none',
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

    if (props.size === 'small') {
      element.setAttribute('data-size', 'small')
    } else {
      element.removeAttribute('data-size')
    }

    setSwitchColors({ element, themeProvider, props })

    return (
      <label {...props.labelProps}>
        <span className="switch-control">
          <input
            type="checkbox"
            role="switch"
            checked={props.checked}
            disabled={props.disabled}
            name={props.name}
            value={props.value}
            required={props.required}
            onchange={props.onchange}
          />
          <span className="switch-track">
            <span className="switch-thumb" />
          </span>
        </span>
        {props.labelTitle ? <span className="switch-label">{props.labelTitle}</span> : null}
      </label>
    )
  },
})
