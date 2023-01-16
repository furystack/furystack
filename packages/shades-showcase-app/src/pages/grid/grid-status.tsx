import type { TestClass } from '@furystack/core'
import { createComponent, Shade } from '@furystack/shades'
import { Input } from '@furystack/shades-common-components'

import { GridPageService } from './grid-page-service'

export const GridStatus = Shade<
  unknown,
  { gridService: GridPageService; focusedEntry?: TestClass; selection: TestClass[] }
>({
  shadowDomName: 'shades-grid-status',
  getInitialState: ({ injector }) => {
    const gridService = injector.getInstance(GridPageService)
    return {
      gridService,
      selection: gridService.collectionService.selection.getValue(),
      focusedEntry: gridService.collectionService.focusedEntry.getValue(),
    }
  },
  resources: ({ useState }) => {
    const [gridService] = useState('gridService')
    const [, setFocusedEntry] = useState('focusedEntry')
    const [, setSelection] = useState('selection')
    return [
      gridService.collectionService.focusedEntry.subscribe(setFocusedEntry),
      gridService.collectionService.selection.subscribe(setSelection),
    ]
  },
  render: ({ useState }) => {
    const [focusedEntry] = useState('focusedEntry')
    const [selection] = useState('selection')
    return (
      <div
        style={{
          display: 'flex',
        }}
        data-selectionLength={selection.length}
        data-focusedEntry={focusedEntry ? focusedEntry.id : undefined}
      >
        <Input labelTitle="Focused Entry" readOnly name="focusedEntry" value={focusedEntry?.stringValue1 ?? '-'} />
        <Input labelTitle="Selection count" readOnly name="selectionCount" value={selection.length.toString() ?? '-'} />
      </div>
    )
  },
})
