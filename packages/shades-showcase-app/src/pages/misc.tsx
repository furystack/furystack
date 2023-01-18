import { createComponent, Shade } from '@furystack/shades'
import { Avatar, Fab } from '@furystack/shades-common-components'

export const MiscPage = Shade({
  shadowDomName: 'shades-misc-page',
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
        <h1>Misc</h1>
        <div>
          <h2>Avatar</h2>
          <div style={{ display: 'flex', gap: '16px' }}>
            <Avatar title="Avatar" avatarUrl="avatar.jpg" />
            <Avatar title="Broken Avatar without fallback" avatarUrl="broken.jpg" />
            <Avatar title="Broken Avatar with fallback" avatarUrl="broken.jpg" fallback={<>👽</>} />
          </div>
        </div>
        <hr />
        <div>
          <h2>FAB (Bottom Right) </h2>
          <Fab>👍</Fab>
        </div>
      </div>
    )
  },
})
