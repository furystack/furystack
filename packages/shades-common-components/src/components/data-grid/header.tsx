import type { FilterType, FindOptions } from '@furystack/core'
import type { ChildrenList } from '@furystack/shades'
import { Shade, createComponent } from '@furystack/shades'
import { ObservableValue, sleepAsync } from '@furystack/utils'
import { collapse, expand } from '../animations.js'
import { Button } from '../button.js'
import { Form } from '../form.js'
import { Input } from '../inputs/input.js'

export interface DataGridHeaderProps<T, Column extends string> {
  field: Column
  findOptions: ObservableValue<FindOptions<T, Array<keyof T>>>
}

export interface DataGridHeaderState<T, K extends keyof T> {
  findOptions: FindOptions<T, K[]>
  isSearchOpened: boolean
  updateSearchValue: (value: string) => void
}

export const OrderButton = Shade<{
  field: string
  findOptions: ObservableValue<FindOptions<any, any[]>>
}>({
  shadowDomName: 'data-grid-order-button',
  render: ({ props, useObservable }) => {
    const [findOptions, onFindOptionsChange] = useObservable('findOptions', props.findOptions, {})

    const currentOrder = Object.keys(findOptions.order || {})[0]
    const currentOrderDirection = Object.values(findOptions.order || {})[0]
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
          onFindOptionsChange({
            ...findOptions,
            order: newOrder,
          })
        }}
      >
        {(currentOrder === props.field && (currentOrderDirection === 'ASC' ? '⬇' : '⬆')) || '↕'}
      </Button>
    )
  },
})

const SearchButton = Shade<{
  fieldName: string
  onclick: () => void
  findOptions: ObservableValue<FindOptions<any, any[]>>
}>({
  shadowDomName: 'data-grid-search-button',
  render: ({ props, useObservable }) => {
    const [findOptions] = useObservable('currentValue', props.findOptions, {
      filter: (newValue) => {
        return !!newValue.filter?.[props.fieldName]
      },
    })

    const filterValue =
      (findOptions.filter?.[props.fieldName] as FilterType<{ [K in typeof props.fieldName]: string }>)?.$regex || ''

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
  fieldName: string
  findOptions: ObservableValue<FindOptions<any, any[]>>
}>({
  shadowDomName: 'data-grid-search-form',
  render: ({ props, useObservable }) => {
    type SearchSubmitType = { searchValue: string }

    const [findOptions] = useObservable('currentValue', props.findOptions, {
      filter: (newValue, lastValue) => {
        const newFilter = newValue.filter?.[props.fieldName] as FilterType<{ [K in typeof props.fieldName]: string }>
        const lastFilter = lastValue.filter?.[props.fieldName] as FilterType<{ [K in typeof props.fieldName]: string }>
        return newFilter?.$regex !== lastFilter?.$regex
      },
    })

    const currentValue = (findOptions.filter?.[props.fieldName] as FilterType<Record<string, string>>)?.$regex || ''

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
        validate={(data): data is SearchSubmitType =>
          typeof (data as SearchSubmitType).searchValue?.length === 'number'
        }
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
          value={typeof currentValue === 'string' ? currentValue : ''}
          labelProps={{
            style: { padding: '0px 2em' },
          }}
        />
        <div style={{ display: 'flex', width: '64px', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
          <Button
            type="reset"
            style={{ padding: '4px', margin: '0' }}
            onclick={(ev) => {
              ev.preventDefault()
              ev.stopPropagation()
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

export const DataGridHeader: <T, Column extends string>(
  props: DataGridHeaderProps<T, Column>,
  children: ChildrenList,
  findOptions: ObservableValue<FindOptions<T, Array<keyof T>>>,
) => JSX.Element<any> = Shade({
  shadowDomName: 'data-grid-header',
  render: ({ props, element, useObservable }) => {
    const [, setIsSearchOpened] = useObservable('isSearchOpened', new ObservableValue(false), {
      onChange: (newValue) => {
        const searchForm = element.querySelector('.search-form') as HTMLElement
        const headerContent = element.querySelector('.header-content') as HTMLElement
        if (!newValue) {
          void collapse(searchForm)
          void expand(headerContent)
        } else {
          searchForm.style.display = 'flex'
          void expand(searchForm).then(async () => {
            await sleepAsync(100)
            searchForm.querySelector('input')?.focus()
          })
          void collapse(headerContent)
        }
      },
    })

    const [findOptions, setFindOptions] = useObservable('findOptions', props.findOptions)

    const updateSearchValue = (value?: string) => {
      if (value) {
        const newSettings = {
          ...findOptions,
          filter: {
            ...findOptions.filter,
            [props.field]: { $regex: value },
          },
        } as typeof findOptions
        setFindOptions(newSettings)
      } else {
        const { [props.field]: _, ...newFilter } = findOptions.filter || {}
        setFindOptions({ ...findOptions, filter: newFilter })
      }

      setIsSearchOpened(false)
    }

    return (
      <>
        <SearchForm
          onSubmit={updateSearchValue}
          onClear={updateSearchValue}
          fieldName={props.field}
          findOptions={props.findOptions}
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
              findOptions={props.findOptions}
              fieldName={props.field}
            />

            <OrderButton field={props.field} findOptions={props.findOptions} />
          </div>
        </div>
      </>
    )
  },
})
