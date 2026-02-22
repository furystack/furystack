import type { FindOptions } from '@furystack/core'
import { createComponent, Shade } from '@furystack/shades'
import type { ObservableValue } from '@furystack/utils'
import { SegmentedControl } from '../../button-group.js'

type BooleanFilterValue = 'true' | 'false' | 'any'

export const BooleanFilter = Shade<{
  field: string
  findOptions: ObservableValue<FindOptions<any, any[]>>
  onClose: () => void
}>({
  shadowDomName: 'data-grid-boolean-filter',
  render: ({ props, useObservable }) => {
    const [findOptions, setFindOptions] = useObservable('findOptions', props.findOptions)

    const currentFilter = findOptions.filter?.[props.field] as { $eq?: boolean } | undefined
    const currentValue: BooleanFilterValue =
      currentFilter?.$eq === true ? 'true' : currentFilter?.$eq === false ? 'false' : 'any'

    const applyFilter = (value: BooleanFilterValue) => {
      const filter = { ...findOptions.filter }
      if (value === 'any') {
        delete filter[props.field]
      } else {
        filter[props.field] = { $eq: value === 'true' }
      }
      setFindOptions({ ...findOptions, filter, skip: 0 })
      props.onClose()
    }

    return (
      <SegmentedControl
        size="small"
        value={currentValue}
        onValueChange={(v) => applyFilter(v as BooleanFilterValue)}
        options={[
          { value: 'true', label: 'True' },
          { value: 'false', label: 'False' },
          { value: 'any', label: 'Any' },
        ]}
      />
    )
  },
})
