import { createComponent, Shade } from '@furystack/shades'
import { Button, DataGrid, SelectionCell } from '@furystack/shades-common-components'
import { GridPageService } from './grid-page-service.js'
import { GridStatus } from './grid-status.js'

export const GridPage = Shade({
  shadowDomName: 'shades-grid-page',
  render: ({ injector }) => {
    const service = injector.getInstance(GridPageService)
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
        <DataGrid
          columns={[
            'id',
            'stringValue1',
            'stringValue2',
            'booleanValue',
            'dateValue',
            'numberValue1',
            'numberValue2',
            'customAction',
          ]}
          findOptions={service.findOptions}
          styles={undefined}
          collectionService={service.collectionService}
          headerComponents={{}}
          rowComponents={{
            id: (entry) => <SelectionCell entry={entry} service={service.collectionService} />,
            booleanValue: ({ booleanValue }) => <span>{booleanValue ? `✅` : `❌`}</span>,
            dateValue: ({ dateValue }) => <span>{dateValue.toLocaleString()}</span>,
            numberValue1: ({ numberValue1 }) => <span>{numberValue1.toFixed(2)}</span>,
            numberValue2: ({ numberValue2 }) => <span>{numberValue2.toFixed(2)}</span>,
            customAction: () => (
              <>
                <Button>🚀</Button>
              </>
            ),
          }}
        />
      </div>
    )
  },
})
