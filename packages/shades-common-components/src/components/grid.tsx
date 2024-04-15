import type { ChildrenList } from '@furystack/shades'
import { Shade, createComponent } from '@furystack/shades'
import { ThemeProviderService } from '../services/theme-provider-service.js'

// ToDo: https://stackoverflow.com/questions/51459971/type-of-generic-stateless-component-react-or-extending-generic-function-interfa

export interface GridProps<T, Column extends string> {
  entries: T[]
  columns: Column[]
  headerComponents?: HeaderCells<Column>
  rowComponents?: RowCells<T, Column>
  styles?: {
    wrapper?: Partial<CSSStyleDeclaration>
    header?: Partial<CSSStyleDeclaration>
    cell?: Partial<CSSStyleDeclaration>
  }
}

export type HeaderCells<Columns extends string> = {
  [TKey in Columns | 'default']?: (name: Columns) => JSX.Element
}
export type RowCells<T, Columns extends string> = {
  [TKey in Columns | 'default']?: (element: T, column: Columns) => JSX.Element
}

export const Grid: <T, Column extends string>(props: GridProps<T, Column>, children: ChildrenList) => JSX.Element<any> =
  Shade({
    shadowDomName: 'shade-grid',
    render: ({ props, injector }) => {
      const { theme } = injector.getInstance(ThemeProviderService)
      const headerStyle: Partial<CSSStyleDeclaration> = {
        padding: '0 0.51em',
        backgroundColor: theme.background.paper,
        color: theme.text.secondary,
        borderRadius: '2px',
        top: '0',
        position: 'sticky',
        cursor: 'pointer',
        fontVariant: 'all-petite-caps',
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
          }}
        >
          <table style={{ width: '100%', position: 'relative' }}>
            <thead>
              <tr>
                {props.columns.map((column) => {
                  return (
                    <th style={headerStyle}>
                      {props.headerComponents?.[column]?.(column) || props.headerComponents?.default?.(column) || (
                        <>{column}</>
                      )}
                    </th>
                  )
                })}
              </tr>
            </thead>
            <tbody>
              {props.entries.map((entry) => (
                <tr>
                  {props.columns.map((column) => (
                    <td style={props.styles?.cell}>
                      {props.rowComponents?.[column]?.(entry, column) ||
                        props.rowComponents?.default?.(entry, column) ||
                        null}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )
    },
  })
