import { createComponent, Shade } from '@furystack/shades'
import { Carousel, PageContainer, PageHeader, Paper, Typography } from '@furystack/shades-common-components'

const sampleSlides = [
  { bg: '#1a237e', label: 'Slide 1', description: 'Deep indigo backdrop' },
  { bg: '#004d40', label: 'Slide 2', description: 'Dark teal backdrop' },
  { bg: '#b71c1c', label: 'Slide 3', description: 'Rich crimson backdrop' },
  { bg: '#f57f17', label: 'Slide 4', description: 'Warm amber backdrop' },
]

const SlideContent = ({ bg, label, description }: { bg: string; label: string; description: string }) => (
  <div
    style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      height: '250px',
      background: bg,
      color: '#fff',
      fontSize: '24px',
      fontWeight: 'bold',
      gap: '8px',
    }}
  >
    <span>{label}</span>
    <span style={{ fontSize: '14px', fontWeight: 'normal', opacity: '0.8' }}>{description}</span>
  </div>
)

const createSlides = () =>
  sampleSlides.map((s) => <SlideContent bg={s.bg} label={s.label} description={s.description} />)

export const CarouselPage = Shade({
  tagName: 'shades-carousel-page',
  render: () => {
    return (
      <PageContainer maxWidth="900px" centered>
        <PageHeader
          icon="🎠"
          title="Carousel"
          description="A carousel component for cycling through slides. Supports autoplay, dot indicators, slide/fade effects, vertical orientation, keyboard navigation, and swipe gestures."
        />

        <Paper elevation={3} style={{ padding: '32px', display: 'flex', flexDirection: 'column', gap: '32px' }}>
          <Typography variant="h3" style={{ margin: '0' }}>
            Basic
          </Typography>
          <Carousel slides={createSlides()} style={{ borderRadius: '8px' }} />

          <Typography variant="h3" style={{ margin: '0' }}>
            Autoplay
          </Typography>
          <Carousel slides={createSlides()} autoplay autoplayInterval={2500} style={{ borderRadius: '8px' }} />

          <Typography variant="h3" style={{ margin: '0' }}>
            Fade effect
          </Typography>
          <Carousel slides={createSlides()} effect="fade" style={{ borderRadius: '8px' }} />

          <Typography variant="h3" style={{ margin: '0' }}>
            Without dots
          </Typography>
          <Carousel slides={createSlides()} dots={false} style={{ borderRadius: '8px' }} />

          <Typography variant="h3" style={{ margin: '0' }}>
            Vertical
          </Typography>
          <Carousel slides={createSlides()} vertical style={{ borderRadius: '8px', height: '250px' }} />

          <Typography variant="h3" style={{ margin: '0' }}>
            Starting from slide 3
          </Typography>
          <Carousel slides={createSlides()} defaultActiveIndex={2} style={{ borderRadius: '8px' }} />
        </Paper>
      </PageContainer>
    )
  },
})
