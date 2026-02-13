import { createComponent, Shade } from '@furystack/shades'
import { Icon, icons, PageContainer, PageHeader, Paper } from '@furystack/shades-common-components'
import '@furystack/shades-lottie'
import type { LottiePlayer } from '@lottiefiles/lottie-player'
import lottieExample from './lottie-example.json' with { type: 'json' }

export const LottiePage = Shade({
  shadowDomName: 'lottie-page',
  render: () => {
    const example = JSON.stringify(lottieExample)
    return (
      <PageContainer centered>
        <PageHeader
          icon={<Icon icon={icons.film} />}
          title="Lottie Animations"
          description="Lottie integration allows embedding high-quality vector animations exported from Adobe After Effects. The @furystack/shades-lottie package provides the lottie-player custom element that renders animations from JSON data. Animations can be controlled programmatically with play/pause, set to loop, and respond to user interactions like clicks."
        />
        <Paper elevation={3} style={{ padding: '32px' }}>
          <lottie-player
            style={{ width: '250px', height: '250px', position: 'sticky', top: '0' }}
            src={example}
            loop
            onclick={(ev) => {
              ;(ev.currentTarget as LottiePlayer)?.play()
            }}
          ></lottie-player>
        </Paper>
      </PageContainer>
    )
  },
})
