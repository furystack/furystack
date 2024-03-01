import type { CollectionService } from '../../services/collection-service.js'
import type { ChildrenList } from '@furystack/shades'
import { Shade, createComponent } from '@furystack/shades'
import type { DataRowCells } from './data-grid.js'
import { Loader } from '../loader.js'
import { DataGridRow } from './data-grid-row.js'

export interface DataGridBodyProps<T> {
  service: CollectionService<T>
  onRowClick?: (row: T, ev: MouseEvent) => void
  onRowDoubleClick?: (entry: T, ev: MouseEvent) => void
  columns: Array<keyof T>
  rowComponents?: DataRowCells<T>
  style?: Partial<CSSStyleDeclaration>
  focusedRowStyle?: Partial<CSSStyleDeclaration>
  unfocusedRowStyle?: Partial<CSSStyleDeclaration>
  selectedRowStyle?: Partial<CSSStyleDeclaration>
  unselectedRowStyle?: Partial<CSSStyleDeclaration>
  emptyComponent?: JSX.Element
  loaderComponent?: JSX.Element
}

export const DataGridBody: <T>(props: DataGridBodyProps<T>, children: ChildrenList) => JSX.Element<any> = Shade<
  DataGridBodyProps<any>
>({
  shadowDomName: 'shade-data-grid-body',
  style: {
    display: 'table-row-group',
  },
  render: ({ props, useObservable }) => {
    const [data] = useObservable('data', props.service.data)
    const [isLoading] = useObservable('isLoading', props.service.isLoading)

    if (isLoading) {
      return (
        <div style={{ display: 'flex', height: '100%', justifyContent: 'center', alignItems: 'center', width: '100%' }}>
          {/* TODO: Skeleton */}
          {props.loaderComponent || <Loader style={{ height: '128px', width: '128px' }} />}
        </div>
      )
    }

    if (!data?.entries?.length) {
      return props.emptyComponent || <div> - No Data - </div>
    }

    return (
      <>
        {data?.entries?.map((entry) => (
          <DataGridRow<any>
            columns={props.columns}
            entry={entry}
            service={props.service}
            rowComponents={props.rowComponents}
            onRowClick={props.onRowClick}
            onRowDoubleClick={props.onRowDoubleClick}
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
