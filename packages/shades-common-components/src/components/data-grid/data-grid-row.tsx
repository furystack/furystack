import type { ChildrenList } from '@furystack/shades'
import { attachStyles, createComponent, Shade } from '@furystack/shades'
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
  tagName: 'shades-data-grid-row',
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
    '&:not(.selected):hover': {
      backgroundColor: cssVariableTheme.action.hoverBackground,
    },
    '&.selected': {
      backgroundColor: cssVariableTheme.action.selectedBackground,
      borderLeft: `3px solid ${cssVariableTheme.palette.primary.main}`,
    },
    '&.focused': {
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

        const scrollContainer = element.closest('shade-data-grid') as HTMLElement
        if (!scrollContainer) return

        const headerHeight = element.closest('table')?.querySelector('th')?.getBoundingClientRect().height || 42
        const footerHeight =
          scrollContainer.querySelector('shade-data-grid-footer')?.getBoundingClientRect().height || 42

        // Use getBoundingClientRect for accurate visual positions
        const containerRect = scrollContainer.getBoundingClientRect()
        const rowRect = element.getBoundingClientRect()

        // Row position relative to container's visible area
        const rowTopInContainer = rowRect.top - containerRect.top
        const rowBottomInContainer = rowRect.bottom - containerRect.top

        // Scroll up if row is above visible area (below the sticky header)
        if (rowTopInContainer < headerHeight) {
          const scrollAdjustment = rowTopInContainer - headerHeight
          scrollContainer.scrollTo({
            top: scrollContainer.scrollTop + scrollAdjustment,
            behavior: 'smooth',
          })
        }
        // Scroll down if row is below visible area (above the footer)
        else if (rowBottomInContainer > scrollContainer.clientHeight - footerHeight) {
          const scrollAdjustment = rowBottomInContainer - (scrollContainer.clientHeight - footerHeight)
          scrollContainer.scrollTo({
            top: scrollContainer.scrollTop + scrollAdjustment,
            behavior: 'smooth',
          })
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
