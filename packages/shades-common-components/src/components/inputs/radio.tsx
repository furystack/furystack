import type { PartialElement } from '@furystack/shades'
import { Shade, createComponent } from '@furystack/shades'
import { cssVariableTheme } from '../../services/css-variable-theme.js'
import type { Palette } from '../../services/theme-provider-service.js'
import { ThemeProviderService } from '../../services/theme-provider-service.js'
import { FormService } from '../form.js'

export type RadioProps = {
  /**
   * The value attribute for the underlying input element
   */
  value: string
  /**
   * Whether the radio button is disabled
   */
  disabled?: boolean
  /**
   * The palette color for the radio button
   */
  color?: keyof Palette
  /**
   * Callback when the radio button is selected
   */
  onchange?: (event: Event) => void
  /**
   * Label text or element displayed next to the radio button
   */
  labelTitle?: JSX.Element | string
  /**
   * The name attribute for the underlying input element (set automatically by RadioGroup)
   */
  name?: string
  /**
   * Whether the radio button is checked
   */
  checked?: boolean
  /**
   * Optional props for the label element
   */
  labelProps?: PartialElement<HTMLLabelElement>
}

const setRadioColors = ({
  element,
  themeProvider,
  props,
}: {
  element: HTMLElement
  themeProvider: ThemeProviderService
  props: RadioProps
}): void => {
  const color = themeProvider.theme.palette[props.color || 'primary'].main
  element.style.setProperty('--radio-color', color)
}

export const Radio = Shade<RadioProps>({
  shadowDomName: 'shade-radio',
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

    '& .radio-control': {
      position: 'relative',
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      width: '20px',
      height: '20px',
      flexShrink: '0',
    },

    '& input[type="radio"]': {
      appearance: 'none',
      webkitAppearance: 'none',
      width: '20px',
      height: '20px',
      margin: '0',
      border: `2px solid ${cssVariableTheme.text.secondary}`,
      borderRadius: cssVariableTheme.shape.borderRadius.full,
      backgroundColor: 'transparent',
      cursor: 'pointer',
      transition: `all ${cssVariableTheme.transitions.duration.fast} ${cssVariableTheme.transitions.easing.default}`,
      outline: 'none',
    },

    '& input[type="radio"]:hover:not(:disabled)': {
      borderColor: 'var(--radio-color)',
    },

    '& input[type="radio"]:focus-visible': {
      boxShadow: cssVariableTheme.action.focusRing,
    },

    '& input[type="radio"]:checked': {
      borderColor: 'var(--radio-color)',
    },

    '& input[type="radio"]:checked::after': {
      content: '""',
      position: 'absolute',
      left: '5px',
      top: '5px',
      width: '10px',
      height: '10px',
      borderRadius: cssVariableTheme.shape.borderRadius.full,
      backgroundColor: 'var(--radio-color)',
      pointerEvents: 'none',
    },

    '&[data-disabled] label': {
      color: cssVariableTheme.text.disabled,
      cursor: 'not-allowed',
    },

    '&[data-disabled] input[type="radio"]': {
      opacity: cssVariableTheme.action.disabledOpacity,
      cursor: 'not-allowed',
    },
  },
  constructed: ({ injector, element }) => {
    if (injector.cachedSingletons.has(FormService)) {
      const input = element.querySelector('input[type="radio"]') as HTMLInputElement
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

    setRadioColors({ element, themeProvider, props })

    return (
      <label {...props.labelProps}>
        <span className="radio-control">
          <input
            type="radio"
            value={props.value}
            checked={props.checked}
            disabled={props.disabled}
            name={props.name}
            onchange={props.onchange}
          />
        </span>
        {props.labelTitle ? <span className="radio-label">{props.labelTitle}</span> : null}
      </label>
    )
  },
})
