import type { ChildrenList } from '@furystack/shades'
import { createComponent, Shade } from '@furystack/shades'
import type { CollectionService } from '../../services/collection-service.js'
import { buildTransition, cssVariableTheme } from '../../services/css-variable-theme.js'
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
    transition: buildTransition(
      ['background-color', cssVariableTheme.transitions.duration.fast, 'ease'],
      ['box-shadow', cssVariableTheme.transitions.duration.fast, cssVariableTheme.transitions.easing.easeInOut],
      ['transform', cssVariableTheme.transitions.duration.fast, cssVariableTheme.transitions.easing.easeInOut],
    ),
    borderLeft: '3px solid transparent',
    '&:not([data-selected]):hover': {
      backgroundColor: cssVariableTheme.action.hoverBackground,
    },
    '&[data-selected]': {
      backgroundColor: cssVariableTheme.action.selectedBackground,
      borderLeft: `3px solid ${cssVariableTheme.palette.primary.main}`,
    },
    '&[data-focused]': {
      boxShadow: `0 0 0 2px ${cssVariableTheme.palette.primary.main} inset, 0 2px 8px 0px rgba(0,0,0,0.15)`,
      fontWeight: '500',
      transform: 'scale(1.002)',
    },
    '& td': {
      padding: '0.75em 1.2em',
      borderBottom: `1px solid ${cssVariableTheme.action.subtleBorder}`,
      verticalAlign: 'middle',
      fontSize: '0.875rem',
      lineHeight: '1.5',
    },
  },
  render: ({ props, useObservable, useHostProps, useRef }) => {
    const { entry, rowComponents, columns, service } = props

    const [selection] = useObservable('isSelected', service.selection)
    const [focus] = useObservable('focus', service.focusedEntry)

    const isSelected = selection.includes(entry)
    const isFocused = focus === entry

    const rowStyle: Record<string, string> = {}
    if (props.selectedRowStyle && isSelected) {
      Object.assign(rowStyle, props.selectedRowStyle)
    } else if (props.unselectedRowStyle && !isSelected) {
      Object.assign(rowStyle, props.unselectedRowStyle)
    }
    if (isFocused && props.focusedRowStyle) {
      Object.assign(rowStyle, props.focusedRowStyle)
    } else if (!isFocused && props.unfocusedRowStyle) {
      Object.assign(rowStyle, props.unfocusedRowStyle)
    }

    useHostProps({
      'aria-selected': isSelected.toString(),
      ...(isSelected ? { 'data-selected': '' } : {}),
      ...(isFocused ? { 'data-focused': '' } : {}),
      ...(Object.keys(rowStyle).length > 0 ? { style: rowStyle } : {}),
    })

    const wrapperRef = useRef<HTMLElement>('wrapper')

    if (isFocused) {
      queueMicrotask(() => {
        const el = wrapperRef.current
        if (!el) return
        const hostEl = el.closest('shades-data-grid-row') as HTMLElement
        if (!hostEl) return
        const scrollContainer = hostEl.closest('shade-data-grid') as HTMLElement
        if (!scrollContainer) return

        const headerHeight = hostEl.closest('table')?.querySelector('th')?.getBoundingClientRect().height || 42
        const footerHeight =
          scrollContainer.querySelector('shade-data-grid-footer')?.getBoundingClientRect().height || 42

        const containerRect = scrollContainer.getBoundingClientRect()
        const rowRect = hostEl.getBoundingClientRect()

        const rowTopInContainer = rowRect.top - containerRect.top
        const rowBottomInContainer = rowRect.bottom - containerRect.top

        if (rowTopInContainer < headerHeight) {
          const scrollAdjustment = rowTopInContainer - headerHeight
          scrollContainer.scrollTo({
            top: scrollContainer.scrollTop + scrollAdjustment,
            behavior: 'smooth',
          })
        } else if (rowBottomInContainer > scrollContainer.clientHeight - footerHeight) {
          const scrollAdjustment = rowBottomInContainer - (scrollContainer.clientHeight - footerHeight)
          scrollContainer.scrollTo({
            top: scrollContainer.scrollTop + scrollAdjustment,
            behavior: 'smooth',
          })
        }
      })
    }

    return (
      <>
        {columns.map((column, colIdx) => (
          <td
            {...(colIdx === 0 ? { ref: wrapperRef } : {})}
            onclick={(ev) => props.onRowClick?.(entry, ev)}
            ondblclick={(ev) => props.onRowDoubleClick?.(entry, ev)}
          >
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
