import { ChildrenList, createComponent, createFragment, Shade } from '@furystack/shades'
import { CollectionService } from '../../services/collection-service'
import { Button } from '../button'
import { DataRowCells } from './data-grid'

export interface DataGridRowProps<T> {
  entry: T
  columns: Array<keyof T>
  service: CollectionService<T>
  rowComponents?: DataRowCells<T>
}

export interface DataGridRowState<T> {
  selection?: T[]
  focus?: T
}

export const DataGridRow: <T>(props: DataGridRowProps<T>, children: ChildrenList) => JSX.Element<any, any> = Shade<
  DataGridRowProps<any>,
  DataGridRowState<any>
>({
  getInitialState: ({ props }) => ({
    focus: props.service.focus.getValue(),
    selection: props.service.selection.getValue(),
  }),
  shadowDomName: 'shades-data-grid-row',
  render: ({ getState, props, element }) => {
    const state = getState()
    const { entry, rowComponents, columns } = props

    element.style.display = 'table-row'

    return (
      //   <tr
      //     style={{
      //       background: state.selection?.includes(entry) ? 'rgba(128,128,128,0.3)' : 'transparent',
      //       filter: state.focus === entry ? 'brightness(1.5)' : 'brightness(1)',
      //       cursor: 'default',
      //       boxShadow: '2px 1px 0px rgba(255,255,255,0.07)',
      //       fontSize: '0.8em',
      //     }}
      //     onclick={() => {
      //       if (getState().focus !== entry) {
      //         service.focus.setValue(entry)
      //         service.selection.setValue([entry])
      //       }
      //     }}
      //   >
      <>
        {columns.map((column) => (
          <td style={{ padding: '0.5em' }}>
            {rowComponents?.[column]?.(entry, state) || rowComponents?.default?.(entry, state) || (
              <span>{entry[column]}</span>
            )}
          </td>
        ))}
        <Button onclick={() => console.log('alma')}>alma</Button>
      </>
      //   </tr>
    )
  },
})
