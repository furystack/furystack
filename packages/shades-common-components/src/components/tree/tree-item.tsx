import type { ChildrenList } from '@furystack/shades'
import { createComponent, Shade } from '@furystack/shades'
import { buildTransition, cssVariableTheme } from '../../services/css-variable-theme.js'
import type { FlattenedTreeNode, TreeService } from '../../services/tree-service.js'
import type { TreeItemState } from './tree.js'

export type TreeItemProps<T> = {
  item: T
  treeService: TreeService<T>
  nodeInfo: FlattenedTreeNode<T>
  isNew: boolean
  renderItem: (item: T, state: TreeItemState) => JSX.Element
  renderIcon?: (item: T, isExpanded: boolean) => JSX.Element
  onActivate?: (item: T) => void
}

const INDENT_PX = 20
const EXPAND_ICON_WIDTH = 20

export const TreeItem: <T>(props: TreeItemProps<T>, children: ChildrenList) => JSX.Element<any> = Shade({
  shadowDomName: 'shade-tree-item',
  css: {
    display: 'flex',
    alignItems: 'center',
    cursor: 'default',
    userSelect: 'none',
    padding: '4px 8px',
    gap: '6px',
    transition: buildTransition(
      ['opacity', cssVariableTheme.transitions.duration.fast, 'ease-out'],
      ['transform', cssVariableTheme.transitions.duration.fast, 'ease-out'],
      ['background-color', cssVariableTheme.transitions.duration.fast, 'ease'],
      ['box-shadow', cssVariableTheme.transitions.duration.fast, cssVariableTheme.transitions.easing.easeInOut],
    ),
    borderLeft: '3px solid transparent',
    '&.animate-in': {
      opacity: '0',
      transform: 'translateY(-6px)',
    },
    '&:not(.selected):hover': {
      backgroundColor: cssVariableTheme.action.hoverBackground,
    },
    '&.selected': {
      backgroundColor: cssVariableTheme.action.selectedBackground,
      borderLeft: `3px solid ${cssVariableTheme.palette.primary.main}`,
    },
    '&.focused': {
      boxShadow: `0 0 0 2px ${cssVariableTheme.palette.primary.main} inset`,
    },
  },
  render: ({ props, element, useObservable }) => {
    const { item, treeService, nodeInfo, isNew, renderItem, renderIcon, onActivate } = props
    const { level, hasChildren, isExpanded } = nodeInfo

    if (isNew) {
      element.classList.add('animate-in')
      requestAnimationFrame(() => element.classList.remove('animate-in'))
    }

    element.setAttribute('role', 'treeitem')
    element.setAttribute('aria-level', (level + 1).toString())
    if (hasChildren) {
      element.setAttribute('aria-expanded', isExpanded.toString())
    }

    element.onclick = (ev: MouseEvent) => {
      treeService.handleItemClick(item, ev)
    }

    element.ondblclick = () => {
      treeService.handleItemDoubleClick(item)
      if (!hasChildren) {
        onActivate?.(item)
      }
    }

    const updateSelectionState = (selection: unknown[]) => {
      const isSelected = selection.includes(item)
      element.classList.toggle('selected', isSelected)
      element.setAttribute('aria-selected', isSelected.toString())
    }

    const updateFocusState = (focusedItem?: unknown) => {
      const isFocused = focusedItem === item
      element.classList.toggle('focused', isFocused)

      if (isFocused) {
        const scrollContainer = element.closest('shade-tree') as HTMLElement
        if (scrollContainer) {
          const containerRect = scrollContainer.getBoundingClientRect()
          const itemRect = element.getBoundingClientRect()
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
      }
    }

    const [selection] = useObservable('selection', treeService.selection, {
      onChange: updateSelectionState,
    })
    updateSelectionState(selection)

    const [focusedItem] = useObservable('focusedItem', treeService.focusedItem, {
      onChange: updateFocusState,
    })
    updateFocusState(focusedItem)

    const isFocused = focusedItem === item
    const isSelected = selection.includes(item)
    const state: TreeItemState = { isFocused, isSelected, level, hasChildren, isExpanded }

    const handleExpandClick = (ev: MouseEvent) => {
      ev.stopPropagation()
      treeService.toggleExpanded(item)
    }

    return (
      <>
        <span style={{ width: `${level * INDENT_PX}px`, flexShrink: '0' }} />
        <span
          className="tree-item-expand"
          style={{
            width: `${EXPAND_ICON_WIDTH}px`,
            flexShrink: '0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: hasChildren ? 'pointer' : 'default',
          }}
          onclick={hasChildren ? handleExpandClick : undefined}
        >
          {hasChildren ? (
            <span
              style={{
                display: 'inline-block',
                transition: 'transform 0.2s ease',
                transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)',
              }}
            >
              ▸
            </span>
          ) : (
            ''
          )}
        </span>
        {renderIcon && <span className="tree-item-icon">{renderIcon(item, isExpanded)}</span>}
        <span className="tree-item-content" style={{ flex: '1' }}>
          {renderItem(item, state)}
        </span>
      </>
    )
  },
})
