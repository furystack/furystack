import { createComponent, Shade } from '@furystack/shades'
import { CollectionService } from '../../services'

export const SelectionCell = Shade<{ entry: any; service: CollectionService<any> }>({
  shadowDomName: 'shades-data-grid-selection-cell',
  resources: ({ props, element }) => [
    props.service.selection.subscribe((selection) => {
      if (selection.includes(props.entry)) {
        ;(element.firstChild as HTMLInputElement).checked = true
      } else {
        ;(element.firstChild as HTMLInputElement).checked = false
      }
    }),
  ],
  render: ({ props }) => {
    return (
      <input
        onchange={(ev) => {
          if ((ev.target as HTMLInputElement).checked) {
            props.service.selection.setValue([...props.service.selection.getValue(), props.entry])
          } else {
            props.service.selection.setValue([
              ...props.service.selection.getValue().filter((entry) => entry !== props.entry),
            ])
          }
        }}
        type="checkbox"
        checked={props.service.selection.getValue().includes(props.entry) ? true : false}
      />
    )
  },
})
