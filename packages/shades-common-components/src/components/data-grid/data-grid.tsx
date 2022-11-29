import type { ChildrenList } from '@furystack/shades'
import { createComponent, Shade } from '@furystack/shades'
import type { CollectionService } from '../../services/collection-service'
import type { GridProps } from '../grid'
import { DataGridHeader } from './header'
import { DataGridBody } from './body'
import { DataGridFooter } from './footer'
import { ClickAwayService, ThemeProviderService } from '../../services'
import type { DataGridRowState } from './data-grid-row'

export type DataHeaderCells<T> = {
  [TKey in keyof T | 'default']?: (name: keyof T) => JSX.Element
}
export type DataRowCells<T> = {
  [TKey in keyof T | 'default']?: (element: T, state: DataGridRowState<T>) => JSX.Element
}

export interface DataGridProps<T> {
  /**
   * A list of columns to display
   */
  columns: Array<keyof T>
  /**
   * Optional style overrides for the grid
   */
  styles: GridProps<T>['styles']
  /**
   * A collection service to use for data source
   */
  service: CollectionService<T>
  /**
   * A list of custom header components to use
   */
  headerComponents: DataHeaderCells<T>
  /**
   * A list of custom row components to use
   */
  rowComponents: DataRowCells<T>
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

export const DataGrid: <T>(props: DataGridProps<T>, children: ChildrenList) => JSX.Element<any, any> = Shade<
  DataGridProps<any>
>({
  shadowDomName: 'shade-data-grid',
  resources: ({ injector, element, props }) => {
    const tp = injector.getInstance(ThemeProviderService)
    return [
      tp.theme.subscribe((t) => {
        const headers = element.querySelectorAll('th')
        const { r, g, b } = tp.getRgbFromColorString(t.background.paper)
        headers.forEach((header) => {
          header.style.color = t.text.secondary
          header.style.backgroundColor = `rgba(${r}, ${g}, ${b}, 0.3)`
        })
      }),
      new ClickAwayService(element, () => {
        props.service.hasFocus.setValue(false)
      }),
    ]
  },
  constructed: ({ props }) => {
    const listener = (ev: KeyboardEvent) => props.service.handleKeyDown(ev)
    window.addEventListener('keydown', listener)
    return () => window.removeEventListener('keydown', listener)
  },
  render: ({ props, injector }) => {
    const tp = injector.getInstance(ThemeProviderService)
    const theme = tp.theme.getValue()

    const { r, g, b } = tp.getRgbFromColorString(theme.background.paper)
    const headerStyle: Partial<CSSStyleDeclaration> = {
      backgroundColor: `rgba(${r}, ${g}, ${b}, 0.3)`,
      backdropFilter: 'blur(10px)',
      padding: '12px 0',
      color: theme.text.secondary,
      alignItems: 'center',
      borderRadius: '2px',
      top: '0',
      position: 'sticky',
      fontVariant: 'all-petite-caps',
      zIndex: '1',
      boxShadow: '3px 3px 4px rgba(0,0,0,0.3)',
      ...props.styles?.header,
    }

    return (
      <div
        className="shade-grid-wrapper"
        style={{
          ...props.styles?.wrapper,
          width: '100%',
          height: '100%',
          overflow: 'auto',
          zIndex: '1',
        }}
        onclick={() => {
          props.service.hasFocus.setValue(true)
        }}
        ariaMultiSelectable="true"
      >
        <table style={{ width: '100%', maxHeight: 'calc(100% - 4em)', position: 'relative' }}>
          <thead>
            <tr>
              {props.columns.map((column: any) => {
                return (
                  <th style={headerStyle}>
                    {props.headerComponents?.[column]?.(column) || props.headerComponents?.default?.(column) || (
                      <DataGridHeader<any, typeof column> field={column} collectionService={props.service} />
                    )}
                  </th>
                )
              })}
            </tr>
          </thead>
          <DataGridBody
            columns={props.columns}
            service={props.service}
            rowComponents={props.rowComponents}
            onRowClick={(entry, ev) => props.service.handleRowClick(entry, ev)}
            onRowDoubleClick={(entry) => props.service.handleRowDoubleClick(entry)}
            style={props.styles?.cell}
            focusedRowStyle={props.focusedRowStyle}
            selectedRowStyle={props.selectedRowStyle}
            unfocusedRowStyle={props.unfocusedRowStyle}
            unselectedRowStyle={props.unselectedRowStyle}
            emptyComponent={props.emptyComponent}
            loaderComponent={props.loaderComponent}
          />
        </table>
        <DataGridFooter service={props.service} />
      </div>
    )
  },
})
