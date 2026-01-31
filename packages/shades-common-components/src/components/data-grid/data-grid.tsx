import type { FindOptions } from '@furystack/core'
import type { ChildrenList } from '@furystack/shades'
import { attachStyles, createComponent, Shade } from '@furystack/shades'
import type { ObservableValue } from '@furystack/utils'
import { ClickAwayService } from '../../services/click-away-service.js'
import { cssVariableTheme } from '../../services/css-variable-theme.js'
import type { CollectionService } from '../../services/collection-service.js'
import type { GridProps } from '../grid.js'
import { DataGridBody } from './body.js'
import { DataGridFooter } from './footer.js'
import { DataGridHeader } from './header.js'

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
  styles: GridProps<T, Column>['styles']
  /**
   * A collection service to use for data source
   */
  collectionService: CollectionService<T>
  /**
   * The query settings to use for the data source
   */
  findOptions: ObservableValue<FindOptions<T, Array<keyof T>>>

  /**
   * A list of custom header components to use
   */
  headerComponents: DataHeaderCells<Column>
  /**
   * A list of custom row components to use
   */
  rowComponents: DataRowCells<T, Column>
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
}

export const DataGrid: <T, Column extends string>(
  props: DataGridProps<T, Column>,
  children: ChildrenList,
) => JSX.Element<any> = Shade({
  shadowDomName: 'shade-data-grid',
  css: {
    display: 'block',
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
      background: 'rgba(128,128,128,0.3)',
      color: cssVariableTheme.text.secondary,
      height: '48px',
      padding: '0 1.2em',
      alignItems: 'center',
      borderRadius: '2px',
      top: '2px',
      position: 'sticky',
      fontVariant: 'all-petite-caps',
      fontSize: '0.875rem',
      fontWeight: '600',
      letterSpacing: '0.05em',
      textAlign: 'left',
      zIndex: '1',
      boxShadow: 'rgba(0, 0, 0, 0.2) 1px 1px 1px 2px',
      borderBottom: '2px solid rgba(128, 128, 128, 0.2)',
      borderRight: '1px solid rgba(128, 128, 128, 0.2)',
    },
  },
  constructed: ({ props }) => {
    const listener = (ev: KeyboardEvent) => props.collectionService.handleKeyDown(ev)
    window.addEventListener('keydown', listener)
    return () => window.removeEventListener('keydown', listener)
  },
  render: ({ props, useDisposable, element }) => {
    useDisposable(
      'clickAway',
      () =>
        new ClickAwayService(element, () => {
          props.collectionService.hasFocus.setValue(false)
        }),
    )

    if (props.styles?.wrapper) {
      attachStyles(element, { style: props.styles.wrapper })
    }

    return (
      <div
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
        <DataGridFooter service={props.collectionService} findOptions={props.findOptions} />
      </div>
    )
  },
})
