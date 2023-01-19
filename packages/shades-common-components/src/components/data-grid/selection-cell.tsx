import { createComponent, Shade } from '@furystack/shades'
import type { CollectionService } from '../../services'

export const SelectionCell = Shade<{ entry: any; service: CollectionService<any> }>({
  shadowDomName: 'shades-data-grid-selection-cell',
  render: ({ props, useObservable }) => {
    const [selection] = useObservable('selection', props.service.selection)
    const isSelected = selection.includes(props.entry)

    return (
      <input
        onchange={() => {
          props.service.toggleSelection(props.entry)
        }}
        type="checkbox"
        checked={isSelected}
      />
    )
  },
})
