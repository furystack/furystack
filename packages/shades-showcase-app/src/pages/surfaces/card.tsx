import { createComponent, Shade } from '@furystack/shades'
import {
  Button,
  Card,
  CardActions,
  CardContent,
  CardHeader,
  CardMedia,
  Chip,
  PageContainer,
  PageHeader,
  Paper,
} from '@furystack/shades-common-components'

const sampleImage = 'https://picsum.photos/seed/card-demo/600/400'
const sampleImage2 = 'https://picsum.photos/seed/card-recipe/600/400'
const sampleImage3 = 'https://picsum.photos/seed/card-travel/600/400'

export const CardPage = Shade({
  shadowDomName: 'shades-card-page',
  render: () => {
    return (
      <PageContainer maxWidth="900px" centered>
        <PageHeader
          icon="🃏"
          title="Card"
          description="Cards are surfaces that display content and actions about a single subject. They support elevation and outlined variants, and compose with CardHeader, CardContent, CardMedia, and CardActions."
        />

        <Paper elevation={3} style={{ padding: '32px', display: 'flex', flexDirection: 'column', gap: '32px' }}>
          <h3 style={{ margin: '0' }}>Basic Cards</h3>
          <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
            <Card style={{ width: '300px' }}>
              <CardContent>
                <p style={{ margin: '0' }}>
                  A simple card with content only. Cards provide a flexible container for grouping related information.
                </p>
              </CardContent>
            </Card>

            <Card variant="outlined" style={{ width: '300px' }}>
              <CardContent>
                <p style={{ margin: '0' }}>
                  An outlined card variant uses a border instead of elevation for a lighter visual treatment.
                </p>
              </CardContent>
            </Card>
          </div>

          <h3 style={{ margin: '0' }}>Elevation Levels</h3>
          <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
            {([0, 1, 2, 3] as const).map((elevation) => (
              <Card elevation={elevation} style={{ width: '180px' }}>
                <CardContent>
                  <p style={{ margin: '0', textAlign: 'center' }}>Elevation {elevation}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          <h3 style={{ margin: '0' }}>Card with Header</h3>
          <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
            <Card style={{ width: '350px' }}>
              <CardHeader title="Card Title" subheader="Secondary text goes here" />
              <CardContent>
                <p style={{ margin: '0' }}>The CardHeader component supports a title and optional subheader text.</p>
              </CardContent>
            </Card>

            <Card style={{ width: '350px' }}>
              <CardHeader
                title="With Avatar"
                subheader="January 15, 2026"
                avatar={
                  <div
                    style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '50%',
                      background: 'var(--shades-theme-palette-primary-main)',
                      color: 'var(--shades-theme-palette-primary-mainContrast)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 'bold',
                      fontSize: '16px',
                    }}
                  >
                    R
                  </div>
                }
                action={
                  <button
                    style={{
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      fontSize: '20px',
                      color: 'var(--shades-theme-text-secondary)',
                      padding: '4px',
                    }}
                  >
                    ⋮
                  </button>
                }
              />
              <CardContent>
                <p style={{ margin: '0' }}>This card includes an avatar and an action button in the header area.</p>
              </CardContent>
            </Card>
          </div>

          <h3 style={{ margin: '0' }}>Media Cards</h3>
          <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
            <Card style={{ width: '345px' }}>
              <CardMedia image={sampleImage} alt="Sample landscape" height="180px" />
              <CardHeader title="Scenic Landscape" subheader="Photography" />
              <CardContent>
                <p style={{ margin: '0' }}>
                  Cards can display rich media content with the CardMedia component. Images are rendered with
                  object-fit: cover.
                </p>
              </CardContent>
              <CardActions>
                <Button variant="outlined" onclick={() => alert('Share clicked')}>
                  Share
                </Button>
                <Button variant="outlined" onclick={() => alert('Learn More clicked')}>
                  Learn More
                </Button>
              </CardActions>
            </Card>

            <Card style={{ width: '345px' }}>
              <CardHeader
                title="Travel Guide"
                subheader="Explore the world"
                avatar={
                  <div
                    style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '50%',
                      background: 'var(--shades-theme-palette-info-main)',
                      color: 'var(--shades-theme-palette-info-mainContrast)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 'bold',
                      fontSize: '18px',
                    }}
                  >
                    T
                  </div>
                }
              />
              <CardMedia image={sampleImage3} alt="Travel destination" height="180px" />
              <CardContent>
                <p style={{ margin: '0' }}>
                  Media can be placed below the header for a different layout. Combine sub-components in any order.
                </p>
              </CardContent>
              <CardActions disableSpacing>
                <Button variant="outlined" onclick={() => alert('Book Now')}>
                  Book Now
                </Button>
              </CardActions>
            </Card>
          </div>

          <h3 style={{ margin: '0' }}>Clickable Cards</h3>
          <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
            <Card clickable style={{ width: '250px' }} onclick={() => alert('Elevation card clicked')}>
              <CardContent>
                <p style={{ margin: '0', textAlign: 'center' }}>Clickable elevation card</p>
              </CardContent>
            </Card>

            <Card
              clickable
              variant="outlined"
              style={{ width: '250px' }}
              onclick={() => alert('Outlined card clicked')}
            >
              <CardContent>
                <p style={{ margin: '0', textAlign: 'center' }}>Clickable outlined card</p>
              </CardContent>
            </Card>
          </div>

          <h3 style={{ margin: '0' }}>Recipe Card (Complex Example)</h3>
          <Card style={{ maxWidth: '400px' }}>
            <CardMedia image={sampleImage2} alt="Delicious pasta dish" height="220px" />
            <CardHeader
              title="Pasta Primavera"
              subheader="Prep: 15 min | Cook: 20 min"
              avatar={
                <div
                  style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '50%',
                    background: 'var(--shades-theme-palette-error-main)',
                    color: 'var(--shades-theme-palette-error-mainContrast)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 'bold',
                    fontSize: '18px',
                  }}
                >
                  P
                </div>
              }
            />
            <CardContent>
              <p style={{ margin: '0 0 12px 0' }}>
                A fresh and vibrant pasta dish loaded with seasonal vegetables, tossed in olive oil and garlic.
              </p>
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                <Chip size="small" color="success">
                  Vegetarian
                </Chip>
                <Chip size="small" color="info">
                  Quick
                </Chip>
                <Chip size="small" color="warning">
                  Seasonal
                </Chip>
              </div>
            </CardContent>
            <CardActions>
              <Button variant="outlined" onclick={() => alert('View Recipe')}>
                View Recipe
              </Button>
              <Button variant="outlined" onclick={() => alert('Save')}>
                Save
              </Button>
            </CardActions>
          </Card>
        </Paper>
      </PageContainer>
    )
  },
})
