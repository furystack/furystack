import { createComponent, Shade } from '@furystack/shades'
import type { ColumnFilterConfig } from '@furystack/shades-common-components'
import {
  Button,
  DataGrid,
  Icon,
  icons,
  PageContainer,
  PageHeader,
  Paper,
  SelectionCell,
} from '@furystack/shades-common-components'
import { GridPageService } from './grid-page-service.js'
import { GridStatus } from './grid-status.js'
import { itemRarities, itemTypes } from './game-item.js'

const rarityColors: Record<string, string> = {
  common: '#9d9d9d',
  uncommon: '#1eff00',
  rare: '#0070dd',
  epic: '#a335ee',
  legendary: '#ff8000',
}

export const GridPage = Shade({
  customElementName: 'shades-grid-page',
  css: {
    height: `100%`,
    boxSizing: 'border-box',
    display: 'block',
    position: 'relative',
  },

  render: ({ injector, useObservable }) => {
    const gridPageService = injector.get(GridPageService)
    void gridPageService.init()
    const [findOptions, setFindOptions] = useObservable('findOptions', gridPageService.findOptions)

    return (
      <PageContainer>
        <PageHeader
          icon={<Icon icon={icons.barChart} />}
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
                'name',
                'type',
                'rarity',
                'level',
                'weight',
                'isQuestItem',
                'discoveredAt',
                'customAction',
              ]}
              findOptions={findOptions}
              onFindOptionsChange={setFindOptions}
              styles={undefined}
              collectionService={gridPageService.collectionService}
              columnFilters={
                {
                  name: { type: 'string' },
                  type: {
                    type: 'enum',
                    values: itemTypes.map((t) => ({ label: t, value: t })),
                  },
                  rarity: {
                    type: 'enum',
                    values: itemRarities.map((r) => ({ label: r, value: r })),
                  },
                  level: { type: 'number' },
                  isQuestItem: { type: 'boolean' },
                  discoveredAt: { type: 'date' },
                } satisfies Record<string, ColumnFilterConfig>
              }
              headerComponents={{
                customAction: () => <span style={{ paddingLeft: '1em' }}>Actions</span>,
              }}
              rowComponents={{
                id: (entry) => <SelectionCell entry={entry} service={gridPageService.collectionService} />,
                rarity: ({ rarity }) => (
                  <span
                    style={{
                      color: rarityColors[rarity],
                      fontWeight: rarity === 'legendary' || rarity === 'epic' ? 'bold' : 'normal',
                    }}
                  >
                    {rarity}
                  </span>
                ),
                isQuestItem: ({ isQuestItem }) => (
                  <span>
                    {isQuestItem ? <Icon icon={icons.check} size="small" /> : <Icon icon={icons.close} size="small" />}
                  </span>
                ),
                discoveredAt: ({ discoveredAt }) => <span>{discoveredAt.toLocaleDateString()}</span>,
                weight: ({ weight }) => <span>{weight.toFixed(2)} lbs</span>,
                customAction: () => (
                  <>
                    <Button>
                      <Icon icon={icons.rocket} size="small" />
                    </Button>
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
