import { createComponent, Shade } from '@furystack/shades'
import type { CollectionService } from '../../services/collection-service.js'
import { cssVariableTheme } from '../../services/css-variable-theme.js'

export const SelectionCell = Shade<{ entry: any; service: CollectionService<any> }>({
  shadowDomName: 'shades-data-grid-selection-cell',
  css: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    '& input[type="checkbox"]': {
      cursor: 'pointer',
      width: '18px',
      height: '18px',
      accentColor: cssVariableTheme.palette.primary.main,
    },
  },
  render: ({ props, useObservable, useRef }) => {
    const checkboxRef = useRef<HTMLInputElement>('checkbox')
    const [selection] = useObservable('selection', props.service.selection, {
      onChange: (newSelection) => {
        if (checkboxRef.current) {
          checkboxRef.current.checked = newSelection.includes(props.entry)
        }
      },
    })
    const isSelected = selection.includes(props.entry)

    return (
      <input
        ref={checkboxRef}
        onchange={() => {
          props.service.toggleSelection(props.entry)
        }}
        type="checkbox"
        checked={isSelected}
      />
    )
  },
})
