import type { FindOptions } from '@furystack/core'
import type { ChildrenList } from '@furystack/shades'
import { createComponent, Shade } from '@furystack/shades'
import { ClickAwayService } from '../../services/click-away-service.js'
import type { CollectionService } from '../../services/collection-service.js'
import { cssVariableTheme } from '../../services/css-variable-theme.js'
import type { GridProps } from '../grid.js'
import { DataGridBody } from './body.js'
import { DataGridFooter } from './footer.js'
import { DataGridHeader } from './header.js'

export type StringFilterConfig = { type: 'string' }
export type NumberFilterConfig = { type: 'number' }
export type BooleanFilterConfig = { type: 'boolean' }
export type EnumFilterConfig = {
  type: 'enum'
  values: Array<{ label: string; value: string }>
}
export type DateFilterConfig = { type: 'date' }

export type ColumnFilterConfig =
  | StringFilterConfig
  | NumberFilterConfig
  | BooleanFilterConfig
  | EnumFilterConfig
  | DateFilterConfig

/**
 * Loosely typed find options used internally by filter components.
 * Avoids generic entity types while supporting dynamic field access
 * with explicit casts at each use site.
 */
export type FilterableFindOptions = {
  top?: number
  skip?: number
  order?: Record<string, 'ASC' | 'DESC'>
  filter?: Record<string, unknown>
  select?: string[]
}

export type DataHeaderCells<Column extends string> = {
  [TKey in Column | 'default']?: (name: Column) => JSX.Element
}
export type DataRowCells<T, Column extends string> = {
  [TKey in Column | 'default']?: (element: T, state: { focus?: T; selection: T[] }) => JSX.Element
}

export interface DataGridProps<T, Column extends string> {
  /**
   * A list of columns to display
   */
  columns: Column[]
  /**
   * Optional style overrides for the grid
   */
  styles?: GridProps<T, Column>['styles']
  /**
   * A collection service to use for data source
   */
  collectionService: CollectionService<T>
  /**
   * The query settings to use for the data source
   */
  findOptions: FindOptions<T, Array<keyof T>>

  /**
   * Callback invoked when find options change (e.g. pagination, sorting, filtering)
   */
  onFindOptionsChange: (options: FindOptions<T, Array<keyof T>>) => void

  /**
   * A list of custom header components to use
   */
  headerComponents?: DataHeaderCells<Column>
  /**
   * A list of custom row components to use
   */
  rowComponents?: DataRowCells<T, Column>

  /**
   * Filter configuration per column. Only columns with a config will show a filter button.
   */
  columnFilters?: { [K in Column]?: ColumnFilterConfig }

  /**
   * Optional autoFocus property to set the grid as focused
   */
  autofocus?: boolean
  /**
   * Optional style to attach to grid rows when the row is focused
   */
  focusedRowStyle?: Partial<CSSStyleDeclaration>
  /**
   * Optional style to attach to grid rows when the row is not focused
   */
  unfocusedRowStyle?: Partial<CSSStyleDeclaration>
  /**
   * Optional style to attach to grid rows when the row is selected
   */
  selectedRowStyle?: Partial<CSSStyleDeclaration>
  /**
   * Optional style to attach to grid rows when the row is not selected
   */
  unselectedRowStyle?: Partial<CSSStyleDeclaration>

  /**
   * An optional component to show if there are no rows to display
   */
  emptyComponent?: JSX.Element

  /**
   * An optional component to show while the data is loading
   */
  loaderComponent?: JSX.Element

  /**
   * Custom list of items-per-page options shown in the footer selector.
   * When only one option is provided, the selector is hidden.
   * @default dataGridItemsPerPage ([10, 20, 25, 50, 100, Infinity])
   */
  paginationOptions?: number[]
}

export const DataGrid: <T, Column extends string>(
  props: DataGridProps<T, Column>,
  children: ChildrenList,
) => JSX.Element<any> = Shade({
  shadowDomName: 'shade-data-grid',
  css: {
    display: 'block',
    fontFamily: cssVariableTheme.typography.fontFamily,
    width: '100%',
    height: '100%',
    overflow: 'auto',
    zIndex: '1',
    '& table': {
      width: '100%',
      maxHeight: 'calc(100% - 4em)',
      position: 'relative',
      borderCollapse: 'collapse',
    },
    '& th': {
      backdropFilter: 'blur(12px) saturate(180%)',
      background: cssVariableTheme.action.activeBackground,
      color: cssVariableTheme.text.secondary,
      height: '36px',
      padding: '0 0.6em',
      alignItems: 'center',
      top: '0',
      position: 'sticky',
      fontSize: '0.75rem',
      fontWeight: cssVariableTheme.typography.fontWeight.semibold,
      letterSpacing: '0.03em',
      textAlign: 'left',
      zIndex: '1',
      borderBottom: `1px solid ${cssVariableTheme.action.subtleBorder}`,
      borderRight: `1px solid ${cssVariableTheme.action.subtleBorder}`,
    },
  },
  render: ({ props, useDisposable, useRef, useHostProps }) => {
    const wrapperRef = useRef<HTMLDivElement>('gridWrapper')

    useDisposable('keydown-handler', () => {
      const listener = (ev: KeyboardEvent) => props.collectionService.handleKeyDown(ev)
      window.addEventListener('keydown', listener)
      return { [Symbol.dispose]: () => window.removeEventListener('keydown', listener) }
    })

    useDisposable(
      'clickAway',
      () =>
        new ClickAwayService(wrapperRef, () => {
          props.collectionService.hasFocus.setValue(false)
        }),
    )

    if (props.styles?.wrapper) {
      useHostProps({ style: props.styles.wrapper as Record<string, string> })
    }

    return (
      <div
        ref={wrapperRef}
        className="shade-grid-wrapper"
        onclick={() => {
          props.collectionService.hasFocus.setValue(true)
        }}
        ariaMultiSelectable="true"
      >
        <table>
          <thead>
            <tr>
              {props.columns.map((column) => {
                return (
                  <th style={props.styles?.header}>
                    {props.headerComponents?.[column]?.(column) || props.headerComponents?.default?.(column) || (
                      <DataGridHeader<
                        ReturnType<typeof props.collectionService.data.getValue>['entries'][number],
                        typeof column
                      >
                        field={column}
                        findOptions={props.findOptions}
                        onFindOptionsChange={props.onFindOptionsChange}
                        filterConfig={props.columnFilters?.[column]}
                      />
                    )}
                  </th>
                )
              })}
            </tr>
          </thead>
          <DataGridBody
            columns={props.columns}
            service={props.collectionService}
            rowComponents={props.rowComponents}
            onRowClick={(entry, ev) => props.collectionService.handleRowClick(entry, ev)}
            onRowDoubleClick={(entry) => props.collectionService.handleRowDoubleClick(entry)}
            style={props.styles?.cell}
            focusedRowStyle={props.focusedRowStyle}
            selectedRowStyle={props.selectedRowStyle}
            unfocusedRowStyle={props.unfocusedRowStyle}
            unselectedRowStyle={props.unselectedRowStyle}
            emptyComponent={props.emptyComponent}
            loaderComponent={props.loaderComponent}
          />
        </table>
        <DataGridFooter
          service={props.collectionService}
          findOptions={props.findOptions}
          onFindOptionsChange={props.onFindOptionsChange}
          paginationOptions={props.paginationOptions}
        />
      </div>
    )
  },
})
