import { createComponent, Shade } from '@furystack/shades'
import { Input } from '@furystack/shades-common-components'

import { GridPageService } from './grid-page-service.js'

export const GridStatus = Shade({
  tagName: 'shades-grid-status',
  render: ({ useObservable, injector }) => {
    const gridService = injector.getInstance(GridPageService)
    const [focusedEntry] = useObservable('focusedEntry', gridService.collectionService.focusedEntry)
    const [selection] = useObservable('selection', gridService.collectionService.selection)
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
