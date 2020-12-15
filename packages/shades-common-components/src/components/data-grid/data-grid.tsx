import { ChildrenList, createComponent, Shade } from '@furystack/shades'
import { CollectionService } from '../../services/collection-service'
import { GridProps } from '../grid'
import { colors } from '../styles'
import { DataGridHeader } from './header'
import { DataGridBody, DataGridBodyState } from './body'
import { DataGridFooter } from './footer'
import { ThemeProviderService } from '../../services'

export type DataHeaderCells<T> = {
  [TKey in keyof T | 'default']?: (name: keyof T, state: DataGridState) => JSX.Element
}
export type DataRowCells<T> = {
  [TKey in keyof T | 'default']?: (element: T, state: DataGridBodyState<T>) => JSX.Element
}

export interface DataGridProps<T> {
  columns: Array<keyof T>
  styles: GridProps<T>['styles']
  service: CollectionService<T>
  headerComponents: DataHeaderCells<T>
  rowComponents: DataRowCells<T>
  onDoubleClick?: (entry: T) => void
}

export interface DataGridState {
  error?: Error
}

export const DataGrid: <T>(props: DataGridProps<T>, children: ChildrenList) => JSX.Element<any, any> = Shade<
  DataGridProps<any>,
  DataGridState
>({
  shadowDomName: 'shade-data-grid',
  getInitialState: () => ({}),
  constructed: ({ props, updateState, injector, element }) => {
    const subscriptions = [
      props.service.error.subscribe((error) => updateState({ error })),
      injector.getInstance(ThemeProviderService).theme.subscribe((t) => {
        const headers = element.querySelectorAll('th')
        headers.forEach((header) => {
          header.style.color = t.text.secondary
          header.style.background = t.background.paper
        })
      }),
    ]
    return () => Promise.all(subscriptions.map((s) => s.dispose()))
  },
  render: ({ props, getState, injector }) => {
    const theme = injector.getInstance(ThemeProviderService).theme.getValue()
    const state = getState()
    if (state.error) {
      return <div style={{ color: colors.error.main }}>{JSON.stringify(state.error)}</div>
    }

    const headerStyle: Partial<CSSStyleDeclaration> = {
      padding: '1em 3em',
      backgroundColor: theme.background.paper,
      color: theme.text.secondary,
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
        }}>
        <table style={{ width: '100%', height: '100%', position: 'relative' }}>
          <thead>
            <tr>
              {props.columns.map((column: any) => {
                return (
                  <th style={headerStyle}>
                    {props.headerComponents?.[column]?.(column, state) ||
                      props.headerComponents?.default?.(column, state) || (
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
            style={props.styles?.cell}
            onDoubleClick={props.onDoubleClick}
          />
        </table>
        <DataGridFooter service={props.service} />
      </div>
    )
  },
})
