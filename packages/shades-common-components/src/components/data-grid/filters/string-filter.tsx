import { createComponent, Shade } from '@furystack/shades'
import type { ObservableValue } from '@furystack/utils'
import { Button } from '../../button.js'
import { SegmentedControl } from '../../button-group.js'
import { Icon } from '../../icons/icon.js'
import { close as closeIcon, search as searchIcon } from '../../icons/icon-definitions.js'
import type { FilterableFindOptions } from '../data-grid.js'
import { cssVariableTheme } from '../../../services/css-variable-theme.js'
import { filterBaseCss, filterInputCss } from './filter-styles.js'

type StringOperator = '$regex' | '$startsWith' | '$endsWith' | '$eq'

const operatorLabels: Record<StringOperator, string> = {
  $regex: 'Contains',
  $startsWith: 'Starts with',
  $endsWith: 'Ends with',
  $eq: 'Equals',
}

export const StringFilter = Shade<{
  field: string
  findOptions: ObservableValue<FilterableFindOptions>
  onClose: () => void
}>({
  shadowDomName: 'data-grid-string-filter',
  css: {
    ...filterBaseCss,
    fontFamily: cssVariableTheme.typography.fontFamily,
    '& input': filterInputCss,
  },
  render: ({ props, useObservable, useState }) => {
    const [findOptions, setFindOptions] = useObservable('findOptions', props.findOptions)

    const currentFilter = findOptions.filter?.[props.field] as Record<string, string> | undefined
    const currentOperator: StringOperator = currentFilter
      ? ((Object.keys(currentFilter).find((k) => k in operatorLabels) as StringOperator) ?? '$regex')
      : '$regex'
    const currentValue = currentFilter?.[currentOperator] ?? ''

    const applyFilter = (operator: StringOperator, value: string) => {
      const filter = { ...findOptions.filter }
      if (!value) {
        delete filter[props.field]
      } else {
        filter[props.field] = { [operator]: value }
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

    const [selectedOperator, setSelectedOperator] = useState<StringOperator>('selectedOperator', currentOperator)
    let inputValue = currentValue

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
            onValueChange={(v) => setSelectedOperator(v as StringOperator)}
            options={(Object.keys(operatorLabels) as StringOperator[]).map((op) => ({
              value: op,
              label: operatorLabels[op],
            }))}
          />
        </div>
        <div className="filter-row">
          <input
            data-testid="string-filter-value"
            type="text"
            placeholder="Filter value..."
            value={currentValue}
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
