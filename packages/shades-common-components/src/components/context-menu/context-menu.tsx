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
  tagName: 'shade-context-menu',
  css: {
    '& .context-menu-backdrop': {
      opacity: '0',
      transition: `opacity ${cssVariableTheme.transitions.duration.fast} ease-out`,
    },
    '& .context-menu-backdrop.visible': {
      opacity: '1',
    },
    '& .context-menu-container': {
      opacity: '0',
      transform: 'scale(0.95) translateY(-4px)',
      transition: `opacity ${cssVariableTheme.transitions.duration.fast} ease-out, transform ${cssVariableTheme.transitions.duration.fast} ease-out`,
      transformOrigin: 'top left',
    },
    '& .context-menu-container.visible': {
      opacity: '1',
      transform: 'scale(1) translateY(0)',
    },
  },
  render: ({ props, useObservable, useDisposable, element }) => {
    useDisposable('keydown-handler', () => {
      const listener = (ev: KeyboardEvent) => {
        props.manager.handleKeyDown(ev)
      }
      window.addEventListener('keydown', listener, true)
      return { [Symbol.dispose]: () => window.removeEventListener('keydown', listener, true) }
    })

    const { manager, onItemSelect } = props

    useDisposable('onItemSelect', () => manager.subscribe('onSelectItem', (item) => onItemSelect?.(item)))

    const [isOpened] = useObservable('isOpened', manager.isOpened)
    const [items] = useObservable('items', manager.items)
    const [position] = useObservable('position', manager.position)

    if (!isOpened) {
      return null
    }

    requestAnimationFrame(() => {
      element.querySelector('.context-menu-backdrop')?.classList.add('visible')
      element.querySelector('.context-menu-container')?.classList.add('visible')
    })

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
            borderRadius: cssVariableTheme.shape.borderRadius.md,
            boxShadow: cssVariableTheme.shadows.lg,
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
