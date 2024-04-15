import type { CollectionService } from '../../services/collection-service.js'
import type { ChildrenList } from '@furystack/shades'
import { Shade, createComponent } from '@furystack/shades'
import type { DataRowCells } from './data-grid.js'
import { DataGridRow } from './data-grid-row.js'

export interface DataGridBodyProps<T, Column extends string> {
  service: CollectionService<T>
  onRowClick?: (row: T, ev: MouseEvent) => void
  onRowDoubleClick?: (entry: T, ev: MouseEvent) => void
  columns: Column[]
  rowComponents?: DataRowCells<T, Column>
  style?: Partial<CSSStyleDeclaration>
  focusedRowStyle?: Partial<CSSStyleDeclaration>
  unfocusedRowStyle?: Partial<CSSStyleDeclaration>
  selectedRowStyle?: Partial<CSSStyleDeclaration>
  unselectedRowStyle?: Partial<CSSStyleDeclaration>
  emptyComponent?: JSX.Element
  loaderComponent?: JSX.Element
}

export const DataGridBody: <T, Column extends string>(
  props: DataGridBodyProps<T, Column>,
  children: ChildrenList,
) => JSX.Element<any> = Shade<DataGridBodyProps<any, string>>({
  shadowDomName: 'shade-data-grid-body',
  style: {
    display: 'table-row-group',
  },
  render: ({ props, useObservable }) => {
    const [data] = useObservable('data', props.service.data)

    if (!data?.entries?.length) {
      return props.emptyComponent || <div> - No Data - </div>
    }

    return (
      <>
        {data?.entries?.map((entry) => (
          <DataGridRow
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
