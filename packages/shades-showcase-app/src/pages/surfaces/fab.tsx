import { createComponent, Shade } from '@furystack/shades'
import { Fab, PageContainer, PageHeader, Paper } from '@furystack/shades-common-components'

export const FabPage = Shade({
  shadowDomName: 'shades-fab-page',
  render: () => {
    return (
      <PageContainer maxWidth="900px" centered>
        <PageHeader
          icon="⭕"
          title="FAB"
          description="Floating Action Button provides a prominent action button positioned at the screen corner."
        />
        <Paper elevation={3} style={{ padding: '32px' }}>
          <p>The FAB button is displayed at the bottom right corner of the screen.</p>
          <Fab>👍</Fab>
        </Paper>
      </PageContainer>
    )
  },
})
