import { ChildrenList, createComponent, Shade } from '@furystack/shades'
import { CollectionService } from '../../services/collection-service'
import { GridProps } from '../grid'
import { DataGridHeader } from './header'
import { DataGridBody } from './body'
import { DataGridFooter } from './footer'
import { ClickAwayService, ThemeProviderService } from '../../services'
import { DataGridRowState } from './data-grid-row'

export type DataHeaderCells<T> = {
  [TKey in keyof T | 'default']?: (name: keyof T) => JSX.Element
}
export type DataRowCells<T> = {
  [TKey in keyof T | 'default']?: (element: T, state: DataGridRowState<T>) => JSX.Element
}

export interface DataGridProps<T> {
  columns: Array<keyof T>
  styles: GridProps<T>['styles']
  service: CollectionService<T>
  headerComponents: DataHeaderCells<T>
  rowComponents: DataRowCells<T>
  autofocus?: boolean
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
            style={props.styles?.cell}
          />
        </table>
        <DataGridFooter service={props.service} />
      </div>
    )
  },
})
