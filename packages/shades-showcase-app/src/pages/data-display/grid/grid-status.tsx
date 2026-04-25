import { createComponent, Shade } from '@furystack/shades'
import { Input } from '@furystack/shades-common-components'

import type { GridPageService } from './grid-page-service.js'

/**
 * Props for the grid-status strip. The `service` is received from the
 * parent `<GridPage>` rather than resolved from the injector so the status
 * component inherits the page's explicit-service contract instead of
 * carrying its own lifecycle coupling.
 */
export type GridStatusProps = {
  service: GridPageService
}

export const GridStatus = Shade<GridStatusProps>({
  customElementName: 'shades-grid-status',
  render: ({ props, useObservable }) => {
    const { service } = props
    const [focusedEntry] = useObservable('focusedEntry', service.collectionService.focusedEntry)
    const [selection] = useObservable('selection', service.collectionService.selection)
    return (
      <div
        style={{
          display: 'flex',
        }}
        data-selectionLength={selection.length}
        data-focusedEntry={focusedEntry ? focusedEntry.id : undefined}
      >
        <Input labelTitle="Focused Entry" readOnly name="focusedEntry" value={focusedEntry?.name ?? '-'} />
        <Input labelTitle="Selection count" readOnly name="selectionCount" value={selection.length.toString() ?? '-'} />
      </div>
    )
  },
})
