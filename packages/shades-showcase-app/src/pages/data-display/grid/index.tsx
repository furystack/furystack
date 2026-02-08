import { createComponent, Shade } from '@furystack/shades'
import { Button, DataGrid, PageContainer, PageHeader, Paper, SelectionCell } from '@furystack/shades-common-components'
import { GridPageService } from './grid-page-service.js'
import { GridStatus } from './grid-status.js'

export const GridPage = Shade({
  tagName: 'shades-grid-page',
  css: {
    height: `100%`,
    boxSizing: 'border-box',
    display: 'block',
    position: 'relative',
  },

  render: ({ injector }) => {
    const gridPageService = injector.getInstance(GridPageService)

    return (
      <PageContainer>
        <PageHeader
          icon="📊"
          title="Data Grid"
          description="DataGrid is a high-performance table component for displaying and interacting with large datasets. It supports column sorting, row selection with SelectionCell, and custom cell renderers for formatting dates, numbers, booleans, and action buttons. The grid integrates with CollectionService for data management and supports pagination through findOptions."
        />
        <Paper
          elevation={3}
          style={{
            display: 'flex',
            flexDirection: 'column',
            flex: '1',
            minHeight: '0',
            boxSizing: 'border-box',
            padding: '16px',
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'flex-end',
              alignItems: 'center',
              marginBottom: '8px',
            }}
          >
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
      </PageContainer>
    )
  },
})
