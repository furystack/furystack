import type { ChildrenList, PartialElement } from '@furystack/shades'
import { createComponent, Shade } from '@furystack/shades'
import { ClickAwayService } from '../../services/click-away-service.js'
import { cssVariableTheme } from '../../services/css-variable-theme.js'

let nextListId = 0
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
  /**
   * Section name for spatial navigation scoping.
   * Sets `data-nav-section` on the list wrapper so that SpatialNavigationService
   * constrains arrow-key navigation within the list.
   * Auto-generated per instance when not provided.
   */
  navSection?: string
} & PartialElement<HTMLDivElement>

export const List: <T>(props: ListProps<T>, children: ChildrenList) => JSX.Element<any> = Shade({
  customElementName: 'shade-list',
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
  render: ({ props, useDisposable, useHostProps, useRef, useState }) => {
    const wrapperRef = useRef<HTMLDivElement>('listWrapper')
    const [navSectionId] = useState('navSectionId', String(nextListId++))

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
      window.addEventListener('keydown', listener, true)
      return { [Symbol.dispose]: () => window.removeEventListener('keydown', listener, true) }
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

    useDisposable('focus-coordination', () => {
      const handleFocusOut = (ev: FocusEvent) => {
        const wrapper = wrapperRef.current
        if (wrapper && (!ev.relatedTarget || !wrapper.contains(ev.relatedTarget as Node))) {
          props.listService.hasFocus.setValue(false)
        }
      }

      queueMicrotask(() => {
        const wrapper = wrapperRef.current
        if (wrapper) {
          wrapper.addEventListener('focusout', handleFocusOut)
        }
      })

      return {
        [Symbol.dispose]: () => {
          const wrapper = wrapperRef.current
          if (wrapper) {
            wrapper.removeEventListener('focusout', handleFocusOut)
          }
        },
      }
    })

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
          data-nav-section={props.navSection ?? `list-${navSectionId}`}
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
