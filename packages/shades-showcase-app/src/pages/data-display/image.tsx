import { createComponent, Shade } from '@furystack/shades'
import {
  Icon,
  icons,
  Image,
  ImageGroup,
  PageContainer,
  PageHeader,
  Paper,
  Typography,
} from '@furystack/shades-common-components'

import sample1 from './sample1.jpg'
import sample2 from './sample2.jpg'
import sample3 from './sample3.jpg'
import sample4 from './sample4.jpg'

const SAMPLE_IMAGES = [sample1, sample2, sample3, sample4]

const SectionTitle = ({ title }: { title: string }) => (
  <Typography variant="h6" style={{ margin: '0 0 12px' }}>
    {title}
  </Typography>
)

export const ImagePage = Shade({
  customElementName: 'shades-image-page',
  render: () => {
    return (
      <PageContainer centered>
        <PageHeader
          icon={<Icon icon={icons.image} />}
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
          <Typography variant="body2" color="textSecondary" style={{ margin: '0 0 12px' }}>
            Click an image to open the lightbox with zoom and rotate controls.
          </Typography>
          <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
            <Image src={SAMPLE_IMAGES[0]} alt="Preview image 1" width="200px" height="150px" preview />
            <Image src={SAMPLE_IMAGES[1]} alt="Preview image 2" width="200px" height="150px" preview />
          </div>
        </Paper>

        {/* Fallback */}
        <Paper elevation={3} style={{ padding: '32px', marginBottom: '24px' }}>
          <SectionTitle title="Fallback" />
          <Typography variant="body2" color="textSecondary" style={{ margin: '0 0 12px' }}>
            When an image fails to load, fallback content is displayed.
          </Typography>
          <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'flex-start' }}>
            <Image src="broken-url.jpg" alt="Broken with default fallback" width="200px" height="150px" />
            <Image
              src="broken-url-2.jpg"
              alt="Broken with custom fallback"
              width="200px"
              height="150px"
              fallback={
                <span
                  style={{
                    fontSize: '14px',
                    textAlign: 'center',
                    padding: '8px',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}
                >
                  <Icon icon={icons.warning} size="small" /> Image not available
                </span>
              }
            />
          </div>
        </Paper>

        {/* Lazy Loading */}
        <Paper elevation={3} style={{ padding: '32px', marginBottom: '24px' }}>
          <SectionTitle title="Lazy Loading" />
          <Typography variant="body2" color="textSecondary" style={{ margin: '0 0 12px' }}>
            Images with <code>lazy</code> prop use native lazy loading.
          </Typography>
          <Image src={SAMPLE_IMAGES[2]} alt="Lazy loaded image" width="300px" height="200px" lazy />
        </Paper>

        {/* Image Group */}
        <Paper elevation={3} style={{ padding: '32px', marginBottom: '24px' }}>
          <SectionTitle title="Image Group" />
          <Typography variant="body2" color="textSecondary" style={{ margin: '0 0 12px' }}>
            Wrap images in an <code>ImageGroup</code> to enable gallery navigation in the lightbox. Click any image to
            browse through all of them.
          </Typography>
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
