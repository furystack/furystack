import type { ChildrenList } from '@furystack/shades'
import { createComponent, Shade } from '@furystack/shades'
import { buildTransition, cssVariableTheme } from '../../services/css-variable-theme.js'
import type { ContextMenuItem, ContextMenuManager } from './context-menu-manager.js'

export type ContextMenuItemProps<T> = {
  item: ContextMenuItem<T>
  index: number
  manager: ContextMenuManager<T>
}

export const ContextMenuItemComponent: <T>(props: ContextMenuItemProps<T>, children: ChildrenList) => JSX.Element<any> =
  Shade<ContextMenuItemProps<any>>({
    tagName: 'shade-context-menu-item',
    css: {
      display: 'flex',
      alignItems: 'center',
      padding: `${cssVariableTheme.spacing.sm} ${cssVariableTheme.spacing.md}`,
      cursor: 'default',
      userSelect: 'none',
      gap: cssVariableTheme.spacing.sm,
      opacity: '0',
      transform: 'translateY(-4px)',
      transition: buildTransition(
        ['opacity', cssVariableTheme.transitions.duration.slow, 'ease-out'],
        ['transform', cssVariableTheme.transitions.duration.fast, 'ease-out'],
        ['background-color', cssVariableTheme.transitions.duration.fast, 'ease'],
      ),
      '&.visible': {
        opacity: '1',
        transform: 'translateY(0)',
      },
      '&:not(.disabled):hover, &.focused': {
        backgroundColor: cssVariableTheme.action.hoverBackground,
      },
      '&.disabled': {
        opacity: '0.5',
        cursor: 'not-allowed',
      },
    },
    constructed: ({ props, element }) => {
      const timer = setTimeout(() => element.classList.add('visible'), props.index * 30)
      return () => clearTimeout(timer)
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
