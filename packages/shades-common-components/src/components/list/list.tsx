import type { ChildrenList, PartialElement } from '@furystack/shades'
import { createComponent, Shade } from '@furystack/shades'
import { ClickAwayService } from '../../services/click-away-service.js'
import { cssVariableTheme } from '../../services/css-variable-theme.js'
import type { ListService } from '../../services/list-service.js'
import { Pagination } from '../pagination.js'
import { ListItem } from './list-item.js'

export type ListItemState = {
  isFocused: boolean
  isSelected: boolean
}

export type ListPaginationProps = {
  /** Number of items to display per page */
  itemsPerPage: number
  /** Current page (1-indexed) */
  page: number
  /** Callback fired when the page changes */
  onPageChange: (page: number) => void
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
  /** Optional pagination configuration. When provided, items are sliced and a Pagination control is rendered. */
  pagination?: ListPaginationProps
} & PartialElement<HTMLDivElement>

export const List: <T>(props: ListProps<T>, children: ChildrenList) => JSX.Element<any> = Shade({
  shadowDomName: 'shade-list',
  css: {
    display: 'block',
    fontFamily: cssVariableTheme.typography.fontFamily,
    width: '100%',
    overflow: 'auto',
    '& .shade-list-pagination': {
      display: 'flex',
      justifyContent: 'center',
      padding: '8px 0',
    },
  },
  render: ({ props, useDisposable, useHostProps, useRef }) => {
    const wrapperRef = useRef<HTMLDivElement>('listWrapper')

    useDisposable('keydown-handler', () => {
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
      return { [Symbol.dispose]: () => window.removeEventListener('keydown', listener) }
    })

    const { pagination } = props
    let visibleItems: typeof props.items
    let pageCount = 1

    if (pagination) {
      const { itemsPerPage, page } = pagination
      pageCount = Math.ceil(props.items.length / itemsPerPage)
      const startIndex = (page - 1) * itemsPerPage
      visibleItems = props.items.slice(startIndex, startIndex + itemsPerPage)
    } else {
      visibleItems = props.items
    }

    props.listService.items.setValue(visibleItems)

    useDisposable(
      'clickAway',
      () =>
        new ClickAwayService(wrapperRef, () => {
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

    useHostProps({
      'data-variant': props.variant || undefined,
    })

    return (
      <>
        <div
          ref={wrapperRef}
          role="listbox"
          ariaMultiSelectable="true"
          className="shade-list-wrapper"
          onclick={() => props.listService.hasFocus.setValue(true)}
        >
          {visibleItems.map((item) => (
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
        {pagination && pageCount > 1 && (
          <div className="shade-list-pagination">
            <Pagination count={pageCount} page={pagination.page} onPageChange={pagination.onPageChange} size="small" />
          </div>
        )}
      </>
    )
  },
})
