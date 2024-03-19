import { createComponent, Shade } from '@furystack/shades'
import type { CollectionService } from '../../services/collection-service.js'

export const SelectionCell = Shade<{ entry: any; service: CollectionService<any> }>({
  shadowDomName: 'shades-data-grid-selection-cell',
  render: ({ props, useObservable, element }) => {
    const [selection] = useObservable('selection', props.service.selection, {
      onChange: (newSelection) => {
        ;(element.querySelector('input') as HTMLInputElement).checked = newSelection.includes(props.entry)
      },
    })
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
