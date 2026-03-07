import type { FindOptions } from '@furystack/core'
import type { ChildrenList } from '@furystack/shades'
import { Shade, createComponent } from '@furystack/shades'
import { ToggleButton } from '../button-group.js'
import { arrowDown, arrowUp, arrowUpDown, filter as filterIcon } from '../icons/icon-definitions.js'
import { Icon } from '../icons/icon.js'
import { cssVariableTheme } from '../../services/css-variable-theme.js'
import type { ColumnFilterConfig, FilterableFindOptions } from './data-grid.js'
import { BooleanFilter } from './filters/boolean-filter.js'
import { DateFilter } from './filters/date-filter.js'
import { EnumFilter } from './filters/enum-filter.js'
import { FilterDropdown } from './filters/filter-dropdown.js'
import { NumberFilter } from './filters/number-filter.js'
import { StringFilter } from './filters/string-filter.js'

export type DataGridHeaderProps<T, Column extends string> = {
  field: Column
  findOptions: FindOptions<T, Array<keyof T>>
  onFindOptionsChange: (options: FindOptions<T, Array<keyof T>>) => void
  filterConfig?: ColumnFilterConfig
}

export const OrderButton = Shade<{
  field: string
  findOptions: FilterableFindOptions
  onFindOptionsChange: (options: FilterableFindOptions) => void
}>({
  customElementName: 'data-grid-order-button',
  css: {
    display: 'inline-block',
  },
  render: ({ props }) => {
    const { findOptions } = props

    const currentOrder = Object.keys(findOptions.order || {})[0]
    const currentOrderDirection = Object.values(findOptions.order || {})[0]
    return (
      <ToggleButton
        title="Change order"
        pressed={currentOrder === props.field}
        size="small"
        value={props.field}
        onclick={(ev) => {
          ev.stopPropagation()
          let newDirection: 'ASC' | 'DESC' = 'ASC'
          const newOrder: Record<string, 'ASC' | 'DESC'> = {}

          if (currentOrder === props.field) {
            newDirection = currentOrderDirection === 'ASC' ? 'DESC' : 'ASC'
          }
          newOrder[props.field] = newDirection
          props.onFindOptionsChange({
            ...findOptions,
            order: newOrder,
          })
        }}
      >
        {(currentOrder === props.field &&
          (currentOrderDirection === 'ASC' ? (
            <Icon icon={arrowDown} size={14} />
          ) : (
            <Icon icon={arrowUp} size={14} />
          ))) || <Icon icon={arrowUpDown} size={14} />}
      </ToggleButton>
    )
  },
})

const FilterButton = Shade<{
  field: string
  findOptions: FilterableFindOptions
  onclick: () => void
}>({
  customElementName: 'data-grid-filter-button',
  css: {
    display: 'inline-block',
  },
  render: ({ props }) => {
    const hasActiveFilter = !!props.findOptions.filter?.[props.field]

    return (
      <ToggleButton
        type="button"
        title="Filter"
        size="small"
        value={props.field}
        pressed={hasActiveFilter}
        onclick={(ev) => {
          ev.stopPropagation()
          props.onclick()
        }}
      >
        <Icon icon={filterIcon} size={14} />
      </ToggleButton>
    )
  },
})

const renderFilterComponent = (
  filterConfig: ColumnFilterConfig,
  field: string,
  findOptions: FilterableFindOptions,
  onFindOptionsChange: (options: FilterableFindOptions) => void,
  onClose: () => void,
): JSX.Element => {
  switch (filterConfig.type) {
    case 'number':
      return (
        <NumberFilter
          field={field}
          findOptions={findOptions}
          onFindOptionsChange={onFindOptionsChange}
          onClose={onClose}
        />
      )
    case 'boolean':
      return (
        <BooleanFilter
          field={field}
          findOptions={findOptions}
          onFindOptionsChange={onFindOptionsChange}
          onClose={onClose}
        />
      )
    case 'enum':
      return (
        <EnumFilter
          field={field}
          values={filterConfig.values}
          findOptions={findOptions}
          onFindOptionsChange={onFindOptionsChange}
          onClose={onClose}
        />
      )
    case 'date':
      return (
        <DateFilter
          field={field}
          findOptions={findOptions}
          onFindOptionsChange={onFindOptionsChange}
          onClose={onClose}
        />
      )
    case 'string':
      return (
        <StringFilter
          field={field}
          findOptions={findOptions}
          onFindOptionsChange={onFindOptionsChange}
          onClose={onClose}
        />
      )
    default: {
      const _exhaustive: never = filterConfig
      throw new Error(`Unknown filter type: ${(_exhaustive as ColumnFilterConfig).type}`)
    }
  }
}

export const DataGridHeader: <T, Column extends string>(
  props: DataGridHeaderProps<T, Column>,
  children: ChildrenList,
) => JSX.Element<any> = Shade({
  customElementName: 'data-grid-header',
  css: {
    display: 'block',
    fontFamily: cssVariableTheme.typography.fontFamily,
    position: 'relative',
    '& .header-content': {
      display: 'flex',
      width: '100%',
      height: '36px',
      justifyContent: 'space-between',
      alignItems: 'center',
      gap: '8px',
      overflow: 'hidden',
    },
    '& .header-field-name': {
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      whiteSpace: 'nowrap',
    },
    '& .header-controls': {
      display: 'flex',
      alignItems: 'center',
      gap: '2px',
      flexShrink: '0',
    },
  },
  render: ({ props, useState }) => {
    const [isFilterOpen, setIsFilterOpen] = useState('isFilterOpen', false)

    const closeFilter = () => setIsFilterOpen(false)

    const filterableFindOptions = props.findOptions as FilterableFindOptions
    const onFilterableChange = props.onFindOptionsChange as (options: FilterableFindOptions) => void

    return (
      <>
        <div className="header-content">
          <div className="header-field-name">{props.field}</div>
          <div className="header-controls">
            {props.filterConfig && (
              <FilterButton
                onclick={() => setIsFilterOpen(!isFilterOpen)}
                findOptions={filterableFindOptions}
                field={props.field}
              />
            )}
            <OrderButton
              field={props.field}
              findOptions={filterableFindOptions}
              onFindOptionsChange={onFilterableChange}
            />
          </div>
        </div>
        {isFilterOpen && props.filterConfig && (
          <FilterDropdown onClose={closeFilter}>
            {renderFilterComponent(
              props.filterConfig,
              props.field,
              filterableFindOptions,
              onFilterableChange,
              closeFilter,
            )}
          </FilterDropdown>
        )}
      </>
    )
  },
})
