import type { ChildrenList, PartialElement } from '@furystack/shades'
import { createComponent, Shade } from '@furystack/shades'
import { cssVariableTheme } from '../../services/css-variable-theme.js'
import { ContextMenuItemComponent } from './context-menu-item.js'
import type { ContextMenuManager } from './context-menu-manager.js'

export type ContextMenuProps<T> = {
  manager: ContextMenuManager<T>
  onItemSelect?: (item: T) => void
} & PartialElement<HTMLDivElement>

export const ContextMenu: <T>(props: ContextMenuProps<T>, children: ChildrenList) => JSX.Element<any> = Shade<
  ContextMenuProps<any>
>({
  shadowDomName: 'shade-context-menu',
  constructed: ({ props }) => {
    const listener = (ev: KeyboardEvent) => {
      props.manager.handleKeyDown(ev)
    }
    window.addEventListener('keydown', listener, true)
    return () => window.removeEventListener('keydown', listener, true)
  },
  render: ({ props, useObservable, useDisposable }) => {
    const { manager, onItemSelect } = props

    useDisposable('onItemSelect', () => manager.subscribe('onSelectItem', (item) => onItemSelect?.(item)))

    const [isOpened] = useObservable('isOpened', manager.isOpened)
    const [items] = useObservable('items', manager.items)
    const [position] = useObservable('position', manager.position)

    if (!isOpened) {
      return null
    }

    return (
      <div
        className="context-menu-backdrop"
        style={{
          position: 'fixed',
          top: '0',
          left: '0',
          width: '100%',
          height: '100%',
          zIndex: '9999',
        }}
        onclick={() => manager.close()}
        oncontextmenu={(ev: MouseEvent) => {
          ev.preventDefault()
          manager.close()
        }}
      >
        <div
          role="menu"
          className="context-menu-container"
          style={{
            position: 'absolute',
            left: `${position.x}px`,
            top: `${position.y}px`,
            minWidth: '200px',
            background: cssVariableTheme.background.paper,
            borderRadius: '8px',
            boxShadow: '0 4px 16px rgba(0,0,0,0.2)',
            border: `1px solid ${cssVariableTheme.divider}`,
            padding: '4px 0',
            overflow: 'hidden',
          }}
          onclick={(ev: MouseEvent) => ev.stopPropagation()}
        >
          {items.map((item, index) => {
            if (item.type === 'separator') {
              return (
                <div
                  role="separator"
                  className="context-menu-separator"
                  style={{
                    height: '1px',
                    margin: '4px 8px',
                    backgroundColor: cssVariableTheme.divider,
                  }}
                />
              )
            }
            return <ContextMenuItemComponent item={item} index={index} manager={manager} />
          })}
        </div>
      </div>
    )
  },
})
