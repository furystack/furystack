import { FindOptions } from '@furystack/core'
import { ChildrenList, Shade, createComponent } from '@furystack/shades'
import { debounce } from '@furystack/utils'
import { CollectionService } from '../../services/collection-service'
import { Input } from '../input'

export interface DataGridHeaderProps<T, K extends keyof T> {
  collectionService: CollectionService<T>
  field: K
}

export interface DataGridHeaderState<T> {
  querySettings: FindOptions<T, any>
  isSearchOpened: boolean
  updateSearchValue: (value: string) => void
}

export const DataGridHeader: <T, K extends keyof T>(
  props: DataGridHeaderProps<T, K>,
  children: ChildrenList,
) => JSX.Element<any, any> = Shade<DataGridHeaderProps<any, any>, DataGridHeaderState<any>>({
  shadowDomName: 'data-grid-header',
  getInitialState: ({ props }) => ({
    querySettings: props.collectionService.querySettings.getValue(),
    isSearchOpened: false,
    updateSearchValue: debounce((value: string) => {
      const currentSettings = props.collectionService.querySettings.getValue()
      const newSettings: FindOptions<unknown, any> = {
        ...currentSettings,
        filter: {
          ...currentSettings.filter,
          [props.field]: { $regex: value },
        },
      }
      props.collectionService.querySettings.setValue(newSettings)
    }),
  }),
  constructed: ({ props, updateState, getState }) => {
    const disposable = props.collectionService.querySettings.subscribe((querySettings) =>
      updateState({ querySettings }, getState().isSearchOpened),
    )
    return () => disposable.dispose()
  },
  render: ({ getState, props, updateState, element }) => {
    const currentState = getState()
    const currentOrder = Object.keys(currentState.querySettings.order || {})[0]
    const currentOrderDirection = Object.values(currentState.querySettings.order || {})[0]

    const filterValue = (props.collectionService.querySettings.getValue().filter as any)?.[props.field]?.$regex || ''

    if (currentState.isSearchOpened) {
      setTimeout(() => {
        element.querySelector('input')?.focus()
      }, 1)
      return (
        <Input
          style={{ padding: '0px' }}
          value={filterValue}
          placeholder={props.field}
          autofocus
          onblur={() => updateState({ isSearchOpened: false })}
          onkeyup={(ev) => currentState.updateSearchValue((ev.target as HTMLInputElement).value)}
          labelProps={{
            style: { padding: '0px 2em' },
          }}
        />
      )
    }

    return (
      <div
        style={{ display: 'flex', width: '100%', height: '100%', justifyContent: 'space-around' }}
        onclick={() => updateState({ isSearchOpened: true })}
      >
        <div>{props.field}</div>
        <div className="header-controls" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <div
            title="Change order"
            style={{ padding: '0 1em', cursor: 'pointer', opacity: currentOrder === props.field ? '1' : '0.5' }}
            onclick={(ev) => {
              ev.stopPropagation()
              let newDirection: 'ASC' | 'DESC' = 'ASC'
              const newOrder: { [K in keyof any]: 'ASC' | 'DESC' } = {}

              if (currentOrder === props.field) {
                newDirection = currentOrderDirection === 'ASC' ? 'DESC' : 'ASC'
              }
              newOrder[props.field] = newDirection
              props.collectionService.querySettings.setValue({
                ...currentState.querySettings,
                order: newOrder,
              })
            }}
          >
            {(currentOrder === props.field && (currentOrderDirection === 'ASC' ? '⬇' : '⬆')) || '↕'}
          </div>
        </div>
      </div>
    )
  },
})
