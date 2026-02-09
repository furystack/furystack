import type { ChildrenList } from '@furystack/shades'
import { createComponent, Shade } from '@furystack/shades'
import { cssVariableTheme } from '../services/css-variable-theme.js'

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
    css: {
      display: 'block',
      width: '100%',
      height: '100%',
      overflow: 'auto',
      '& table': {
        width: '100%',
        position: 'relative',
        borderCollapse: 'collapse',
      },
      '& th': {
        padding: '1em 1.2em',
        backgroundColor: cssVariableTheme.background.paper,
        color: cssVariableTheme.text.secondary,
        borderRadius: cssVariableTheme.shape.borderRadius.xs,
        top: '0',
        position: 'sticky',
        cursor: 'pointer',
        fontVariant: 'all-petite-caps',
        fontSize: '0.875rem',
        fontWeight: cssVariableTheme.typography.fontWeight.semibold,
        letterSpacing: '0.05em',
        textAlign: 'left',
        borderBottom: `2px solid ${cssVariableTheme.background.default}`,
        borderRight: `1px solid ${cssVariableTheme.action.subtleBorder}`,
      },
      '& td': {
        padding: '0.75em 1.2em',
        borderBottom: `1px solid ${cssVariableTheme.action.subtleBorder}`,
        transition: `background-color ${cssVariableTheme.transitions.duration.normal} ease`,
        fontSize: '0.875rem',
        lineHeight: '1.5',
      },
      '& tbody tr': {
        transition: `background-color ${cssVariableTheme.transitions.duration.normal} ease`,
      },
      '& tbody tr:hover': {
        backgroundColor: cssVariableTheme.action.hoverBackground,
      },
    },
    render: ({ props, useHostProps }) => {
      if (props.styles?.wrapper) {
        useHostProps({ style: props.styles.wrapper as Record<string, string> })
      }

      return (
        <table>
          <thead>
            <tr>
              {props.columns.map((column) => {
                return (
                  <th style={props.styles?.header}>
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
      )
    },
  })
