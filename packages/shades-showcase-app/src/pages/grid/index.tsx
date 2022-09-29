import type { TestClass } from '@furystack/core'
import { createComponent, Shade } from '@furystack/shades'
import { DataGrid, SelectionCell } from '@furystack/shades-common-components'
import { GridPageService } from './grid-page-service'
import { GridStatus } from './grid-status'

export const GridPage = Shade<{}, { service: GridPageService }>({
  shadowDomName: 'shades-grid-page',
  getInitialState: ({ injector }) => {
    return {
      service: injector.getInstance(GridPageService).init(),
    }
  },
  render: ({ getState }) => {
    return (
      <div
        style={{
          height: 'calc(100% - 96px)',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'end',
          }}
        >
          <h1>Grid</h1>
          <GridStatus />
        </div>
        <DataGrid<TestClass>
          columns={['id', 'stringValue1', 'stringValue2', 'booleanValue', 'dateValue', 'numberValue1', 'numberValue2']}
          styles={undefined}
          service={getState().service.collectionService}
          headerComponents={{}}
          rowComponents={{
            id: (entry) => <SelectionCell entry={entry} service={getState().service.collectionService} />,
            booleanValue: ({ booleanValue }) => <span>{booleanValue ? `✅` : `❌`}</span>,
            dateValue: ({ dateValue }) => <span>{dateValue.toLocaleString()}</span>,
            numberValue1: ({ numberValue1 }) => <span>{numberValue1.toFixed(2)}</span>,
            numberValue2: ({ numberValue2 }) => <span>{numberValue2.toFixed(2)}</span>,
          }}
        />
      </div>
    )
  },
})
