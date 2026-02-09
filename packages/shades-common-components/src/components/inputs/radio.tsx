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
  render: ({ props, injector, useDisposable, useHostProps, useRef }) => {
    const inputRef = useRef<HTMLInputElement>('formInput')

    useDisposable('form-registration', () => {
      const formService = injector.cachedSingletons.has(FormService) ? injector.getInstance(FormService) : null

      queueMicrotask(() => {
        if (inputRef.current && formService) {
          formService.inputs.add(inputRef.current)
        }

        // Read group-level overrides from parent RadioGroup
        const group = inputRef.current?.closest('shade-radio-group')
        if (group && inputRef.current) {
          const groupName = group.getAttribute('data-group-name')
          if (groupName) inputRef.current.name = groupName

          const groupDisabled = group.hasAttribute('data-disabled')
          if (groupDisabled) inputRef.current.disabled = true

          const groupValue = group.getAttribute('data-group-value')
          if (groupValue !== null) {
            inputRef.current.checked = props.value === groupValue
          } else {
            const groupDefaultValue = group.getAttribute('data-group-default-value')
            if (groupDefaultValue !== null && props.checked === undefined) {
              inputRef.current.checked = props.value === groupDefaultValue
            }
          }
        }
      })

      return {
        [Symbol.dispose]: () => {
          if (inputRef.current && formService) formService.inputs.delete(inputRef.current)
        },
      }
    })

    const themeProvider = injector.getInstance(ThemeProviderService)

    // Read group-level overrides from parent RadioGroup (inputRef is set after first mount)
    const group = inputRef.current ? inputRef.current.closest('shade-radio-group') : null
    const groupName = group?.getAttribute('data-group-name')
    const groupDisabled = group?.hasAttribute('data-disabled') ?? false
    const groupValue = group?.getAttribute('data-group-value')
    const groupDefaultValue = group?.getAttribute('data-group-default-value')

    const effectiveName = groupName ?? props.name
    const isDisabled = props.disabled || groupDisabled

    let isChecked = props.checked
    if (groupValue !== undefined && groupValue !== null) {
      isChecked = props.value === groupValue
    } else if (groupDefaultValue !== undefined && groupDefaultValue !== null && isChecked === undefined) {
      isChecked = props.value === groupDefaultValue
    }

    const color = themeProvider.theme.palette[props.color || 'primary'].main
    useHostProps({
      'data-disabled': isDisabled ? '' : undefined,
      style: { '--radio-color': color },
    })

    return (
      <label {...props.labelProps}>
        <span className="radio-control">
          <input
            ref={inputRef}
            type="radio"
            value={props.value}
            checked={isChecked}
            disabled={isDisabled}
            name={effectiveName}
            onchange={props.onchange}
          />
        </span>
        {props.labelTitle ? <span className="radio-label">{props.labelTitle}</span> : null}
      </label>
    )
  },
})
