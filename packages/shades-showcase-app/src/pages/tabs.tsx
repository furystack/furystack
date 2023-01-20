import { createComponent, Shade } from '@furystack/shades'
import { Paper, Tabs } from '@furystack/shades-common-components'

export const TabsPage = Shade({
  shadowDomName: 'tabs-page',
  render: () => {
    return (
      <div
        style={{
          position: 'fixed',
          top: '32px',
          left: '0',
          width: '100%',
          height: '100%',
          padding: '32px',
        }}
      >
        <h1>Tabs</h1>
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
      </div>
    )
  },
})
