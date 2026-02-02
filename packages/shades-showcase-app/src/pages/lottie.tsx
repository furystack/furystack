import { createComponent, Shade } from '@furystack/shades'
import { Paper } from '@furystack/shades-common-components'
import '@furystack/shades-lottie'
import type { LottiePlayer } from '@lottiefiles/lottie-player'
import lottieExample from './lottie-example.json' with { type: 'json' }

export const LottiePage = Shade({
  shadowDomName: 'lottie-page',
  css: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'column',
  },
  render: () => {
    const example = JSON.stringify(lottieExample)
    return (
      <Paper elevation={3} style={{ padding: '32px' }}>
        <h1>Lottie</h1>
        <lottie-player
          style={{ width: '250px', height: '250px', position: 'sticky', top: '0' }}
          src={example}
          loop
          onclick={(ev) => {
            ;(ev.currentTarget as LottiePlayer)?.play()
          }}
        ></lottie-player>
      </Paper>
    )
  },
})
