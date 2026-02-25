import { createComponent, Shade } from '@furystack/shades'
import { Fab, PageContainer, PageHeader, Paper, Typography } from '@furystack/shades-common-components'

export const FabPage = Shade({
  shadowDomName: 'shades-fab-page',
  render: () => {
    return (
      <PageContainer centered>
        <PageHeader
          icon="⭕"
          title="FAB"
          description="Floating Action Button provides a prominent action button positioned at the screen corner."
        />
        <Paper elevation={3} style={{ padding: '32px' }}>
          <Typography variant="body1">The FAB button is displayed at the bottom right corner of the screen.</Typography>
          <Fab>👍</Fab>
        </Paper>
      </PageContainer>
    )
  },
})
