import { createComponent, Shade } from '@furystack/shades'
import { PageContainer, PageHeader, Paper, Tabs } from '@furystack/shades-common-components'

export const TabsPage = Shade({
  shadowDomName: 'tabs-page',
  render: () => {
    return (
      <PageContainer maxWidth="800px" centered>
        <PageHeader
          icon="📑"
          title="Tabs"
          description="The Tabs component organizes content into switchable panels with a tab header strip. Each tab can have a custom header element and associated content panel. Tabs integrate with URL hash navigation, allowing deep linking to specific tabs. Use tabs to divide complex interfaces into logical sections while keeping related content accessible."
        />
        <Paper elevation={3} style={{ padding: '32px' }}>
          <Tabs
            tabs={[
              {
                header: <span>Tab1</span>,
                component: <Paper>An example tab value for tab 1</Paper>,
                hash: '',
              },
              {
                header: <span>Tab2</span>,
                component: <Paper>An example tab value for tab 2</Paper>,
                hash: 'tab-2',
              },
            ]}
          />
        </Paper>
      </PageContainer>
    )
  },
})
