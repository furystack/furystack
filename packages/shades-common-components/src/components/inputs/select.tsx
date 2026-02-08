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

export type SelectOptionGroup = {
  label: string
  options: SelectOption[]
}

export type SelectState = {
  value: string | string[]
  isOpen: boolean
  highlightedIndex: number
  searchText: string
}

export type SelectProps = {
  /** The list of options available in the select */
  options?: SelectOption[]
  /** Grouped options (alternative to flat options) */
  optionGroups?: SelectOptionGroup[]
  /** The selection mode: 'single' (default) or 'multiple' */
  mode?: 'single' | 'multiple'
  /** The currently selected value (string for single, string[] for multiple) */
  value?: string | string[]
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
  /** Whether to show a search/filter input */
  showSearch?: boolean
  /** Custom filter function for search (defaults to case-insensitive label match) */
  filterOption?: (searchText: string, option: SelectOption) => boolean
  /** Callback when the selected value changes (single mode) */
  onValueChange?: (value: string) => void
  /** Callback when the selected values change (multiple mode) */
  onMultiValueChange?: (values: string[]) => void
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

/** Flattens optionGroups + options into a single flat list */
const getAllOptions = (props: SelectProps): SelectOption[] => {
  const flatOptions = props.options || []
  const groupedOptions = (props.optionGroups || []).flatMap((g) => g.options)
  return [...flatOptions, ...groupedOptions]
}

const defaultFilterOption = (searchText: string, option: SelectOption): boolean => {
  return option.label.toLowerCase().includes(searchText.toLowerCase())
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

    '& .select-multi-values': {
      display: 'flex',
      flexWrap: 'wrap',
      gap: '4px',
      flexGrow: '1',
      minHeight: '24px',
      alignItems: 'center',
    },

    '& .select-chip': {
      display: 'inline-flex',
      alignItems: 'center',
      gap: '4px',
      padding: '2px 8px',
      borderRadius: cssVariableTheme.shape.borderRadius.lg,
      background: 'color-mix(in srgb, var(--select-primary-color) 15%, transparent)',
      color: 'var(--select-primary-color)',
      fontSize: cssVariableTheme.typography.fontSize.xs,
      fontWeight: cssVariableTheme.typography.fontWeight.medium,
      lineHeight: '1.5',
      maxWidth: '150px',
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      whiteSpace: 'nowrap',
    },

    '& .select-chip-remove': {
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      cursor: 'pointer',
      border: 'none',
      background: 'transparent',
      color: 'inherit',
      padding: '0',
      fontSize: '12px',
      lineHeight: '1',
      opacity: '0.7',
      flexShrink: '0',
    },

    '& .select-chip-remove:hover': {
      opacity: '1',
    },

    '& .select-arrow': {
      display: 'flex',
      alignItems: 'center',
      marginLeft: cssVariableTheme.spacing.sm,
      transition: `transform ${cssVariableTheme.transitions.duration.fast} ${cssVariableTheme.transitions.easing.default}`,
      fontSize: '10px',
      opacity: '0.6',
      flexShrink: '0',
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

    '& .dropdown[data-direction="up"]': {
      bottom: '100%',
      marginTop: '0',
      marginBottom: '4px',
    },

    '& .dropdown-search': {
      display: 'block',
      width: '100%',
      padding: '8px 14px',
      border: 'none',
      borderBottom: `1px solid ${cssVariableTheme.action.subtleBorder}`,
      background: 'transparent',
      color: cssVariableTheme.text.primary,
      fontSize: cssVariableTheme.typography.fontSize.sm,
      fontFamily: cssVariableTheme.typography.fontFamily,
      outline: 'none',
      boxSizing: 'border-box',
    },

    '& .dropdown-search::placeholder': {
      color: cssVariableTheme.text.disabled,
    },

    '& .dropdown-group-label': {
      padding: '8px 14px 4px',
      fontSize: cssVariableTheme.typography.fontSize.xs,
      fontWeight: cssVariableTheme.typography.fontWeight.semibold,
      color: cssVariableTheme.text.secondary,
      textTransform: 'uppercase',
      letterSpacing: '0.05em',
      userSelect: 'none',
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

    '& .dropdown-item .check-icon': {
      marginRight: '8px',
      width: '16px',
      fontSize: '12px',
      flexShrink: '0',
    },

    '& .dropdown-no-results': {
      padding: '8px 14px',
      fontSize: cssVariableTheme.typography.fontSize.sm,
      color: cssVariableTheme.text.disabled,
      textAlign: 'center',
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
    const isMultiple = props.mode === 'multiple'

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
    if (isMultiple) {
      element.setAttribute('data-multiple', '')
    } else {
      element.removeAttribute('data-multiple')
    }

    setSelectColors({ element, themeProvider, props })

    const allOptions = getAllOptions(props)

    const normalizeValue = (v: string | string[] | undefined): string | string[] => {
      if (isMultiple) {
        if (Array.isArray(v)) return v
        if (typeof v === 'string' && v) return [v]
        return []
      }
      if (Array.isArray(v)) return v[0] || ''
      return v || ''
    }

    const initialState: SelectState = {
      value: normalizeValue(props.value),
      isOpen: false,
      highlightedIndex: -1,
      searchText: '',
    }

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

    const filterFn = props.filterOption || defaultFilterOption

    const getFilteredOptions = (opts: SelectOption[]): SelectOption[] => {
      if (!props.showSearch || !state.searchText) return opts
      return opts.filter((o) => filterFn(state.searchText, o))
    }

    const filteredAllOptions = getFilteredOptions(allOptions)

    const getSelectedLabel = (value: string) => {
      const option = allOptions.find((o) => o.value === value)
      return option?.label
    }

    const closeDropdown = () => {
      setState({ ...state, isOpen: false, highlightedIndex: -1, searchText: '' })
    }

    const openDropdown = () => {
      if (props.disabled) return
      const firstIndex = isMultiple ? 0 : filteredAllOptions.findIndex((o) => o.value === state.value)
      setState({ ...state, isOpen: true, highlightedIndex: Math.max(firstIndex, 0), searchText: '' })
    }

    const selectOption = (option: SelectOption) => {
      if (option.disabled) return
      if (isMultiple) {
        const currentValues = state.value as string[]
        const isSelected = currentValues.includes(option.value)
        const newValues = isSelected
          ? currentValues.filter((v) => v !== option.value)
          : [...currentValues, option.value]
        setState({
          ...state,
          value: newValues,
          highlightedIndex: -1,
        })
        props.onMultiValueChange?.(newValues)
        props.onValueChange?.(newValues.join(','))
      } else {
        setState({
          ...state,
          value: option.value,
          isOpen: false,
          highlightedIndex: -1,
          searchText: '',
        })
        props.onValueChange?.(option.value)
      }
    }

    const removeChip = (value: string) => {
      if (props.disabled || !isMultiple) return
      const currentValues = state.value as string[]
      const newValues = currentValues.filter((v) => v !== value)
      setState({ ...state, value: newValues })
      props.onMultiValueChange?.(newValues)
      props.onValueChange?.(newValues.join(','))
    }

    const getEnabledFilteredOptions = () => filteredAllOptions.filter((o) => !o.disabled)

    const handleKeyDown = (ev: KeyboardEvent) => {
      if (props.disabled) return

      if (!state.isOpen) {
        if (ev.key === 'Enter' || ev.key === ' ' || ev.key === 'ArrowDown' || ev.key === 'ArrowUp') {
          ev.preventDefault()
          openDropdown()
          return
        }
      }

      const enabledOptions = getEnabledFilteredOptions()

      switch (ev.key) {
        case 'Escape':
          ev.preventDefault()
          closeDropdown()
          break
        case 'ArrowDown': {
          ev.preventDefault()
          const nextEnabled = enabledOptions.findIndex((o) => filteredAllOptions.indexOf(o) > state.highlightedIndex)
          if (nextEnabled !== -1) {
            setState({ ...state, highlightedIndex: filteredAllOptions.indexOf(enabledOptions[nextEnabled]) })
          }
          break
        }
        case 'ArrowUp': {
          ev.preventDefault()
          const prevEnabled = [...enabledOptions]
            .reverse()
            .find((o) => filteredAllOptions.indexOf(o) < state.highlightedIndex)
          if (prevEnabled) {
            setState({ ...state, highlightedIndex: filteredAllOptions.indexOf(prevEnabled) })
          }
          break
        }
        case 'Enter':
          ev.preventDefault()
          if (state.highlightedIndex >= 0 && state.highlightedIndex < filteredAllOptions.length) {
            selectOption(filteredAllOptions[state.highlightedIndex])
          }
          break
        case ' ':
          if (props.showSearch) break
          ev.preventDefault()
          if (state.highlightedIndex >= 0 && state.highlightedIndex < filteredAllOptions.length) {
            selectOption(filteredAllOptions[state.highlightedIndex])
          }
          break
        case 'Home': {
          ev.preventDefault()
          if (enabledOptions.length > 0) {
            setState({ ...state, highlightedIndex: filteredAllOptions.indexOf(enabledOptions[0]) })
          }
          break
        }
        case 'End': {
          ev.preventDefault()
          if (enabledOptions.length > 0) {
            setState({
              ...state,
              highlightedIndex: filteredAllOptions.indexOf(enabledOptions[enabledOptions.length - 1]),
            })
          }
          break
        }
        case 'Backspace': {
          if (isMultiple && props.showSearch && !state.searchText) {
            const currentValues = state.value as string[]
            if (currentValues.length > 0) {
              const newValues = currentValues.slice(0, -1)
              setState({ ...state, value: newValues })
              props.onMultiValueChange?.(newValues)
              props.onValueChange?.(newValues.join(','))
            }
          }
          break
        }
        default:
          break
      }
    }

    const handleSearchInput = (ev: Event) => {
      const target = ev.target as HTMLInputElement
      setState({ ...state, searchText: target.value, highlightedIndex: 0 })
    }

    // After re-render: restore search focus + compute dropdown direction
    if (state.isOpen) {
      queueMicrotask(() => {
        if (props.showSearch) {
          const searchInput = element.querySelector<HTMLInputElement>('.dropdown-search')
          if (searchInput && element.ownerDocument.activeElement !== searchInput) {
            searchInput.focus()
          }
        }

        const dropdown = element.querySelector<HTMLElement>('.dropdown')
        if (dropdown) {
          const rect = element.getBoundingClientRect()
          const spaceBelow = window.innerHeight - rect.bottom
          const dropdownHeight = dropdown.scrollHeight
          const spaceAbove = rect.top

          if (spaceBelow < dropdownHeight && spaceAbove > spaceBelow) {
            dropdown.setAttribute('data-direction', 'up')
          } else {
            dropdown.removeAttribute('data-direction')
          }
        }
      })
    }

    const hiddenValue = isMultiple ? (state.value as string[]).join(',') : (state.value as string)

    const helperText =
      (validationResult?.isValid === false && validationResult?.message) ||
      props.getHelperText?.({ state, validationResult }) ||
      ''

    const renderSelectedValues = () => {
      if (isMultiple) {
        const selectedValues = state.value as string[]
        if (selectedValues.length === 0) {
          return (
            <span className="select-value" data-placeholder="">
              {props.placeholder || ''}
            </span>
          )
        }
        return (
          <div className="select-multi-values">
            {selectedValues.map((val) => {
              const label = getSelectedLabel(val) || val
              return (
                <span className="select-chip">
                  {label}
                  {!props.disabled ? (
                    <span
                      className="select-chip-remove"
                      role="button"
                      onclick={(ev: MouseEvent) => {
                        ev.stopPropagation()
                        removeChip(val)
                      }}
                    >
                      ✕
                    </span>
                  ) : null}
                </span>
              )
            })}
          </div>
        )
      }

      const selectedLabel = getSelectedLabel(state.value as string)
      return (
        <span className="select-value" {...(selectedLabel ? {} : { 'data-placeholder': '' })}>
          {selectedLabel || props.placeholder || ''}
        </span>
      )
    }

    const renderOptionItem = (option: SelectOption, flatIndex: number) => {
      const isSelected = isMultiple ? (state.value as string[]).includes(option.value) : option.value === state.value

      return (
        <li
          className="dropdown-item"
          role="option"
          aria-selected={isSelected ? 'true' : 'false'}
          {...(isSelected ? { 'data-selected': '' } : {})}
          {...(flatIndex === state.highlightedIndex ? { 'data-highlighted': '' } : {})}
          {...(option.disabled ? { 'data-disabled': '' } : {})}
          onclick={(ev) => {
            ev.stopPropagation()
            selectOption(option)
          }}
        >
          {isMultiple ? <span className="check-icon">{isSelected ? '✓' : ''}</span> : null}
          {option.label}
        </li>
      )
    }

    const renderDropdownContent = () => {
      const hasGroups = props.optionGroups && props.optionGroups.length > 0

      if (hasGroups) {
        let flatIndex = 0
        const flatFiltered = props.options ? getFilteredOptions(props.options) : []
        const groupsContent: JSX.Element[] = []

        // Render ungrouped options first
        if (flatFiltered.length > 0) {
          for (const option of flatFiltered) {
            groupsContent.push(renderOptionItem(option, flatIndex))
            flatIndex++
          }
        }

        // Render grouped options
        for (const group of props.optionGroups!) {
          const groupFiltered = getFilteredOptions(group.options)
          if (groupFiltered.length === 0) continue
          groupsContent.push(
            <li className="dropdown-group-label" role="presentation">
              {group.label}
            </li>,
          )
          for (const option of groupFiltered) {
            groupsContent.push(renderOptionItem(option, flatIndex))
            flatIndex++
          }
        }

        if (groupsContent.length === 0) {
          return <li className="dropdown-no-results">No results found</li>
        }

        return <>{groupsContent}</>
      }

      // Flat options
      if (filteredAllOptions.length === 0) {
        return <li className="dropdown-no-results">No results found</li>
      }

      return <>{filteredAllOptions.map((option, index) => renderOptionItem(option, index))}</>
    }

    return (
      <div>
        <input type="hidden" name={props.name} value={hiddenValue} required={props.required} />
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
              if (state.isOpen && !isMultiple) {
                closeDropdown()
              } else if (!state.isOpen) {
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
            {renderSelectedValues()}
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
            <ul className="dropdown" role="listbox" aria-multiselectable={isMultiple ? 'true' : undefined}>
              {props.showSearch ? (
                <li role="presentation">
                  <input
                    className="dropdown-search"
                    type="text"
                    placeholder="Search..."
                    value={state.searchText}
                    oninput={handleSearchInput}
                    onkeydown={handleKeyDown}
                    onclick={(ev) => ev.stopPropagation()}
                  />
                </li>
              ) : null}
              {renderDropdownContent()}
            </ul>
          </>
        ) : null}
      </div>
    )
  },
})
