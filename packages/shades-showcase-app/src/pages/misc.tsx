import { createComponent, Shade } from '@furystack/shades'
import { Avatar } from '@furystack/shades-common-components'

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
          <Avatar avatarUrl="http://broken.jpg" />
        </div>
      </div>
    )
  },
})
