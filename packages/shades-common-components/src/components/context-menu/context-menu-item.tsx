import type { ChildrenList } from '@furystack/shades'
import { createComponent, Shade } from '@furystack/shades'
import { cssVariableTheme } from '../../services/css-variable-theme.js'
import type { ContextMenuItem, ContextMenuManager } from './context-menu-manager.js'

export type ContextMenuItemProps<T> = {
  item: ContextMenuItem<T>
  index: number
  manager: ContextMenuManager<T>
}

export const ContextMenuItemComponent: <T>(props: ContextMenuItemProps<T>, children: ChildrenList) => JSX.Element<any> =
  Shade<ContextMenuItemProps<any>>({
    shadowDomName: 'shade-context-menu-item',
    css: {
      display: 'flex',
      alignItems: 'center',
      padding: '8px 16px',
      cursor: 'default',
      userSelect: 'none',
      gap: '8px',
      transition: 'background-color 0.15s ease',
      '&:not(.disabled):hover, &.focused': {
        backgroundColor: 'rgba(128, 128, 128, 0.12)',
      },
      '&.disabled': {
        opacity: '0.5',
        cursor: 'not-allowed',
      },
    },
    render: ({ props, element, useObservable }) => {
      const { item, index, manager } = props

      element.setAttribute('role', 'menuitem')

      if (item.disabled) {
        element.classList.add('disabled')
        element.setAttribute('aria-disabled', 'true')
      }

      element.onclick = () => {
        if (!item.disabled) {
          manager.selectItem(index)
        }
      }

      const updateFocusState = (focusedIndex: number) => {
        element.classList.toggle('focused', focusedIndex === index)
      }

      const [focusedIndex] = useObservable('focusedIndex', manager.focusedIndex, {
        onChange: updateFocusState,
      })
      updateFocusState(focusedIndex)

      return (
        <>
          {item.icon && <span className="context-menu-item-icon">{item.icon}</span>}
          <span className="context-menu-item-content" style={{ flex: '1' }}>
            <div className="context-menu-item-label">{item.label}</div>
            {item.description && (
              <div
                className="context-menu-item-description"
                style={{
                  fontSize: '0.85em',
                  color: cssVariableTheme.text.secondary,
                }}
              >
                {item.description}
              </div>
            )}
          </span>
        </>
      )
    },
  })
