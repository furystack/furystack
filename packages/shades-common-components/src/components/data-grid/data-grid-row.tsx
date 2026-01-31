import type { ChildrenList } from '@furystack/shades'
import { attachStyles, createComponent, Shade } from '@furystack/shades'
import type { CollectionService } from '../../services/collection-service.js'
import type { DataRowCells } from './data-grid.js'

export interface DataGridRowProps<T, Column extends string> {
  entry: T
  columns: Column[]
  service: CollectionService<T>
  rowComponents?: DataRowCells<T, Column>
  onRowClick?: (row: T, event: MouseEvent) => void
  onRowDoubleClick?: (row: T, event: MouseEvent) => void
  focusedRowStyle?: Partial<CSSStyleDeclaration>
  selectedRowStyle?: Partial<CSSStyleDeclaration>
  unfocusedRowStyle?: Partial<CSSStyleDeclaration>
  unselectedRowStyle?: Partial<CSSStyleDeclaration>
}

export const DataGridRow: <T, Column extends string>(
  props: DataGridRowProps<T, Column>,
  children: ChildrenList,
) => JSX.Element<any> = Shade({
  shadowDomName: 'shades-data-grid-row',
  css: {
    display: 'table-row',
    cursor: 'default',
    userSelect: 'none',
    transition: 'background-color 0.15s ease, box-shadow 0.15s ease-in-out, transform 0.15s ease-in-out',
    borderLeft: '3px solid transparent',
    '&:not(.selected):hover': {
      backgroundColor: 'rgba(128, 128, 128, 0.08)',
    },
    '&.selected': {
      backgroundColor: 'rgba(128, 128, 128, 0.15)',
      borderLeft: '3px solid var(--shades-theme-palette-primary-main)',
    },
    '&.focused': {
      boxShadow: '0 0 0 2px var(--shades-theme-palette-primary-main) inset, 0 2px 8px 0px rgba(0,0,0,0.15)',
      fontWeight: '500',
      transform: 'scale(1.002)',
    },
    '& td': {
      padding: '0.75em 1.2em',
      borderBottom: '1px solid rgba(128, 128, 128, 0.1)',
      verticalAlign: 'middle',
      fontSize: '0.875rem',
      lineHeight: '1.5',
    },
  },
  render: ({ props, element, useObservable }) => {
    const { entry, rowComponents, columns, service } = props

    const updateSelectionState = (selection: unknown[]) => {
      const isSelected = selection.includes(entry)
      element.classList.toggle('selected', isSelected)
      element.setAttribute('aria-selected', isSelected.toString())

      if (props.selectedRowStyle && isSelected) {
        attachStyles(element, { style: props.selectedRowStyle })
      } else if (props.unselectedRowStyle && !isSelected) {
        attachStyles(element, { style: props.unselectedRowStyle })
      }
    }

    const updateFocusState = (focusedEntry?: unknown) => {
      const isFocused = focusedEntry === entry
      element.classList.toggle('focused', isFocused)

      if (isFocused) {
        if (props.focusedRowStyle) {
          attachStyles(element, { style: props.focusedRowStyle })
        }

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
      } else if (props.unfocusedRowStyle) {
        attachStyles(element, { style: props.unfocusedRowStyle })
      }
    }

    const [selection] = useObservable('isSelected', service.selection, {
      onChange: updateSelectionState,
    })
    updateSelectionState(selection)

    const [focus] = useObservable('focus', service.focusedEntry, {
      onChange: updateFocusState,
    })
    updateFocusState(focus)

    return (
      <>
        {columns.map((column) => (
          <td onclick={(ev) => props.onRowClick?.(entry, ev)} ondblclick={(ev) => props.onRowDoubleClick?.(entry, ev)}>
            {rowComponents?.[column]?.(entry, { selection, focus }) ||
              rowComponents?.default?.(entry, { selection, focus }) || (
                <span>
                  {typeof entry === 'object' && entry && column in entry
                    ? (entry as Record<typeof column, unknown>)[column]
                    : null}
                </span>
              )}
          </td>
        ))}
      </>
    )
  },
})
