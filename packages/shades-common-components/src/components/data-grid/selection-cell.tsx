import { createComponent, Shade } from '@furystack/shades'
import type { CollectionService } from '../../services'

export const SelectionCell = Shade<{ entry: any; service: CollectionService<any> }, { isSelected?: boolean }>({
  shadowDomName: 'shades-data-grid-selection-cell',
  getInitialState: ({ props }) => ({ isSelected: props.service.isSelected(props.entry) }),
  render: ({ props, useObservable, useState }) => {
    const [selected, setSelected] = useState('isSelected')

    useObservable('selection', props.service.selection, (selection) => {
      setSelected(selection.includes(props.entry))
    })

    return (
      <input
        onchange={() => {
          props.service.toggleSelection(props.entry)
        }}
        type="checkbox"
        checked={selected}
      />
    )
  },
})
