import type { ChildrenList } from '@furystack/shades'
import { attachStyles, createComponent, Shade } from '@furystack/shades'
import type { CollectionService } from '../../services/collection-service'
import type { DataRowCells } from './data-grid'

export interface DataGridRowProps<T> {
  entry: T
  columns: Array<keyof T>
  service: CollectionService<T>
  rowComponents?: DataRowCells<T>
  onRowClick?: (row: T, event: MouseEvent) => void
  onRowDoubleClick?: (row: T, event: MouseEvent) => void
  focusedRowStyle?: Partial<CSSStyleDeclaration>
  selectedRowStyle?: Partial<CSSStyleDeclaration>
  unfocusedRowStyle?: Partial<CSSStyleDeclaration>
  unselectedRowStyle?: Partial<CSSStyleDeclaration>
}

export interface DataGridRowState<T> {
  selection?: T[]
  focus?: T
}

export const DataGridRow: <T>(props: DataGridRowProps<T>, children: ChildrenList) => JSX.Element<any, any> = Shade<
  DataGridRowProps<any>,
  DataGridRowState<any>
>({
  getInitialState: ({ props }) => ({
    focus: props.service.focusedEntry.getValue(),
    selection: props.service.selection.getValue(),
  }),
  shadowDomName: 'shades-data-grid-row',
  resources: ({ props, element }) => [
    props.service.focusedEntry.subscribe((newEntry) => {
      if (newEntry === props.entry) {
        attachStyles(element, {
          style: props.focusedRowStyle || {
            filter: 'brightness(1.5)',
            fontWeight: 'bolder',
          },
        })

        element.classList.add('focused')

        const headerHeight = element.closest('table')?.querySelector('th')?.getBoundingClientRect().height || 42

        const parent = element.closest('.shade-grid-wrapper') as HTMLElement
        const maxTop = element.offsetTop - headerHeight
        const currentTop = parent.scrollTop
        if (maxTop < currentTop) {
          parent.scrollTo({ top: maxTop, behavior: 'smooth' })
        }

        const footerHeight =
          element.closest('shade-data-grid')?.querySelector('shade-data-grid-footer')?.getBoundingClientRect().height ||
          42
        const visibleMaxTop = parent.clientHeight - footerHeight
        const desiredMaxTop = element.offsetTop + element.clientHeight
        if (desiredMaxTop > visibleMaxTop) {
          parent.scrollTo({ top: desiredMaxTop - visibleMaxTop, behavior: 'smooth' })
        }
      } else {
        element.classList.remove('focused')
        attachStyles(element, {
          style: props.unfocusedRowStyle || {
            filter: 'brightness(1)',
            fontWeight: 'inherit',
          },
        })
      }
    }, true),
    props.service.selection.subscribe((selection) => {
      if (selection.includes(props.entry)) {
        element.classList.add('selected')
        attachStyles(element, { style: props.selectedRowStyle || { backgroundColor: 'rgba(128,128,128,0.1)' } })
        element.setAttribute('aria-selected', 'true')
      } else {
        element.classList.remove('selected')
        attachStyles(element, { style: props.unselectedRowStyle || { backgroundColor: 'transparent' } })
        element.setAttribute('aria-selected', 'false')
      }
    }, true),
  ],

  render: ({ getState, props, element }) => {
    const state = getState()
    const { entry, rowComponents, columns } = props
    element.style.display = 'table-row'
    element.style.cursor = 'default'
    element.style.userSelect = 'none'
    if (state.selection?.includes(entry)) {
      element.setAttribute('aria-selected', 'true')
      element.classList.add('selected')
    }

    if (state.focus === entry) {
      element.classList.add('focused')
    }
    element.setAttribute('aria-selected', state.selection?.includes(entry).toString() || 'false')

    return (
      <>
        {columns.map((column) => (
          <td
            style={{ padding: '0.5em' }}
            onclick={(ev) => props.onRowClick?.(entry, ev)}
            ondblclick={(ev) => props.onRowDoubleClick?.(entry, ev)}
          >
            {rowComponents?.[column]?.(entry, state) || rowComponents?.default?.(entry, state) || (
              <span>{entry[column]}</span>
            )}
          </td>
        ))}
      </>
    )
  },
})
