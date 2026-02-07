import type { PartialElement } from '@furystack/shades'
import { Shade, createComponent } from '@furystack/shades'
import { ObservableValue } from '@furystack/utils'
import { cssVariableTheme } from '../../services/css-variable-theme.js'
import type { Palette } from '../../services/theme-provider-service.js'
import { ThemeProviderService } from '../../services/theme-provider-service.js'
import { FormService } from '../form.js'
import type { InputValidationResult } from './input.js'

export type SelectOption = {
  value: string
  label: string
  disabled?: boolean
}

export type SelectState = {
  value: string
  isOpen: boolean
  highlightedIndex: number
}

export type SelectProps = {
  /** The list of options available in the select */
  options: SelectOption[]
  /** The currently selected value */
  value?: string
  /** Placeholder text shown when no option is selected */
  placeholder?: string
  /** Whether the select is disabled */
  disabled?: boolean
  /** Whether a value is required */
  required?: boolean
  /** An optional label title */
  labelTitle?: JSX.Element | string
  /** Optional props for the label element */
  labelProps?: PartialElement<HTMLLabelElement>
  /** The visual variant of the select */
  variant?: 'contained' | 'outlined'
  /** The default color of the select */
  defaultColor?: keyof Palette
  /** The name attribute for form integration */
  name?: string
  /** Callback when the selected value changes */
  onValueChange?: (value: string) => void
  /** Callback for retrieving the custom validation result */
  getValidationResult?: (options: { state: SelectState }) => InputValidationResult
  /** Optional callback for the helper text */
  getHelperText?: (options: { state: SelectState; validationResult?: InputValidationResult }) => JSX.Element | string
}

const setSelectColors = ({
  element,
  themeProvider,
  props,
}: {
  element: HTMLElement
  themeProvider: ThemeProviderService
  props: SelectProps
}): void => {
  const primaryColor = themeProvider.theme.palette[props.defaultColor || 'primary'].main
  element.style.setProperty('--select-primary-color', primaryColor)
  element.style.setProperty('--select-error-color', themeProvider.theme.palette.error.main)
}

export const Select = Shade<SelectProps>({
  shadowDomName: 'shade-select',
  css: {
    display: 'block',
    position: 'relative',
    marginBottom: '1.25em',

    '& label': {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
      fontSize: cssVariableTheme.typography.fontSize.xs,
      fontWeight: cssVariableTheme.typography.fontWeight.medium,
      letterSpacing: '0.01em',
      padding: '12px 14px',
      borderRadius: cssVariableTheme.shape.borderRadius.md,
      transition: `all ${cssVariableTheme.transitions.duration.normal} ${cssVariableTheme.transitions.easing.default}`,
      cursor: 'pointer',
      color: cssVariableTheme.text.secondary,
      background: 'transparent',
      border: '2px solid transparent',
      boxShadow: 'none',
    },

    '&[data-variant="outlined"] label': {
      borderColor: cssVariableTheme.action.subtleBorder,
    },

    '&[data-variant="contained"] label': {
      borderColor: cssVariableTheme.action.subtleBorder,
      background: 'color-mix(in srgb, var(--select-primary-color) 8%, transparent)',
    },

    '&[data-focused] label': {
      color: 'var(--select-primary-color)',
    },

    '&[data-variant="outlined"][data-focused] label, &[data-variant="contained"][data-focused] label': {
      borderColor: 'var(--select-primary-color)',
      boxShadow: cssVariableTheme.action.focusRing,
    },
    '&[data-variant="contained"][data-focused] label': {
      background: 'color-mix(in srgb, var(--select-primary-color) 12%, transparent)',
    },

    '&[data-invalid] label': {
      color: 'var(--select-error-color)',
    },
    '&[data-invalid][data-variant="outlined"] label, &[data-invalid][data-variant="contained"] label': {
      borderColor: 'var(--select-error-color)',
    },
    '&[data-invalid][data-variant="contained"] label': {
      background: 'color-mix(in srgb, var(--select-error-color) 8%, transparent)',
    },
    '&[data-invalid][data-focused] label': {
      color: 'var(--select-error-color)',
    },
    '&[data-invalid][data-variant="outlined"][data-focused] label, &[data-invalid][data-variant="contained"][data-focused] label':
      {
        borderColor: 'var(--select-error-color)',
        boxShadow: cssVariableTheme.action.focusRing,
      },
    '&[data-invalid][data-variant="contained"][data-focused] label': {
      background: 'color-mix(in srgb, var(--select-error-color) 12%, transparent)',
    },

    '&[data-disabled] label': {
      color: cssVariableTheme.text.disabled,
      filter: 'grayscale(100%)',
      opacity: cssVariableTheme.action.disabledOpacity,
      cursor: 'not-allowed',
    },
    '&[data-disabled][data-focused] label': {
      boxShadow: 'none',
    },

    '& .select-trigger': {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      width: '100%',
      marginTop: '8px',
      marginBottom: '2px',
      cursor: 'inherit',
    },

    '& .select-value': {
      fontSize: cssVariableTheme.typography.fontSize.sm,
      fontWeight: cssVariableTheme.typography.fontWeight.normal,
      lineHeight: '1.5',
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      whiteSpace: 'nowrap',
      flexGrow: '1',
    },

    '& .select-value[data-placeholder]': {
      opacity: '0.5',
    },

    '& .select-arrow': {
      display: 'flex',
      alignItems: 'center',
      marginLeft: cssVariableTheme.spacing.sm,
      transition: `transform ${cssVariableTheme.transitions.duration.fast} ${cssVariableTheme.transitions.easing.default}`,
      fontSize: '10px',
      opacity: '0.6',
    },

    '&[data-open] .select-arrow': {
      transform: 'rotate(180deg)',
    },

    '& .dropdown-backdrop': {
      position: 'fixed',
      top: '0',
      left: '0',
      width: '100vw',
      height: '100vh',
      zIndex: '999',
    },

    '& .dropdown': {
      position: 'absolute',
      left: '0',
      right: '0',
      zIndex: '1000',
      maxHeight: '240px',
      overflowY: 'auto',
      background: cssVariableTheme.background.paper,
      border: `1px solid ${cssVariableTheme.action.subtleBorder}`,
      borderRadius: cssVariableTheme.shape.borderRadius.md,
      boxShadow: cssVariableTheme.shadows.lg,
      marginTop: '4px',
      padding: '4px 0',
      listStyle: 'none',
    },

    '& .dropdown-item': {
      display: 'flex',
      alignItems: 'center',
      padding: '8px 14px',
      fontSize: cssVariableTheme.typography.fontSize.sm,
      cursor: 'pointer',
      color: cssVariableTheme.text.primary,
      transition: `background ${cssVariableTheme.transitions.duration.fast} ${cssVariableTheme.transitions.easing.default}`,
    },

    '& .dropdown-item:hover, & .dropdown-item[data-highlighted]': {
      background: cssVariableTheme.action.hoverBackground,
    },

    '& .dropdown-item[data-selected]': {
      color: 'var(--select-primary-color)',
      fontWeight: cssVariableTheme.typography.fontWeight.medium,
    },

    '& .dropdown-item[data-disabled]': {
      opacity: cssVariableTheme.action.disabledOpacity,
      cursor: 'not-allowed',
    },

    '& .helperText': {
      fontSize: cssVariableTheme.typography.fontSize.xs,
      marginTop: '6px',
      opacity: '0.85',
      lineHeight: '1.4',
    },
  },
  constructed: ({ injector, element }) => {
    const hiddenInput = element.querySelector<HTMLInputElement>('input[type="hidden"]')
    if (hiddenInput && injector.cachedSingletons.has(FormService)) {
      const formService = injector.getInstance(FormService)
      formService.inputs.add(hiddenInput)
      return () => formService.inputs.delete(hiddenInput)
    }
  },
  render: ({ props, injector, useObservable, element }) => {
    const themeProvider = injector.getInstance(ThemeProviderService)

    // Set variant attribute
    if (props.variant) {
      element.setAttribute('data-variant', props.variant)
    } else {
      element.removeAttribute('data-variant')
    }
    if (props.disabled) {
      element.setAttribute('data-disabled', '')
    } else {
      element.removeAttribute('data-disabled')
    }

    setSelectColors({ element, themeProvider, props })

    const initialState: SelectState = {
      value: props.value || '',
      isOpen: false,
      highlightedIndex: -1,
    }

    // No custom onChange — setState triggers a full re-render via updateComponent
    const [state, setState] = useObservable<SelectState>('selectState', new ObservableValue(initialState))

    // Imperative data-attribute updates (run on every render)
    if (state.isOpen && !props.disabled) {
      element.setAttribute('data-open', '')
      element.setAttribute('data-focused', '')
    } else {
      element.removeAttribute('data-open')
    }

    const validationResult = props.getValidationResult?.({ state })

    if (validationResult?.isValid === false) {
      element.setAttribute('data-invalid', '')
    } else {
      element.removeAttribute('data-invalid')
    }

    if (injector.cachedSingletons.has(FormService)) {
      const formService = injector.getInstance(FormService)
      formService.setFieldState(props.name as keyof unknown, validationResult || { isValid: true }, {} as ValidityState)
    }

    const getSelectedLabel = (value: string) => {
      const option = props.options.find((o) => o.value === value)
      return option?.label
    }

    const closeDropdown = () => {
      setState({ ...state, isOpen: false, highlightedIndex: -1 })
    }

    const openDropdown = () => {
      if (props.disabled) return
      const currentIndex = props.options.findIndex((o) => o.value === state.value)
      setState({ ...state, isOpen: true, highlightedIndex: Math.max(currentIndex, 0) })
    }

    const selectOption = (option: SelectOption) => {
      if (option.disabled) return
      setState({
        ...state,
        value: option.value,
        isOpen: false,
        highlightedIndex: -1,
      })
      props.onValueChange?.(option.value)
    }

    const getEnabledOptions = () => props.options.filter((o) => !o.disabled)

    const handleKeyDown = (ev: KeyboardEvent) => {
      if (props.disabled) return

      if (!state.isOpen) {
        if (ev.key === 'Enter' || ev.key === ' ' || ev.key === 'ArrowDown' || ev.key === 'ArrowUp') {
          ev.preventDefault()
          openDropdown()
          return
        }
      }

      const enabledOptions = getEnabledOptions()

      switch (ev.key) {
        case 'Escape':
          ev.preventDefault()
          closeDropdown()
          break
        case 'ArrowDown': {
          ev.preventDefault()
          const nextEnabled = enabledOptions.findIndex((o) => props.options.indexOf(o) > state.highlightedIndex)
          if (nextEnabled !== -1) {
            setState({ ...state, highlightedIndex: props.options.indexOf(enabledOptions[nextEnabled]) })
          }
          break
        }
        case 'ArrowUp': {
          ev.preventDefault()
          const prevEnabled = [...enabledOptions]
            .reverse()
            .find((o) => props.options.indexOf(o) < state.highlightedIndex)
          if (prevEnabled) {
            setState({ ...state, highlightedIndex: props.options.indexOf(prevEnabled) })
          }
          break
        }
        case 'Enter':
        case ' ':
          ev.preventDefault()
          if (state.highlightedIndex >= 0 && state.highlightedIndex < props.options.length) {
            selectOption(props.options[state.highlightedIndex])
          }
          break
        case 'Home': {
          ev.preventDefault()
          if (enabledOptions.length > 0) {
            setState({ ...state, highlightedIndex: props.options.indexOf(enabledOptions[0]) })
          }
          break
        }
        case 'End': {
          ev.preventDefault()
          if (enabledOptions.length > 0) {
            setState({
              ...state,
              highlightedIndex: props.options.indexOf(enabledOptions[enabledOptions.length - 1]),
            })
          }
          break
        }
        default:
          break
      }
    }

    const selectedLabel = getSelectedLabel(state.value)
    const helperText =
      (validationResult?.isValid === false && validationResult?.message) ||
      props.getHelperText?.({ state, validationResult }) ||
      ''

    return (
      <div>
        <input type="hidden" name={props.name} value={state.value} required={props.required} />
        <label {...props.labelProps}>
          {props.labelTitle}
          <div
            className="select-trigger"
            role="combobox"
            aria-expanded={state.isOpen ? 'true' : 'false'}
            aria-haspopup="listbox"
            tabIndex={props.disabled ? -1 : 0}
            onclick={(ev) => {
              ev.stopPropagation()
              ev.preventDefault()
              if (props.disabled) return
              if (state.isOpen) {
                closeDropdown()
              } else {
                openDropdown()
              }
            }}
            onkeydown={handleKeyDown}
            onfocus={() => {
              if (!props.disabled) {
                element.setAttribute('data-focused', '')
              }
            }}
            onblur={() => {
              if (!state.isOpen) {
                element.removeAttribute('data-focused')
              }
            }}
          >
            <span className="select-value" {...(selectedLabel ? {} : { 'data-placeholder': '' })}>
              {selectedLabel || props.placeholder || ''}
            </span>
            <span className="select-arrow">&#9660;</span>
          </div>
          <span className="helperText">{helperText}</span>
        </label>
        {state.isOpen ? (
          <>
            <div
              className="dropdown-backdrop"
              onclick={(ev) => {
                ev.stopPropagation()
                closeDropdown()
              }}
            />
            <ul className="dropdown" role="listbox">
              {props.options.map((option, index) => (
                <li
                  className="dropdown-item"
                  role="option"
                  aria-selected={option.value === state.value ? 'true' : 'false'}
                  {...(option.value === state.value ? { 'data-selected': '' } : {})}
                  {...(index === state.highlightedIndex ? { 'data-highlighted': '' } : {})}
                  {...(option.disabled ? { 'data-disabled': '' } : {})}
                  onclick={(ev) => {
                    ev.stopPropagation()
                    selectOption(option)
                  }}
                >
                  {option.label}
                </li>
              ))}
            </ul>
          </>
        ) : null}
      </div>
    )
  },
})
