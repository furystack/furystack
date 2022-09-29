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
  resources: ({ getState, updateState }) => {
    const { gridService } = getState()
    return [
      gridService.collectionService.focusedEntry.subscribe((focusedEntry) => updateState({ focusedEntry })),
      gridService.collectionService.selection.subscribe((selection) => updateState({ selection })),
    ]
  },
  render: ({ getState }) => {
    const { focusedEntry, selection } = getState()
    return (
      <div
        style={{
          display: 'flex',
        }}
      >
        <Input labelTitle="Focused Entry" readOnly name="focusedEntry" value={focusedEntry?.stringValue1 ?? '-'} />
        <Input labelTitle="Selection count" readOnly name="selectionCount" value={selection.length.toString() ?? '-'} />
      </div>
    )
  },
})
