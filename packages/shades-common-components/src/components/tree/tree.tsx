import type { ChildrenList, PartialElement } from '@furystack/shades'
import { createComponent, Shade } from '@furystack/shades'
import { ObservableValue } from '@furystack/utils'
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
  render: ({ props, useDisposable, useObservable, useHostProps }) => {
    useDisposable('keydown-handler', () => {
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
      return { [Symbol.dispose]: () => window.removeEventListener('keydown', listener) }
    })

    if (props.treeService.rootItems.getValue() !== props.rootItems) {
      props.treeService.rootItems.setValue(props.rootItems)
      props.treeService.updateFlattenedNodes()
    }

    const treeInstanceId = useDisposable('treeInstanceId', () => ({
      value: Math.random().toString(36).slice(2),
      [Symbol.dispose]() {},
    }))

    useDisposable('clickAway', () => {
      const listener = (ev: MouseEvent) => {
        const isInside = ev
          .composedPath()
          .some((el) => el instanceof HTMLElement && el.dataset.treeInstanceId === treeInstanceId.value)
        if (!isInside) {
          props.treeService.hasFocus.setValue(false)
        }
      }
      window.addEventListener('click', listener, true)
      return { [Symbol.dispose]: () => window.removeEventListener('click', listener, true) }
    })

    if (props.onSelectionChange) {
      const { onSelectionChange } = props
      useDisposable('selectionChangeCallback', () =>
        props.treeService.selection.subscribe((newSelection) => {
          onSelectionChange(newSelection)
        }),
      )
    }

    useHostProps({
      'data-variant': props.variant || undefined,
      'data-tree-instance-id': treeInstanceId.value,
      role: 'tree',
      'aria-multiselectable': 'true',
      onclick: () => props.treeService.hasFocus.setValue(true),
    })

    const [flattenedNodes] = useObservable('flattenedNodes', props.treeService.flattenedNodes)

    const previousItemsRef = useDisposable('previousTreeItems', () => new ObservableValue<Set<unknown>>(new Set()))
    const previousItems = previousItemsRef.getValue()
    const currentItems = new Set<unknown>(flattenedNodes.map((n) => n.item))
    previousItemsRef.setValue(currentItems)

    return (
      <>
        {flattenedNodes.map((nodeInfo) => (
          <TreeItem
            item={nodeInfo.item}
            treeService={props.treeService}
            nodeInfo={nodeInfo}
            isNew={!previousItems.has(nodeInfo.item)}
            renderItem={props.renderItem}
            renderIcon={props.renderIcon}
            onActivate={props.onItemActivate}
          />
        ))}
      </>
    )
  },
})
