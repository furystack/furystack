import { createComponent, Shade } from '@furystack/shades'
import '@furystack/shades-lottie'
import type { LottiePlayer } from '@lottiefiles/lottie-player'
import lottieExample from './lottie-example.json'

export const LottiePage = Shade({
  shadowDomName: 'lottie-page',
  style: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'column',
  },
  render: () => {
    const example = JSON.stringify(lottieExample)
    return (
      <>
        <h1>Lottie</h1>
        <lottie-player
          style={{ width: '250px', height: '250px', position: 'sticky', top: '0' }}
          src={example}
          loop
          onclick={(ev) => {
            ;(ev.currentTarget as LottiePlayer)?.play()
          }}
        ></lottie-player>
      </>
    )
  },
})
