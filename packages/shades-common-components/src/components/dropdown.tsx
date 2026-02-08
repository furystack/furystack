import type { ChildrenList } from '@furystack/shades'
import { createComponent, Shade } from '@furystack/shades'
import { ObservableValue } from '@furystack/utils'
import { buildTransition, cssVariableTheme } from '../services/css-variable-theme.js'
import type { MenuEntry } from './menu/menu-types.js'
import { getNavigableKeys } from './menu/menu-types.js'

export type DropdownPlacement = 'bottomLeft' | 'bottomRight' | 'topLeft' | 'topRight'

export type DropdownProps = {
  /** Menu items to display in the dropdown */
  items: MenuEntry[]
  /** Placement of the dropdown relative to the trigger */
  placement?: DropdownPlacement
  /** Whether the dropdown is disabled */
  disabled?: boolean
  /** Called when an item is selected */
  onSelect?: (key: string) => void
}

const renderDropdownItems = (items: MenuEntry[], onSelect: (key: string) => void): JSX.Element[] => {
  return items.map((item) => {
    if (item.type === 'divider') {
      return <div role="separator" className="dropdown-divider" />
    }

    if (item.type === 'group') {
      return (
        <div role="group" aria-label={item.label} className="dropdown-group">
          <div className="dropdown-group-label">{item.label}</div>
          {renderDropdownItems(item.children, onSelect)}
        </div>
      )
    }

    const classNames = ['dropdown-item', item.disabled ? 'disabled' : ''].filter(Boolean).join(' ')

    return (
      <div
        role="menuitem"
        className={classNames}
        aria-disabled={item.disabled ? 'true' : undefined}
        data-key={item.key}
        onclick={() => {
          if (!item.disabled) {
            onSelect(item.key)
          }
        }}
      >
        {item.icon && <span className="dropdown-item-icon">{item.icon}</span>}
        <span className="dropdown-item-label">{item.label}</span>
      </div>
    )
  })
}

export const Dropdown: (props: DropdownProps, children: ChildrenList) => JSX.Element<any> = Shade<DropdownProps>({
  shadowDomName: 'shade-dropdown',
  css: {
    display: 'inline-flex',
    position: 'relative',

    '& .dropdown-trigger': {
      display: 'inline-flex',
      cursor: 'pointer',
    },

    '& .dropdown-trigger.disabled': {
      cursor: 'not-allowed',
      opacity: '0.5',
      pointerEvents: 'none',
    },

    // Backdrop
    '& .dropdown-backdrop': {
      opacity: '0',
      pointerEvents: 'none',
      transition: `opacity ${cssVariableTheme.transitions.duration.fast} ease-out`,
    },

    '& .dropdown-backdrop.visible': {
      opacity: '1',
      pointerEvents: 'auto',
    },

    // Panel
    '& .dropdown-panel': {
      opacity: '0',
      transform: 'scale(0.95) translateY(-4px)',
      transition: buildTransition(
        ['opacity', cssVariableTheme.transitions.duration.fast, 'ease-out'],
        ['transform', cssVariableTheme.transitions.duration.fast, 'ease-out'],
      ),
      transformOrigin: 'top left',
    },

    '& .dropdown-panel.visible': {
      opacity: '1',
      transform: 'scale(1) translateY(0)',
    },

    // Dropdown items
    '& .dropdown-item': {
      display: 'flex',
      alignItems: 'center',
      gap: cssVariableTheme.spacing.sm,
      padding: `${cssVariableTheme.spacing.sm} ${cssVariableTheme.spacing.md}`,
      cursor: 'pointer',
      userSelect: 'none',
      transition: buildTransition([
        'background-color',
        cssVariableTheme.transitions.duration.fast,
        cssVariableTheme.transitions.easing.default,
      ]),
      whiteSpace: 'nowrap',
    },

    '& .dropdown-item:hover:not(.disabled), & .dropdown-item.focused:not(.disabled)': {
      backgroundColor: cssVariableTheme.action.hoverBackground,
    },

    '& .dropdown-item.disabled': {
      opacity: '0.5',
      cursor: 'not-allowed',
    },

    '& .dropdown-item-icon': {
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: '0',
      width: '20px',
    },

    '& .dropdown-item-label': {
      flex: '1',
    },

    // Divider
    '& .dropdown-divider': {
      height: '1px',
      margin: '4px 8px',
      backgroundColor: cssVariableTheme.divider,
    },

    // Group
    '& .dropdown-group-label': {
      padding: `${cssVariableTheme.spacing.xs} ${cssVariableTheme.spacing.md}`,
      fontSize: cssVariableTheme.typography.fontSize.xs,
      fontWeight: cssVariableTheme.typography.fontWeight.bold,
      color: cssVariableTheme.text.secondary,
      textTransform: 'uppercase',
      letterSpacing: '0.5px',
      userSelect: 'none',
    },
  },
  constructed: ({ element }) => {
    const listener = (ev: KeyboardEvent) => {
      if (!element.hasAttribute('data-open')) return

      const panel = element.querySelector('.dropdown-panel')
      if (!panel) return

      const allItems = Array.from(panel.querySelectorAll<HTMLElement>('.dropdown-item:not(.disabled)'))

      switch (ev.key) {
        case 'Escape': {
          ev.preventDefault()
          element.querySelector('.dropdown-backdrop')?.dispatchEvent(new MouseEvent('click', { bubbles: true }))
          break
        }
        case 'ArrowDown': {
          if (allItems.length === 0) break
          ev.preventDefault()
          const focusedItem = panel.querySelector<HTMLElement>('.dropdown-item.focused')
          const currentIndex = focusedItem ? allItems.indexOf(focusedItem) : -1
          const nextIndex = currentIndex < allItems.length - 1 ? currentIndex + 1 : 0
          allItems.forEach((el) => el.classList.remove('focused'))
          allItems[nextIndex]?.classList.add('focused')
          break
        }
        case 'ArrowUp': {
          if (allItems.length === 0) break
          ev.preventDefault()
          const focusedItem = panel.querySelector<HTMLElement>('.dropdown-item.focused')
          const currentIndex = focusedItem ? allItems.indexOf(focusedItem) : allItems.length
          const prevIndex = currentIndex > 0 ? currentIndex - 1 : allItems.length - 1
          allItems.forEach((el) => el.classList.remove('focused'))
          allItems[prevIndex]?.classList.add('focused')
          break
        }
        case 'Enter': {
          ev.preventDefault()
          const focusedItem = panel.querySelector<HTMLElement>('.dropdown-item.focused')
          focusedItem?.click()
          break
        }
        default:
          break
      }
    }

    window.addEventListener('keydown', listener, true)
    return () => window.removeEventListener('keydown', listener, true)
  },
  render: ({ props, children, element, useDisposable }) => {
    const { items, placement = 'bottomLeft', disabled, onSelect } = props

    const isOpen = useDisposable('isOpen', () => new ObservableValue(false))

    const positionAndShowPanel = () => {
      requestAnimationFrame(() => {
        const trigger = element.querySelector('.dropdown-trigger')
        const panel = element.querySelector<HTMLElement>('.dropdown-panel')
        const backdrop = element.querySelector<HTMLElement>('.dropdown-backdrop')
        if (!trigger || !panel || !backdrop) return

        const { top: rectTop, bottom: rectBottom, left: rectLeft, right: rectRight } = trigger.getBoundingClientRect()
        const panelWidth = panel.offsetWidth
        const panelHeight = panel.offsetHeight

        let top: number
        let left: number

        switch (placement) {
          case 'bottomRight':
            top = rectBottom + 2
            left = rectRight - panelWidth
            break
          case 'topLeft':
            top = rectTop - panelHeight - 2
            left = rectLeft
            break
          case 'topRight':
            top = rectTop - panelHeight - 2
            left = rectRight - panelWidth
            break
          case 'bottomLeft':
          default:
            top = rectBottom + 2
            left = rectLeft
            break
        }

        panel.style.top = `${top}px`
        panel.style.left = `${left}px`

        backdrop.classList.add('visible')
        panel.classList.add('visible')

        const keys = getNavigableKeys(items)
        if (keys.length > 0) {
          panel.querySelector(`[data-key="${keys[0]}"]`)?.classList.add('focused')
        }
      })
    }

    const openDropdown = () => {
      if (isOpen.getValue() || isOpen.isDisposed) return
      isOpen.setValue(true)
      element.setAttribute('data-open', '')
      positionAndShowPanel()
    }

    const closeDropdown = () => {
      if (!isOpen.getValue() || isOpen.isDisposed) return
      isOpen.setValue(false)
      element.removeAttribute('data-open')
      const backdrop = element.querySelector<HTMLElement>('.dropdown-backdrop')
      const panel = element.querySelector<HTMLElement>('.dropdown-panel')
      backdrop?.classList.remove('visible')
      panel?.classList.remove('visible')
      panel?.querySelectorAll('.dropdown-item.focused').forEach((el) => el.classList.remove('focused'))
    }

    const handleTriggerClick = () => {
      if (disabled) return
      if (isOpen.getValue()) {
        closeDropdown()
      } else {
        openDropdown()
      }
    }

    const handleSelect = (key: string) => {
      onSelect?.(key)
      closeDropdown()
    }

    // If re-rendered while open (e.g. parent prop change), restore visual state
    if (isOpen.getValue()) {
      element.setAttribute('data-open', '')
      positionAndShowPanel()
    }

    return (
      <>
        <div className={`dropdown-trigger${disabled ? ' disabled' : ''}`} onclick={handleTriggerClick}>
          {children}
        </div>
        <div
          className="dropdown-backdrop"
          style={{
            position: 'fixed',
            top: '0',
            left: '0',
            width: '100%',
            height: '100%',
            zIndex: '9999',
          }}
          onclick={closeDropdown}
        >
          <div
            role="menu"
            className="dropdown-panel"
            style={{
              position: 'fixed',
              minWidth: '160px',
              background: cssVariableTheme.background.paper,
              borderRadius: cssVariableTheme.shape.borderRadius.md,
              boxShadow: cssVariableTheme.shadows.lg,
              border: `1px solid ${cssVariableTheme.divider}`,
              padding: '4px 0',
              overflow: 'hidden',
            }}
            onclick={(ev: MouseEvent) => ev.stopPropagation()}
          >
            {renderDropdownItems(items, handleSelect)}
          </div>
        </div>
      </>
    )
  },
})
