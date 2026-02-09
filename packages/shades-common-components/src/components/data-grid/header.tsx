import type { FilterType, FindOptions } from '@furystack/core'
import type { ChildrenList } from '@furystack/shades'
import { Shade, createComponent } from '@furystack/shades'
import { ObservableValue, sleepAsync } from '@furystack/utils'
import { collapse, expand } from '../animations.js'
import { Button } from '../button.js'
import { Form } from '../form.js'
import { Icon } from '../icons/icon.js'
import { arrowDown, arrowUp, arrowUpDown, close as closeIcon, search as searchIcon } from '../icons/icon-definitions.js'
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
  css: {
    display: 'inline-block',
  },
  render: ({ props, useObservable }) => {
    const [findOptions, onFindOptionsChange] = useObservable('findOptions', props.findOptions, {})

    const currentOrder = Object.keys(findOptions.order || {})[0]
    const currentOrderDirection = Object.values(findOptions.order || {})[0]
    return (
      <Button
        title="Change order"
        variant="outlined"
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
        {(currentOrder === props.field &&
          (currentOrderDirection === 'ASC' ? (
            <Icon icon={arrowDown} size={16} />
          ) : (
            <Icon icon={arrowUp} size={16} />
          ))) || <Icon icon={arrowUpDown} size={16} />}
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
  css: {
    display: 'inline-block',
  },
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
        variant="outlined"
        color={filterValue ? 'info' : undefined}
        onclick={props.onclick}
      >
        <Icon icon={searchIcon} size={16} />
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
  css: {
    display: 'block',
    '& .search-form': {
      display: 'flex',
      width: '100%',
      overflow: 'hidden',
      height: '0px',
      justifyContent: 'space-around',
      opacity: '0',
    },
    '& .search-form-actions': {
      display: 'flex',
      width: '64px',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '8px',
    },
  },
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
        validate={(data): data is SearchSubmitType =>
          typeof (data as SearchSubmitType).searchValue?.length === 'number'
        }
        onSubmit={({ searchValue }) => {
          props.onSubmit(searchValue)
        }}
      >
        <Input
          placeholder={props.fieldName}
          autofocus
          labelTitle={`${props.fieldName}`}
          name="searchValue"
          value={typeof currentValue === 'string' ? currentValue : ''}
          labelProps={{
            style: { padding: '0px 2em' },
          }}
        />
        <div className="search-form-actions">
          <Button
            type="reset"
            variant="outlined"
            onclick={(ev) => {
              ev.preventDefault()
              ev.stopPropagation()
              props.onClear()
            }}
          >
            <Icon icon={closeIcon} size={16} />
          </Button>
          <Button variant="outlined" type="submit">
            <Icon icon={searchIcon} size={16} />
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
  css: {
    display: 'block',
    '& .header-content': {
      display: 'flex',
      width: '100%',
      height: '48px',
      justifyContent: 'space-between',
      alignItems: 'center',
      gap: '12px',
      overflow: 'hidden',
    },
    '& .header-field-name': {
      fontWeight: '600',
    },
    '& .header-controls': {
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      gap: '4px',
    },
  },
  render: ({ props, useObservable, useRef }) => {
    const searchFormRef = useRef<HTMLElement>('searchForm')
    const headerContentRef = useRef<HTMLDivElement>('headerContent')

    const [, setIsSearchOpened] = useObservable('isSearchOpened', new ObservableValue(false), {
      onChange: (newValue) => {
        const searchForm = searchFormRef.current?.querySelector('.search-form') as HTMLElement | null
        const headerContent = headerContentRef.current
        if (!searchForm || !headerContent) return
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
        <div ref={searchFormRef} style={{ display: 'contents' }}>
          <SearchForm
            onSubmit={updateSearchValue}
            onClear={updateSearchValue}
            fieldName={props.field}
            findOptions={props.findOptions}
          />
        </div>
        <div ref={headerContentRef} className="header-content">
          <div className="header-field-name">{props.field}</div>
          <div className="header-controls">
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
