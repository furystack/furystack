import type { ChildrenList } from '@furystack/shades'
import { createComponent, Shade } from '@furystack/shades'
import { cssVariableTheme } from '../../services/css-variable-theme.js'
import type { ListService } from '../../services/list-service.js'
import type { ListItemState } from './list.js'

export type ListItemProps<T> = {
  item: T
  listService: ListService<T>
  renderItem: (item: T, state: ListItemState) => JSX.Element
  renderIcon?: (item: T) => JSX.Element
  renderSecondaryActions?: (item: T) => JSX.Element[]
  onActivate?: (item: T) => void
}

export const ListItem: <T>(props: ListItemProps<T>, children: ChildrenList) => JSX.Element<any> = Shade({
  shadowDomName: 'shade-list-item',
  css: {
    display: 'flex',
    alignItems: 'center',
    cursor: 'default',
    userSelect: 'none',
    padding: `${cssVariableTheme.spacing.sm} ${cssVariableTheme.spacing.md}`,
    gap: cssVariableTheme.spacing.sm,
    transition: `background-color ${cssVariableTheme.transitions.duration.fast} ease, box-shadow ${cssVariableTheme.transitions.duration.fast} ${cssVariableTheme.transitions.easing.easeInOut}`,
    borderLeft: '3px solid transparent',
    '&:not([data-selected]):hover': {
      backgroundColor: cssVariableTheme.action.hoverBackground,
    },
    '&[data-selected]': {
      backgroundColor: cssVariableTheme.action.selectedBackground,
      borderLeft: `3px solid ${cssVariableTheme.palette.primary.main}`,
    },
    '&[data-focused]': {
      boxShadow: `0 0 0 2px ${cssVariableTheme.palette.primary.main} inset`,
    },
  },
  render: ({ props, useObservable, useHostProps, useRef }) => {
    const { item, listService, renderItem, renderIcon, renderSecondaryActions, onActivate } = props

    const [selection] = useObservable('selection', listService.selection)
    const [focusedItem] = useObservable('focusedItem', listService.focusedItem)

    const isFocused = focusedItem === item
    const isSelected = selection.includes(item)

    useHostProps({
      role: 'option',
      'aria-selected': isSelected.toString(),
      onclick: (ev: MouseEvent) => {
        listService.handleItemClick(item, ev)
      },
      ondblclick: () => {
        listService.handleItemDoubleClick(item)
        onActivate?.(item)
      },
      ...(isSelected ? { 'data-selected': '' } : {}),
      ...(isFocused ? { 'data-focused': '' } : {}),
    })

    const wrapperRef = useRef<HTMLElement>('wrapper')

    if (isFocused) {
      queueMicrotask(() => {
        const el = wrapperRef.current
        if (!el) return
        const scrollContainer = el.closest('shade-list') as HTMLElement
        if (scrollContainer) {
          const containerRect = scrollContainer.getBoundingClientRect()
          const hostEl = el.closest('shade-list-item') as HTMLElement
          if (!hostEl) return
          const itemRect = hostEl.getBoundingClientRect()
          const itemTopInContainer = itemRect.top - containerRect.top
          const itemBottomInContainer = itemRect.bottom - containerRect.top

          if (itemTopInContainer < 0) {
            scrollContainer.scrollTo({
              top: scrollContainer.scrollTop + itemTopInContainer,
              behavior: 'smooth',
            })
          } else if (itemBottomInContainer > scrollContainer.clientHeight) {
            scrollContainer.scrollTo({
              top: scrollContainer.scrollTop + (itemBottomInContainer - scrollContainer.clientHeight),
              behavior: 'smooth',
            })
          }
        }
      })
    }
    const state: ListItemState = { isFocused, isSelected }

    return (
      <span ref={wrapperRef} style={{ display: 'contents' }}>
        {renderIcon && <span className="list-item-icon">{renderIcon(item)}</span>}
        <span className="list-item-content" style={{ flex: '1' }}>
          {renderItem(item, state)}
        </span>
        {renderSecondaryActions && (
          <span className="list-item-actions" style={{ display: 'flex', gap: cssVariableTheme.spacing.xs }}>
            {renderSecondaryActions(item).map((action) => action)}
          </span>
        )}
      </span>
    )
  },
})
