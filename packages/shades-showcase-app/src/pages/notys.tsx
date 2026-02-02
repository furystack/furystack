import { createComponent, Shade } from '@furystack/shades'
import { Button, NotyList, NotyService } from '@furystack/shades-common-components'

export const NotysPage = Shade({
  shadowDomName: 'shade-notys',
  css: { padding: '32px' },
  render: ({ injector }) => {
    const notyService = injector.getInstance(NotyService)
    return (
      <>
        <h1>Notys</h1>
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
      </>
    )
  },
})
