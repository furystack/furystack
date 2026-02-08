import { createComponent, Shade } from '@furystack/shades'
import { Image, ImageGroup, PageContainer, PageHeader, Paper } from '@furystack/shades-common-components'

const SAMPLE_IMAGES = [
  'https://picsum.photos/seed/shades1/400/300',
  'https://picsum.photos/seed/shades2/400/300',
  'https://picsum.photos/seed/shades3/400/300',
  'https://picsum.photos/seed/shades4/400/300',
]

const SectionTitle = ({ title }: { title: string }) => (
  <h3
    style={{
      margin: '0 0 12px',
      fontSize: '1.1rem',
      fontWeight: '600',
    }}
  >
    {title}
  </h3>
)

export const ImagePage = Shade({
  tagName: 'shades-image-page',
  render: () => {
    return (
      <PageContainer maxWidth="900px" centered>
        <PageHeader
          icon="🖼️"
          title="Image"
          description="Image displays images with preview lightbox, zoom/rotate, fallback support, lazy loading, and group navigation."
        />

        {/* Basic Usage */}
        <Paper elevation={3} style={{ padding: '32px', marginBottom: '24px' }}>
          <SectionTitle title="Basic Usage" />
          <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
            <Image src={SAMPLE_IMAGES[0]} alt="Sample image" width="200px" height="150px" />
            <Image src={SAMPLE_IMAGES[1]} alt="Contained image" width="200px" height="150px" objectFit="contain" />
          </div>
        </Paper>

        {/* Preview / Lightbox */}
        <Paper elevation={3} style={{ padding: '32px', marginBottom: '24px' }}>
          <SectionTitle title="Preview / Lightbox" />
          <p style={{ margin: '0 0 12px', opacity: '0.7', fontSize: '0.9rem' }}>
            Click an image to open the lightbox with zoom and rotate controls.
          </p>
          <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
            <Image src={SAMPLE_IMAGES[0]} alt="Preview image 1" width="200px" height="150px" preview />
            <Image src={SAMPLE_IMAGES[1]} alt="Preview image 2" width="200px" height="150px" preview />
          </div>
        </Paper>

        {/* Fallback */}
        <Paper elevation={3} style={{ padding: '32px', marginBottom: '24px' }}>
          <SectionTitle title="Fallback" />
          <p style={{ margin: '0 0 12px', opacity: '0.7', fontSize: '0.9rem' }}>
            When an image fails to load, fallback content is displayed.
          </p>
          <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'flex-start' }}>
            <Image src="broken-url.jpg" alt="Broken with default fallback" width="200px" height="150px" />
            <Image
              src="broken-url-2.jpg"
              alt="Broken with custom fallback"
              width="200px"
              height="150px"
              fallback={
                <span style={{ fontSize: '14px', textAlign: 'center', padding: '8px' }}>⚠️ Image not available</span>
              }
            />
          </div>
        </Paper>

        {/* Lazy Loading */}
        <Paper elevation={3} style={{ padding: '32px', marginBottom: '24px' }}>
          <SectionTitle title="Lazy Loading" />
          <p style={{ margin: '0 0 12px', opacity: '0.7', fontSize: '0.9rem' }}>
            Images with <code>lazy</code> prop use native lazy loading.
          </p>
          <Image src={SAMPLE_IMAGES[2]} alt="Lazy loaded image" width="300px" height="200px" lazy />
        </Paper>

        {/* Image Group */}
        <Paper elevation={3} style={{ padding: '32px', marginBottom: '24px' }}>
          <SectionTitle title="Image Group" />
          <p style={{ margin: '0 0 12px', opacity: '0.7', fontSize: '0.9rem' }}>
            Wrap images in an <code>ImageGroup</code> to enable gallery navigation in the lightbox. Click any image to
            browse through all of them.
          </p>
          <ImageGroup gap="12px">
            {SAMPLE_IMAGES.map((src, i) => (
              <Image src={src} alt={`Gallery image ${i + 1}`} width="180px" height="135px" preview />
            ))}
          </ImageGroup>
        </Paper>
      </PageContainer>
    )
  },
})
