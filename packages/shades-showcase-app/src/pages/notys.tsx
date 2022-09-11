import { createComponent, createFragment, Shade } from '@furystack/shades'
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
        <div style={{ display: 'flex', gap: '32px', flexWrap: 'wrap' }}>
          <Button
            onclick={() => {
              notyService.addNoty({
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
              notyService.addNoty({
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
              notyService.addNoty({
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
              notyService.addNoty({
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
      </div>
    )
  },
})
