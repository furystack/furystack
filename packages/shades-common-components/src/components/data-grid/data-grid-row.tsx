import { ChildrenList, createComponent, createFragment, Shade } from '@furystack/shades'
import { CollectionService } from '../../services/collection-service'
import { DataRowCells } from './data-grid'

export interface DataGridRowProps<T> {
  entry: T
  columns: Array<keyof T>
  service: CollectionService<T>
  rowComponents?: DataRowCells<T>
  onRowClick?: (row: T, event: MouseEvent) => void
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
        element.style.filter = 'brightness(1.5)'
        element.style.fontWeight = 'bolder'

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
        const visibleMaxTop = parent.clientHeight - footerHeight // parent.getBoundingClientRect().height - footerHeight - headerHeight
        const desiredMaxTop = element.offsetTop + element.clientHeight
        if (desiredMaxTop > visibleMaxTop) {
          parent.scrollTo({ top: desiredMaxTop - visibleMaxTop, behavior: 'smooth' })
        }

        // ;(element as any).scrollIntoView({ inline: 'nearest', block: 'nearest', behavior: 'smooth' })
      } else {
        element.style.filter = 'brightness(1)'
        element.style.fontWeight = 'inherit'
      }
    }),
    props.service.selection.subscribe((selection) => {
      if (selection.includes(props.entry)) {
        element.style.background = 'rgba(128,128,128,0.1)'
      } else {
        element.style.background = 'none'
      }
    }),
  ],

  render: ({ getState, props, element }) => {
    const state = getState()
    const { entry, rowComponents, columns } = props
    element.style.display = 'table-row'
    element.style.cursor = 'default'
    element.style.userSelect = 'none'
    return (
      <>
        {columns.map((column) => (
          <td style={{ padding: '0.5em' }} onclick={(ev) => props.onRowClick?.(entry, ev)}>
            {rowComponents?.[column]?.(entry, state) || rowComponents?.default?.(entry, state) || (
              <span>{entry[column]}</span>
            )}
          </td>
        ))}
      </>
    )
  },
})
