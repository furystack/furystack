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
    shadowDomName: 'shade-context-menu-item',
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
      '&[data-visible]': {
        opacity: '1',
        transform: 'translateY(0)',
      },
      '&:not([data-disabled]):hover, &[data-focused]': {
        backgroundColor: cssVariableTheme.action.hoverBackground,
      },
      '&[data-disabled]': {
        opacity: '0.5',
        cursor: 'not-allowed',
      },
    },
    render: ({ props, useObservable, useDisposable, useHostProps, useState }) => {
      const [isVisible, setVisible] = useState('isVisible', false)

      useDisposable('enter-animation', () => {
        const timer = setTimeout(() => setVisible(true), props.index * 30)
        return { [Symbol.dispose]: () => clearTimeout(timer) }
      })

      const { item, index, manager } = props

      const [focusedIndex] = useObservable('focusedIndex', manager.focusedIndex)

      useHostProps({
        role: 'menuitem',
        onclick: () => {
          if (!item.disabled) {
            manager.selectItem(index)
          }
        },
        ...(isVisible ? { 'data-visible': '' } : {}),
        ...(item.disabled ? { 'data-disabled': '', 'aria-disabled': 'true' } : {}),
        ...(focusedIndex === index ? { 'data-focused': '' } : {}),
      })

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
