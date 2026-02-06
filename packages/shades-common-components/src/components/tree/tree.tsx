import type { ChildrenList, PartialElement } from '@furystack/shades'
import { createComponent, Shade } from '@furystack/shades'
import { ClickAwayService } from '../../services/click-away-service.js'
import type { TreeService } from '../../services/tree-service.js'
import { TreeItem } from './tree-item.js'

export type TreeItemState = {
  isFocused: boolean
  isSelected: boolean
  level: number
  hasChildren: boolean
  isExpanded: boolean
}

export type TreeProps<T> = {
  rootItems: T[]
  treeService: TreeService<T>
  renderItem: (item: T, state: TreeItemState) => JSX.Element
  renderIcon?: (item: T, isExpanded: boolean) => JSX.Element
  variant?: 'contained' | 'outlined'
  onItemActivate?: (item: T) => void
  onSelectionChange?: (selected: T[]) => void
} & PartialElement<HTMLDivElement>

export const Tree: <T>(props: TreeProps<T>, children: ChildrenList) => JSX.Element<any> = Shade({
  shadowDomName: 'shade-tree',
  css: {
    display: 'block',
    width: '100%',
    overflow: 'auto',
  },
  constructed: ({ props }) => {
    const listener = (ev: KeyboardEvent) => {
      props.treeService.handleKeyDown(ev)

      if (ev.key === 'Enter' && props.treeService.hasFocus.getValue()) {
        const focusedItem = props.treeService.focusedItem.getValue()
        if (focusedItem && props.onItemActivate) {
          props.onItemActivate(focusedItem)
        }
      }
    }
    window.addEventListener('keydown', listener)
    return () => window.removeEventListener('keydown', listener)
  },
  render: ({ props, useDisposable, useObservable, element }) => {
    if (props.treeService.rootItems.getValue() !== props.rootItems) {
      props.treeService.rootItems.setValue(props.rootItems)
      props.treeService.updateFlattenedNodes()
    }

    useDisposable(
      'clickAway',
      () =>
        new ClickAwayService(element, () => {
          props.treeService.hasFocus.setValue(false)
        }),
    )

    if (props.onSelectionChange) {
      const { onSelectionChange } = props
      useDisposable('selectionChangeCallback', () =>
        props.treeService.selection.subscribe((newSelection) => {
          onSelectionChange(newSelection)
        }),
      )
    }

    if (props.variant) {
      element.setAttribute('data-variant', props.variant)
    }

    const [flattenedNodes] = useObservable('flattenedNodes', props.treeService.flattenedNodes)

    return (
      <div
        role="tree"
        ariaMultiSelectable="true"
        className="shade-tree-wrapper"
        onclick={() => props.treeService.hasFocus.setValue(true)}
      >
        {flattenedNodes.map((nodeInfo) => (
          <TreeItem
            item={nodeInfo.item}
            treeService={props.treeService}
            nodeInfo={nodeInfo}
            renderItem={props.renderItem}
            renderIcon={props.renderIcon}
            onActivate={props.onItemActivate}
          />
        ))}
      </div>
    )
  },
})
