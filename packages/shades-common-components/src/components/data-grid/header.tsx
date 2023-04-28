import type { FindOptions } from '@furystack/core'
import type { ChildrenList } from '@furystack/shades'
import { Shade, createComponent } from '@furystack/shades'
import type { CollectionService } from '../../services/collection-service.js'
import { Input } from '../inputs/input.js'
import { Form } from '../form.js'
import { Button } from '../button.js'
import { ObservableValue } from '@furystack/utils'
import { collapse, expand } from '../animations.js'

export interface DataGridHeaderProps<T, K extends keyof T> {
  collectionService: CollectionService<T>
  field: K
}

export interface DataGridHeaderState<T> {
  querySettings: FindOptions<T, any>
  isSearchOpened: boolean
  updateSearchValue: (value: string) => void
}

export const OrderButton = Shade<{ collectionService: CollectionService<any>; field: string }>({
  shadowDomName: 'data-grid-order-button',
  render: ({ props, useObservable }) => {
    const [currentQuerySettings, setQuerySettings] = useObservable(
      'currentQuerySettings',
      props.collectionService.querySettings,
    )
    const currentOrder = Object.keys(currentQuerySettings.order || {})[0]
    const currentOrderDirection = Object.values(currentQuerySettings.order || {})[0]
    return (
      <Button
        title="Change order"
        style={{
          padding: '4px',
          margin: '0',
          cursor: 'pointer',
        }}
        color={currentOrder === props.field ? 'info' : undefined}
        onclick={(ev) => {
          ev.stopPropagation()
          let newDirection: 'ASC' | 'DESC' = 'ASC'
          const newOrder: { [K in keyof any]: 'ASC' | 'DESC' } = {}

          if (currentOrder === props.field) {
            newDirection = currentOrderDirection === 'ASC' ? 'DESC' : 'ASC'
          }
          newOrder[props.field] = newDirection
          setQuerySettings({
            ...currentQuerySettings,
            order: newOrder,
          })
        }}
      >
        {(currentOrder === props.field && (currentOrderDirection === 'ASC' ? '⬇' : '⬆')) || '↕'}
      </Button>
    )
  },
})

const SearchButton = Shade<{ service: CollectionService<any>; fieldName: string; onclick: () => void }>({
  shadowDomName: 'data-grid-search-button',
  render: ({ props, useObservable, element }) => {
    const [queryState] = useObservable('currentFilterState', props.service.querySettings, (currentQueryState) => {
      const currentValue = (currentQueryState.filter?.[props.fieldName] as any)?.$regex || ''

      const button = element.querySelector('button') as HTMLInputElement
      button.innerHTML = currentValue ? '🔍' : '🔎'
      button.style.textShadow = currentValue
        ? '1px 1px 20px rgba(235,225,45,0.9), 1px 1px 12px rgba(235,225,45,0.9), 0px 0px 3px  rgba(255,200,145,0.6)'
        : 'none'
    })

    const filterValue = (queryState.filter as any)?.[props.fieldName]?.$regex || ''

    return (
      <Button
        type="button"
        title="Filter"
        style={{
          padding: '4px',
          margin: '0',
          cursor: 'pointer',
        }}
        onclick={props.onclick}
      >
        {filterValue ? '🔍' : '🔎'}
      </Button>
    )
  },
})

const SearchForm = Shade<{
  onSubmit: (newValue: string) => void
  onClear: () => void
  service: CollectionService<any>
  fieldName: string
}>({
  shadowDomName: 'data-grid-search-form',
  render: ({ props, useObservable, element }) => {
    type SearchSubmitType = { searchValue: string }

    const [queryState] = useObservable('currentFilterState', props.service.querySettings, (currentQueryState) => {
      const currentValue = (currentQueryState.filter?.[props.fieldName] as any)?.$regex || ''
      ;(element.querySelector('input') as HTMLInputElement).value = currentValue
    })

    return (
      <Form<SearchSubmitType>
        className="search-form"
        style={{
          display: 'flex',
          width: '100%',
          overflow: 'hide',
          height: '0px',
          justifyContent: 'space-around',
          opacity: '0',
        }}
        validate={(data): data is SearchSubmitType => data.searchValue?.length}
        onSubmit={({ searchValue }) => {
          props.onSubmit(searchValue)
        }}
      >
        <Input
          style={{ padding: '0px', paddingBottom: '0', margin: '0' }}
          placeholder={props.fieldName}
          autofocus
          labelTitle={`${props.fieldName}`}
          name="searchValue"
          value={(queryState.filter?.[props.fieldName] as any)?.$regex || ''}
          labelProps={{
            style: { padding: '0px 2em' },
          }}
        />
        <div style={{ display: 'flex', width: '64px', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
          <Button
            type="reset"
            style={{ padding: '4px', margin: '0' }}
            onclick={() => {
              props.onClear()
            }}
          >
            ❌
          </Button>
          <Button style={{ padding: '4px', margin: '0' }} type="submit">
            🔎
          </Button>
        </div>
      </Form>
    )
  },
})

export const DataGridHeader: <T, K extends keyof T>(
  props: DataGridHeaderProps<T, K>,
  children: ChildrenList,
) => JSX.Element<any> = Shade<DataGridHeaderProps<any, any>>({
  shadowDomName: 'data-grid-header',
  render: ({ props, element, useObservable }) => {
    const [, setIsSearchOpened] = useObservable('isSearchOpened', new ObservableValue(false), (newValue) => {
      const searchForm = element.querySelector('.search-form') as HTMLElement
      const headerContent = element.querySelector('.header-content') as HTMLElement
      if (!newValue) {
        collapse(searchForm)
        expand(headerContent)
      } else {
        searchForm.style.display = 'flex'
        expand(searchForm).then(() => searchForm.querySelector('input')?.focus())
        collapse(headerContent)
      }
    })
    const updateSearchValue = (value?: string) => {
      const currentSettings = props.collectionService.querySettings.getValue()
      if (value) {
        const newSettings: FindOptions<unknown, any> = {
          ...currentSettings,
          filter: {
            ...currentSettings.filter,
            [props.field]: { $regex: value },
          },
        }
        props.collectionService.querySettings.setValue(newSettings)
      } else {
        const { [props.field]: _, ...newFilter } = currentSettings.filter || {}
        props.collectionService.querySettings.setValue({ ...currentSettings, filter: newFilter })
      }

      setIsSearchOpened(false)
    }

    return (
      <>
        <SearchForm
          onSubmit={updateSearchValue}
          onClear={updateSearchValue}
          service={props.collectionService}
          fieldName={props.field}
        />
        <div
          className="header-content"
          style={{
            display: 'flex',
            width: '100%',
            height: '48px',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '8px',
            overflow: 'hide',
          }}
        >
          <div style={{ paddingLeft: '0.5em' }}>{props.field}</div>
          <div
            className="header-controls"
            style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', paddingRight: '0.5em' }}
          >
            <SearchButton
              onclick={() => {
                setIsSearchOpened(true)
              }}
              service={props.collectionService}
              fieldName={props.field}
            />

            <OrderButton collectionService={props.collectionService} field={props.field} />
          </div>
        </div>
      </>
    )
  },
})
