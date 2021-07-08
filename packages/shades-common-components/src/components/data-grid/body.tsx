import { CollectionService } from '../../services/collection-service'
import { ChildrenList, Shade, createComponent } from '@furystack/shades'
import { DataRowCells } from './data-grid'
import { Loader } from '../loader'

export interface DataGridBodyProps<T> {
  service: CollectionService<T>
  onDoubleClick?: (entry: T) => void
  columns: Array<keyof T>
  rowComponents?: DataRowCells<T>
  style?: Partial<CSSStyleDeclaration>
}

export interface DataGridBodyState<T> {
  data: T[]
  selection: T[]
  focus: T | undefined
  isLoading: boolean
}

export const DataGridBody: <T>(props: DataGridBodyProps<T>, children: ChildrenList) => JSX.Element<any, any> = Shade<
  DataGridBodyProps<any>,
  DataGridBodyState<any>
>({
  getInitialState: ({ props }) => ({
    data: props.service.data.getValue().entries,
    selection: props.service.selection.getValue(),
    focus: props.service.focus.getValue(),
    isLoading: props.service.isLoading.getValue(),
  }),
  constructed: ({ props, updateState }) => {
    const disposables = [
      props.service.data.subscribe((data) => updateState({ data: data.entries })),
      props.service.focus.subscribe((focus) => updateState({ focus })),
      props.service.selection.subscribe((selection) => updateState({ selection })),
      props.service.isLoading.subscribe((isLoading) => updateState({ isLoading })),
    ]
    return () => disposables.map((d) => d.dispose())
  },
  shadowDomName: 'shade-data-grid-body',
  render: ({ getState, props, element }) => {
    element.style.display = 'table-row-group'
    const state = getState()

    if (state.isLoading) {
      return (
        <div style={{ display: 'flex', height: '100%', justifyContent: 'center', alignItems: 'center', width: '100%' }}>
          <Loader style={{ height: '128px', width: '128px' }} />
        </div>
      )
    }

    if (!state.data?.length) {
      return <div> - No Data - </div>
    }

    return (
      <div style={{ display: 'contents' }}>
        {state.data.map((entry) => (
          <tr
            style={{
              background: state.selection.includes(entry) ? 'rgba(128,128,128,0.3)' : 'transparent',
              filter: state.focus === entry ? 'brightness(1.5)' : 'brightness(1)',
              cursor: 'default',
              boxShadow: '2px 1px 0px rgba(255,255,255,0.07)',
              fontSize: '0.8em',
            }}
            onclick={() => {
              if (getState().focus !== entry) {
                props.service.focus.setValue(entry)
                props.service.selection.setValue([entry])
              }
            }}
            ondblclick={() => props.onDoubleClick?.(entry)}>
            {props.columns.map((column: any) => (
              <td style={{ padding: '0.5em', ...props.style }}>
                {props.rowComponents?.[column]?.(entry, state) || props.rowComponents?.default?.(entry, state) || (
                  <span>{entry[column]}</span>
                )}
              </td>
            ))}
          </tr>
        ))}
      </div>
    )
  },
})
