import { createComponent, Shade } from '@furystack/shades'
import { Button, DataGrid, LAYOUT_CSS_VARIABLES, Paper, SelectionCell } from '@furystack/shades-common-components'
import { GridPageService } from './grid-page-service.js'
import { GridStatus } from './grid-status.js'

export const GridPage = Shade({
  shadowDomName: 'shades-grid-page',

  render: ({ injector }) => {
    const gridPageService = injector.getInstance(GridPageService)

    return (
      <Paper
        elevation={3}
        style={{
          display: 'flex',
          flexDirection: 'column',
          height: `var(${LAYOUT_CSS_VARIABLES.contentAvailableHeight})`,
          padding: '16px',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'end',
          }}
        >
          <h1 style={{ margin: '0 0 16px 0' }}>Grid</h1>
          <GridStatus />
        </div>
        <div style={{ flex: '1', minHeight: '0', overflow: 'hidden' }}>
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
            findOptions={gridPageService.findOptions}
            styles={undefined}
            collectionService={gridPageService.collectionService}
            headerComponents={{
              customAction: () => <span style={{ paddingLeft: '1em' }}>Custom Action</span>,
            }}
            rowComponents={{
              id: (entry) => <SelectionCell entry={entry} service={gridPageService.collectionService} />,
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
      </Paper>
    )
  },
})
