import { createComponent, Shade } from '@furystack/shades'
import '@furystack/shades-lottie'
import lottieExample from './lottie-example.json'

export const LottiePage = Shade({
  shadowDomName: 'lottie-page',
  render: () => {
    const example = JSON.stringify(lottieExample)
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'column',
        }}
      >
        <h1>Lottie</h1>
        <lottie-player
          style={{ width: '250px', height: '250px', position: 'sticky', top: '0' }}
          src={example}
          loop
          onclick={(ev) => {
            ;(ev.currentTarget as any)?.play()
          }}
        ></lottie-player>
      </div>
    )
  },
})
