import { Shade, createComponent, ChildrenList } from '@furystack/shades'
import { ThemeProviderService } from '../services'

// ToDo: https://stackoverflow.com/questions/51459971/type-of-generic-stateless-component-react-or-extending-generic-function-interfa

export interface GridProps<T> {
  entries: T[]
  columns: Array<keyof T>
  headerComponents?: HeaderCells<T>
  rowComponents?: RowCells<T>
  styles?: {
    wrapper?: Partial<CSSStyleDeclaration>
    header?: Partial<CSSStyleDeclaration>
    cell?: Partial<CSSStyleDeclaration>
  }
}

export type HeaderCells<T> = {
  [TKey in keyof T | 'default']?: (name: keyof T) => JSX.Element
}
export type RowCells<T> = {
  [TKey in keyof T | 'default']?: (element: T) => JSX.Element
}

export const Grid: <T>(props: GridProps<T>, children: ChildrenList) => JSX.Element<any, any> = Shade({
  shadowDomName: 'shade-grid',
  constructed: ({ injector, element }) => {
    const themeChanged = injector.getInstance(ThemeProviderService).theme.subscribe((t) => {
      const headers = element.querySelectorAll('th')
      headers.forEach((header) => {
        header.style.color = t.text.secondary
        header.style.background = t.background.paper
      })
    })
    return () => themeChanged.dispose()
  },
  render: ({ props, injector }) => {
    const theme = injector.getInstance(ThemeProviderService).theme.getValue()
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
        }}>
        <table style={{ width: '100%', position: 'relative' }}>
          <thead>
            <tr>
              {props.columns.map((column) => {
                return (
                  <th style={headerStyle}>
                    {props.headerComponents?.[column]?.(column) || props.headerComponents?.default?.(column) || (
                      <span>{column}</span>
                    )}{' '}
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
                    {props.rowComponents?.[column]?.(entry) || props.rowComponents?.default?.(entry) || (
                      <span>{entry[column]}</span>
                    )}
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
