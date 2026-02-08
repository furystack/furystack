import { createComponent, Shade } from '@furystack/shades'
import { ObservableValue } from '@furystack/utils'
import { buildTransition, cssVariableTheme } from '../../services/css-variable-theme.js'
import type { MenuEntry, MenuMode } from './menu-types.js'
import { getNavigableKeys } from './menu-types.js'

export type MenuProps = {
  /** Menu items to render */
  items: MenuEntry[]
  /** Layout mode */
  mode?: MenuMode
  /** Currently selected item key */
  selectedKey?: string
  /** Called when an item is selected */
  onSelect?: (key: string) => void
}

const renderItems = (
  items: MenuEntry[],
  options: {
    rootElement: HTMLElement
    selectedKey?: string
    expandedGroups: string[]
    onSelect?: (key: string) => void
    focusedKeyObservable: ObservableValue<string>
    onToggleGroup: (key: string) => void
    isInline: boolean
  },
): JSX.Element[] => {
  return items.map((item) => {
    if (item.type === 'divider') {
      return <div role="separator" className="menu-divider" />
    }

    if (item.type === 'group') {
      const isExpanded = !options.isInline || options.expandedGroups.includes(item.key)

      return (
        <div role="group" aria-label={item.label} className="menu-group" data-group-key={item.key}>
          <div
            className={`menu-group-label${options.isInline ? ' menu-group-label-inline' : ''}`}
            onclick={
              options.isInline
                ? () => {
                    options.onToggleGroup(item.key)
                  }
                : undefined
            }
          >
            <span>{item.label}</span>
            {options.isInline ? (
              <span className={`menu-group-arrow${isExpanded ? ' expanded' : ''}`}>&#9656;</span>
            ) : null}
          </div>
          <div className="menu-group-children" style={{ display: isExpanded ? '' : 'none' }}>
            {renderItems(item.children, options)}
          </div>
        </div>
      )
    }

    const isSelected = options.selectedKey === item.key

    const classNames = ['menu-item', isSelected ? 'selected' : '', item.disabled ? 'disabled' : '']
      .filter(Boolean)
      .join(' ')

    return (
      <div
        role="menuitem"
        className={classNames}
        aria-disabled={item.disabled ? 'true' : undefined}
        aria-current={isSelected ? 'true' : undefined}
        data-key={item.key}
        tabIndex={-1}
        onclick={() => {
          if (!item.disabled) {
            options.onSelect?.(item.key)
          }
        }}
        onmouseenter={() => {
          if (!item.disabled) {
            options.focusedKeyObservable.setValue(item.key)
          }
        }}
      >
        {item.icon && <span className="menu-item-icon">{item.icon}</span>}
        <span className="menu-item-label">{item.label}</span>
      </div>
    )
  })
}

export const Menu = Shade<MenuProps>({
  shadowDomName: 'shade-menu',
  css: {
    display: 'flex',
    outline: 'none',
    listStyle: 'none',
    margin: '0',
    padding: `${cssVariableTheme.spacing.xs} 0`,
    fontFamily: cssVariableTheme.typography.fontFamily,
    fontSize: cssVariableTheme.typography.fontSize.md,
    color: cssVariableTheme.text.primary,

    '&[data-mode="horizontal"]': {
      flexDirection: 'row',
      alignItems: 'center',
      padding: '0',
      gap: '2px',
    },

    '&[data-mode="vertical"], &:not([data-mode])': {
      flexDirection: 'column',
    },

    '&[data-mode="inline"]': {
      flexDirection: 'column',
    },

    // Menu item
    '& .menu-item': {
      display: 'flex',
      alignItems: 'center',
      gap: cssVariableTheme.spacing.sm,
      padding: `${cssVariableTheme.spacing.sm} ${cssVariableTheme.spacing.md}`,
      cursor: 'pointer',
      userSelect: 'none',
      borderRadius: cssVariableTheme.shape.borderRadius.sm,
      transition: buildTransition(
        ['background-color', cssVariableTheme.transitions.duration.fast, cssVariableTheme.transitions.easing.default],
        ['color', cssVariableTheme.transitions.duration.fast, cssVariableTheme.transitions.easing.default],
      ),
      whiteSpace: 'nowrap',
    },

    '& .menu-item:hover:not(.disabled), & .menu-item.focused:not(.disabled)': {
      backgroundColor: cssVariableTheme.action.hoverBackground,
    },

    '& .menu-item.selected': {
      color: cssVariableTheme.palette.primary.main,
      backgroundColor: `color-mix(in srgb, ${cssVariableTheme.palette.primary.main} 10%, transparent)`,
    },

    '& .menu-item.disabled': {
      opacity: '0.5',
      cursor: 'not-allowed',
    },

    '& .menu-item-icon': {
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: '0',
      width: '20px',
    },

    '& .menu-item-label': {
      flex: '1',
    },

    // Horizontal mode item tweaks
    '&[data-mode="horizontal"] .menu-item': {
      padding: `${cssVariableTheme.spacing.sm} ${cssVariableTheme.spacing.md}`,
      borderRadius: cssVariableTheme.shape.borderRadius.md,
    },

    '&[data-mode="horizontal"] .menu-item.selected': {
      boxShadow: `inset 0 -2px 0 ${cssVariableTheme.palette.primary.main}`,
      borderRadius: '0',
    },

    // Divider
    '& .menu-divider': {
      height: '1px',
      margin: `${cssVariableTheme.spacing.xs} ${cssVariableTheme.spacing.sm}`,
      backgroundColor: cssVariableTheme.divider,
    },

    '&[data-mode="horizontal"] .menu-divider': {
      width: '1px',
      height: 'auto',
      alignSelf: 'stretch',
      margin: '4px 2px',
    },

    // Group
    '& .menu-group-label': {
      display: 'flex',
      alignItems: 'center',
      padding: `${cssVariableTheme.spacing.xs} ${cssVariableTheme.spacing.md}`,
      fontSize: cssVariableTheme.typography.fontSize.xs,
      fontWeight: cssVariableTheme.typography.fontWeight.bold,
      color: cssVariableTheme.text.secondary,
      textTransform: 'uppercase',
      letterSpacing: cssVariableTheme.typography.letterSpacing.wider,
      userSelect: 'none',
    },

    '& .menu-group-label-inline': {
      cursor: 'pointer',
      justifyContent: 'space-between',
      padding: `${cssVariableTheme.spacing.sm} ${cssVariableTheme.spacing.md}`,
      fontSize: cssVariableTheme.typography.fontSize.md,
      fontWeight: cssVariableTheme.typography.fontWeight.medium,
      textTransform: 'none',
      letterSpacing: 'normal',
      color: cssVariableTheme.text.primary,
    },

    '& .menu-group-label-inline:hover': {
      backgroundColor: cssVariableTheme.action.hoverBackground,
      borderRadius: cssVariableTheme.shape.borderRadius.sm,
    },

    '& .menu-group-arrow': {
      display: 'inline-block',
      transition: buildTransition([
        'transform',
        cssVariableTheme.transitions.duration.fast,
        cssVariableTheme.transitions.easing.default,
      ]),
    },

    '& .menu-group-arrow.expanded': {
      transform: 'rotate(90deg)',
    },

    '& .menu-group-children': {
      display: 'flex',
      flexDirection: 'column',
    },

    '&[data-mode="inline"] .menu-group-children': {
      paddingLeft: cssVariableTheme.spacing.md,
    },
  },
  render: ({ props, element, useDisposable, useObservable }) => {
    const { items, mode = 'vertical', selectedKey, onSelect } = props

    const focusedKeyObservable = useDisposable('focusedKey', () => new ObservableValue(''))
    const expandedGroupsObservable = useDisposable('expandedGroups', () => new ObservableValue<string[]>([]))

    const updateFocusedItem = (newKey: string) => {
      element.querySelectorAll('.menu-item.focused').forEach((el) => el.classList.remove('focused'))
      if (newKey) {
        element.querySelector(`[data-key="${newKey}"]`)?.classList.add('focused')
      }
    }

    useObservable('focusedKey', focusedKeyObservable, { onChange: updateFocusedItem })

    // Imperatively toggle expanded group children without re-rendering
    useDisposable('expandedGroupsSub', () =>
      expandedGroupsObservable.subscribe((expanded) => {
        const groups = element.querySelectorAll<HTMLElement>('.menu-group[data-group-key]')
        groups.forEach((group) => {
          const key = group.getAttribute('data-group-key')
          if (!key) return
          const isExpanded = expanded.includes(key)
          const children = group.querySelector<HTMLElement>('.menu-group-children')
          const arrow = group.querySelector<HTMLElement>('.menu-group-arrow')
          if (children) children.style.display = isExpanded ? '' : 'none'
          if (arrow) arrow.classList.toggle('expanded', isExpanded)
        })
      }),
    )

    element.setAttribute('role', mode === 'horizontal' ? 'menubar' : 'menu')
    element.setAttribute('data-mode', mode)
    element.setAttribute('tabindex', '0')

    element.onkeydown = (ev: KeyboardEvent) => {
      const navigableKeys = getNavigableKeys(items)
      if (navigableKeys.length === 0) return

      const isHorizontal = mode === 'horizontal'
      const nextKey = isHorizontal ? 'ArrowRight' : 'ArrowDown'
      const prevKey = isHorizontal ? 'ArrowLeft' : 'ArrowUp'

      const currentFocusedKey = focusedKeyObservable.getValue()

      switch (ev.key) {
        case nextKey: {
          ev.preventDefault()
          const currentIndex = navigableKeys.indexOf(currentFocusedKey)
          const nextIndex = currentIndex < navigableKeys.length - 1 ? currentIndex + 1 : 0
          focusedKeyObservable.setValue(navigableKeys[nextIndex])
          break
        }
        case prevKey: {
          ev.preventDefault()
          const currentIndex = navigableKeys.indexOf(currentFocusedKey)
          const prevIndex = currentIndex > 0 ? currentIndex - 1 : navigableKeys.length - 1
          focusedKeyObservable.setValue(navigableKeys[prevIndex])
          break
        }
        case 'Home': {
          ev.preventDefault()
          focusedKeyObservable.setValue(navigableKeys[0])
          break
        }
        case 'End': {
          ev.preventDefault()
          focusedKeyObservable.setValue(navigableKeys[navigableKeys.length - 1])
          break
        }
        case 'Enter':
        case ' ': {
          ev.preventDefault()
          if (currentFocusedKey) {
            onSelect?.(currentFocusedKey)
          }
          break
        }
        default:
          break
      }
    }

    const handleToggleGroup = (key: string) => {
      const currentExpanded = expandedGroupsObservable.getValue()
      if (currentExpanded.includes(key)) {
        expandedGroupsObservable.setValue(currentExpanded.filter((k) => k !== key))
      } else {
        expandedGroupsObservable.setValue([...currentExpanded, key])
      }
    }

    return (
      <>
        {renderItems(items, {
          rootElement: element,
          selectedKey,
          expandedGroups: expandedGroupsObservable.getValue(),
          onSelect,
          focusedKeyObservable,
          onToggleGroup: handleToggleGroup,
          isInline: mode === 'inline',
        })}
      </>
    )
  },
})
