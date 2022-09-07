import { createComponent, Shade } from '@furystack/shades'
import { Button, NotyList, NotyService } from '@furystack/shades-common-components'

export const NotysPage = Shade({
  shadowDomName: 'shade-notys',
  render: ({ injector }) => {
    const notyService = injector.getInstance(NotyService)
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
        <h1>Notys</h1>
        <div style={{ display: 'flex', gap: '32px' }}>
          <Button
            onclick={() => {
              notyService.addNoty({
                type: 'info',
                title: 'An example info noty',
                body: <p>This is an example info notification</p>,
              })
            }}
            color="info"
          >
            Info
          </Button>
          <Button
            onclick={() => {
              notyService.addNoty({
                type: 'success',
                title: 'An example success noty',
                body: <p>This is an example success notification</p>,
              })
            }}
            color="success"
          >
            Success
          </Button>
          <Button
            onclick={() => {
              notyService.addNoty({
                type: 'warning',
                title: 'An example warning noty',
                body: <p>This is an example warning notification</p>,
              })
            }}
            color="warning"
          >
            Warning
          </Button>
          <Button
            onclick={() => {
              notyService.addNoty({
                type: 'error',
                title: 'An example error noty',
                body: <p>This is an example error notification</p>,
              })
            }}
            color="error"
          >
            Error
          </Button>
        </div>
        <NotyList />
      </div>
    )
  },
})
