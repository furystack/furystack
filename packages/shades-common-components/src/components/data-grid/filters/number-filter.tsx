import { createComponent, Shade } from '@furystack/shades'
import type { ObservableValue } from '@furystack/utils'
import { Button } from '../../button.js'
import { SegmentedControl } from '../../button-group.js'
import { Icon } from '../../icons/icon.js'
import { close as closeIcon, search as searchIcon } from '../../icons/icon-definitions.js'
import type { FilterableFindOptions } from '../data-grid.js'
import { filterBaseCss, filterInputCss } from './filter-styles.js'

type NumberOperator = '$eq' | '$gt' | '$gte' | '$lt' | '$lte'

const operatorLabels: Record<NumberOperator, string> = {
  $eq: '=',
  $gt: '>',
  $gte: '>=',
  $lt: '<',
  $lte: '<=',
}

export const NumberFilter = Shade<{
  field: string
  findOptions: ObservableValue<FilterableFindOptions>
  onClose: () => void
}>({
  shadowDomName: 'data-grid-number-filter',
  css: {
    ...filterBaseCss,
    '& input': filterInputCss,
  },
  render: ({ props, useObservable, useState }) => {
    const [findOptions, setFindOptions] = useObservable('findOptions', props.findOptions)

    const currentFilter = findOptions.filter?.[props.field] as Record<string, number> | undefined
    const currentOperator: NumberOperator = currentFilter
      ? ((Object.keys(currentFilter).find((k) => k in operatorLabels) as NumberOperator) ?? '$eq')
      : '$eq'
    const currentValue = currentFilter?.[currentOperator]

    const applyFilter = (operator: NumberOperator, value: string) => {
      const num = parseFloat(value)
      const filter = { ...findOptions.filter }
      if (isNaN(num)) {
        delete filter[props.field]
      } else {
        filter[props.field] = { [operator]: num }
      }
      setFindOptions({ ...findOptions, filter, skip: 0 })
      props.onClose()
    }

    const clearFilter = () => {
      const filter = { ...findOptions.filter }
      delete filter[props.field]
      setFindOptions({ ...findOptions, filter, skip: 0 })
      props.onClose()
    }

    const [selectedOperator, setSelectedOperator] = useState<NumberOperator>('selectedOperator', currentOperator)
    let inputValue = currentValue !== undefined ? currentValue.toString() : ''

    return (
      <form
        onsubmit={(ev: Event) => {
          ev.preventDefault()
          applyFilter(selectedOperator, inputValue)
        }}
      >
        <div className="filter-row">
          <SegmentedControl
            size="small"
            value={selectedOperator}
            onValueChange={(v) => setSelectedOperator(v as NumberOperator)}
            options={(Object.keys(operatorLabels) as NumberOperator[]).map((op) => ({
              value: op,
              label: operatorLabels[op],
            }))}
          />
        </div>
        <div className="filter-row">
          <input
            data-testid="number-filter-value"
            type="number"
            step="any"
            placeholder="Value..."
            value={inputValue}
            autofocus
            oninput={(ev: Event) => {
              inputValue = (ev.target as HTMLInputElement).value
            }}
          />
        </div>
        <div className="filter-actions">
          <Button
            type="button"
            variant="outlined"
            size="small"
            onclick={clearFilter}
            startIcon={<Icon icon={closeIcon} size={14} />}
          >
            Clear
          </Button>
          <Button
            type="submit"
            variant="outlined"
            size="small"
            color="primary"
            startIcon={<Icon icon={searchIcon} size={14} />}
          >
            Apply
          </Button>
        </div>
      </form>
    )
  },
})
