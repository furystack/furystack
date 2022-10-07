import type { CollectionService } from '../../services/collection-service.js'
import type { ChildrenList } from '@furystack/shades'
import { Shade, createComponent, createFragment } from '@furystack/shades'
import type { DataRowCells } from './data-grid.js'
import { Loader } from '../loader.js'
import { DataGridRow } from './data-grid-row.js'

export interface DataGridBodyProps<T> {
  service: CollectionService<T>
  onRowClick?: (row: T, ev: MouseEvent) => void
  onRowDoubleClick?: (entry: T) => void
  columns: Array<keyof T>
  rowComponents?: DataRowCells<T>
  style?: Partial<CSSStyleDeclaration>
  focusedRowStyle?: Partial<CSSStyleDeclaration>
  unfocusedRowStyle?: Partial<CSSStyleDeclaration>
  selectedRowStyle?: Partial<CSSStyleDeclaration>
  unselectedRowStyle?: Partial<CSSStyleDeclaration>
}

export interface DataGridBodyState<T> {
  data: T[]
  isLoading: boolean
}

export const DataGridBody: <T>(props: DataGridBodyProps<T>, children: ChildrenList) => JSX.Element<any, any> = Shade<
  DataGridBodyProps<any>,
  DataGridBodyState<any>
>({
  getInitialState: ({ props }) => ({
    data: props.service.data.getValue().entries,
    isLoading: props.service.isLoading.getValue(),
  }),
  resources: ({ props, updateState }) => [
    props.service.data.subscribe((data) => updateState({ data: data.entries })),
    props.service.isLoading.subscribe((isLoading) => updateState({ isLoading })),
  ],
  shadowDomName: 'shade-data-grid-body',
  render: ({ getState, props, element }) => {
    element.style.display = 'table-row-group'
    const state = getState()

    if (state.isLoading) {
      return (
        <div style={{ display: 'flex', height: '100%', justifyContent: 'center', alignItems: 'center', width: '100%' }}>
          {/* TODO: Skeleton */}
          <Loader style={{ height: '128px', width: '128px' }} />
        </div>
      )
    }

    if (!state.data?.length) {
      return <div> - No Data - </div>
    }

    return (
      <>
        {state.data.map((entry) => (
          <DataGridRow<any>
            columns={props.columns}
            entry={entry}
            service={props.service}
            rowComponents={props.rowComponents}
            onRowClick={props.onRowClick}
            focusedRowStyle={props.focusedRowStyle}
            unfocusedRowStyle={props.unfocusedRowStyle}
            selectedRowStyle={props.selectedRowStyle}
            unselectedRowStyle={props.unselectedRowStyle}
          ></DataGridRow>
        ))}
      </>
    )
  },
})
