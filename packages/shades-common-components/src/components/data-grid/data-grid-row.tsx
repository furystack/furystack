import type { ChildrenList } from '@furystack/shades'
import { attachStyles, createComponent, Shade } from '@furystack/shades'
import { ThemeProviderService } from '../../services'
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

export const DataGridRow: <T>(props: DataGridRowProps<T>, children: ChildrenList) => JSX.Element<any> = Shade<
  DataGridRowProps<any>
>({
  shadowDomName: 'shades-data-grid-row',

  render: ({ props, element, useObservable, injector }) => {
    const { entry, rowComponents, columns, service } = props

    const { theme } = injector.getInstance(ThemeProviderService)

    const attachSelectedStyles = (selection: any[]) => {
      if (selection.includes(entry)) {
        element.classList.add('selected')
        attachStyles(element, { style: props.selectedRowStyle || { backgroundColor: theme.background.default } })
        element.setAttribute('aria-selected', 'true')
      } else {
        element.classList.remove('selected')
        attachStyles(element, { style: props.unselectedRowStyle || { backgroundColor: 'transparent' } })
        element.setAttribute('aria-selected', 'false')
      }
    }

    const [selection] = useObservable('isSelected', service.selection, attachSelectedStyles, true)

    attachSelectedStyles(selection)

    const [focus] = useObservable(
      'focus',
      service.focusedEntry,
      (newEntry) => {
        if (newEntry === props.entry) {
          attachStyles(element, {
            style: props.focusedRowStyle || {
              boxShadow: `0 0 0 1px ${theme.palette.primary.main}`,
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
            element.closest('shade-data-grid')?.querySelector('shade-data-grid-footer')?.getBoundingClientRect()
              .height || 42
          const visibleMaxTop = parent.clientHeight - footerHeight
          const desiredMaxTop = element.offsetTop + element.clientHeight
          if (desiredMaxTop > visibleMaxTop) {
            parent.scrollTo({ top: desiredMaxTop - visibleMaxTop, behavior: 'smooth' })
          }
        } else {
          element.classList.remove('focused')
          attachStyles(element, {
            style: props.unfocusedRowStyle || {
              boxShadow: 'none',
              fontWeight: 'inherit',
            },
          })
        }
      },
      true,
    )

    element.style.display = 'table-row'
    element.style.cursor = 'default'
    element.style.userSelect = 'none'
    if (selection?.includes(entry)) {
      element.setAttribute('aria-selected', 'true')
      element.classList.add('selected')
    }

    if (focus === entry) {
      element.classList.add('focused')
    }
    element.setAttribute('aria-selected', selection?.includes(entry).toString() || 'false')

    return (
      <>
        {columns.map((column) => (
          <td
            style={{ padding: '0.5em' }}
            onclick={(ev) => props.onRowClick?.(entry, ev)}
            ondblclick={(ev) => props.onRowDoubleClick?.(entry, ev)}
          >
            {rowComponents?.[column]?.(entry, { selection, focus }) ||
              rowComponents?.default?.(entry, { selection, focus }) || <span>{entry[column]}</span>}
          </td>
        ))}
      </>
    )
  },
})
