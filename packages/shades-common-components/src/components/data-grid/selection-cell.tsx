import { createComponent, Shade } from '@furystack/shades'
import type { CollectionService } from '../../services/collection-service.js'
import { cssVariableTheme } from '../../services/css-variable-theme.js'

export const SelectionCell = Shade<{ entry: any; service: CollectionService<any> }>({
  customElementName: 'shades-data-grid-selection-cell',
  css: {
    display: 'inline-flex',
    fontFamily: cssVariableTheme.typography.fontFamily,
    alignItems: 'center',
    justifyContent: 'center',
    '& input[type="checkbox"]': {
      cursor: 'pointer',
      width: '18px',
      height: '18px',
      accentColor: cssVariableTheme.palette.primary.main,
    },
  },
  render: ({ props, useObservable }) => {
    const [selection] = useObservable('selection', props.service.selection)
    const isSelected = selection.includes(props.entry)

    return (
      <input
        tabIndex={-1}
        onchange={() => {
          props.service.toggleSelection(props.entry)
        }}
        type="checkbox"
        checked={isSelected}
      />
    )
  },
})
