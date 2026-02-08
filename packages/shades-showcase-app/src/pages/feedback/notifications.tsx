import { createComponent, Shade } from '@furystack/shades'
import { Button, NotyList, NotyService, PageContainer, PageHeader, Paper } from '@furystack/shades-common-components'

export const NotysPage = Shade({
  tagName: 'shade-notys',
  render: ({ injector }) => {
    const notyService = injector.getInstance(NotyService)
    return (
      <PageContainer maxWidth="800px" centered>
        <PageHeader
          icon="🔔"
          title="Notifications"
          description="The notification system consists of NotyService for dispatching notifications and NotyList for rendering them. Four notification types are available: info, success, warning, and error, each with distinct styling. Notifications appear as toast messages and can include a title and body content. Use notifications to provide feedback for user actions or system events."
        />
        <Paper elevation={3} style={{ padding: '32px' }}>
          <div style={{ display: 'flex', gap: '32px', flexWrap: 'wrap' }}>
            <Button
              onclick={() => {
                notyService.emit('onNotyAdded', {
                  type: 'info',
                  title: 'An example info noty',
                  body: <>This is an example info notification</>,
                })
              }}
              color="info"
            >
              Info
            </Button>
            <Button
              onclick={() => {
                notyService.emit('onNotyAdded', {
                  type: 'success',
                  title: 'An example success noty',
                  body: <>This is an example success notification</>,
                })
              }}
              color="success"
            >
              Success
            </Button>
            <Button
              onclick={() => {
                notyService.emit('onNotyAdded', {
                  type: 'warning',
                  title: 'An example warning noty',
                  body: <>This is an example warning notification</>,
                })
              }}
              color="warning"
            >
              Warning
            </Button>
            <Button
              onclick={() => {
                notyService.emit('onNotyAdded', {
                  type: 'error',
                  title: 'An example error noty',
                  body: <>This is an example error notification</>,
                })
              }}
              color="error"
            >
              Error
            </Button>
          </div>
          <NotyList />
        </Paper>
      </PageContainer>
    )
  },
})
