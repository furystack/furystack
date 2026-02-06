import type { ChildrenList, PartialElement } from '@furystack/shades'
import { createComponent, Shade } from '@furystack/shades'
import { ClickAwayService } from '../../services/click-away-service.js'
import type { ListService } from '../../services/list-service.js'
import { ListItem } from './list-item.js'

export type ListItemState = {
  isFocused: boolean
  isSelected: boolean
}

export type ListProps<T> = {
  items: T[]
  listService: ListService<T>
  renderItem: (item: T, state: ListItemState) => JSX.Element
  renderIcon?: (item: T) => JSX.Element
  renderSecondaryActions?: (item: T) => JSX.Element[]
  variant?: 'contained' | 'outlined'
  onItemActivate?: (item: T) => void
  onSelectionChange?: (selected: T[]) => void
} & PartialElement<HTMLDivElement>

export const List: <T>(props: ListProps<T>, children: ChildrenList) => JSX.Element<any> = Shade({
  shadowDomName: 'shade-list',
  css: {
    display: 'block',
    width: '100%',
    overflow: 'auto',
  },
  constructed: ({ props }) => {
    const listener = (ev: KeyboardEvent) => {
      props.listService.handleKeyDown(ev)

      if (ev.key === 'Enter' && props.listService.hasFocus.getValue()) {
        const focusedItem = props.listService.focusedItem.getValue()
        if (focusedItem && props.onItemActivate) {
          props.onItemActivate(focusedItem)
        }
      }
    }
    window.addEventListener('keydown', listener)
    return () => window.removeEventListener('keydown', listener)
  },
  render: ({ props, useDisposable, element }) => {
    props.listService.items.setValue(props.items)

    useDisposable(
      'clickAway',
      () =>
        new ClickAwayService(element, () => {
          props.listService.hasFocus.setValue(false)
        }),
    )

    if (props.onSelectionChange) {
      const { onSelectionChange } = props
      useDisposable('selectionChangeCallback', () =>
        props.listService.selection.subscribe((newSelection) => {
          onSelectionChange(newSelection)
        }),
      )
    }

    if (props.variant) {
      element.setAttribute('data-variant', props.variant)
    }

    return (
      <div
        role="listbox"
        ariaMultiSelectable="true"
        className="shade-list-wrapper"
        onclick={() => props.listService.hasFocus.setValue(true)}
      >
        {props.items.map((item) => (
          <ListItem
            item={item}
            listService={props.listService}
            renderItem={props.renderItem}
            renderIcon={props.renderIcon}
            renderSecondaryActions={props.renderSecondaryActions}
            onActivate={props.onItemActivate}
          />
        ))}
      </div>
    )
  },
})
