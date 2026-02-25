import { createComponent, Shade } from '@furystack/shades'
import { Icon, icons, PageContainer, PageHeader, Paper, Rating, Typography } from '@furystack/shades-common-components'

export const RatingPage = Shade({
  shadowDomName: 'rating-page',
  render: ({ useSearchState }) => {
    const [state, setState] = useSearchState('rating', { value: 3 })

    return (
      <PageContainer centered>
        <PageHeader
          icon={<Icon icon={icons.star} />}
          title="Rating"
          description="The Rating component allows users to provide feedback with star ratings. It supports full and half-star precision, custom icons, multiple sizes, palette colors, read-only and disabled states, hover feedback, and keyboard navigation."
        />
        <Paper elevation={3} style={{ padding: '32px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div>
            <Typography variant="h6" style={{ margin: '0 0 12px 0' }}>
              Basic
            </Typography>
            <Rating value={3} readOnly />
          </div>

          <div>
            <Typography variant="h6" style={{ margin: '0 0 12px 0' }}>
              Half Precision
            </Typography>
            <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap', alignItems: 'center' }}>
              <Rating value={2.5} precision={0.5} readOnly />
              <Rating value={3.5} precision={0.5} readOnly />
              <Rating value={0.5} precision={0.5} readOnly />
            </div>
          </div>

          <div>
            <Typography variant="h6" style={{ margin: '0 0 12px 0' }}>
              Sizes
            </Typography>
            <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap', alignItems: 'center' }}>
              <Rating value={3} size="small" readOnly />
              <Rating value={3} size="medium" readOnly />
              <Rating value={3} size="large" readOnly />
            </div>
          </div>

          <div>
            <Typography variant="h6" style={{ margin: '0 0 12px 0' }}>
              Custom Icons
            </Typography>
            <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap', alignItems: 'center' }}>
              <Rating
                value={3}
                icon={<Icon icon={icons.heart} size="small" />}
                emptyIcon={<Icon icon={icons.heartOutline} size="small" />}
                readOnly
              />
              <Rating
                value={4}
                icon={<Icon icon={icons.flame} size="small" />}
                emptyIcon={<Icon icon={icons.wind} size="small" />}
                readOnly
              />
            </div>
          </div>

          <div>
            <Typography variant="h6" style={{ margin: '0 0 12px 0' }}>
              Colors
            </Typography>
            <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap', alignItems: 'center' }}>
              <Rating value={3} color="primary" readOnly />
              <Rating value={3} color="secondary" readOnly />
              <Rating value={3} color="error" readOnly />
              <Rating value={3} color="warning" readOnly />
              <Rating value={3} color="success" readOnly />
              <Rating value={3} color="info" readOnly />
            </div>
          </div>

          <div>
            <Typography variant="h6" style={{ margin: '0 0 12px 0' }}>
              Read-only
            </Typography>
            <Rating value={4} readOnly />
          </div>

          <div>
            <Typography variant="h6" style={{ margin: '0 0 12px 0' }}>
              Disabled
            </Typography>
            <Rating value={2} disabled />
          </div>

          <div>
            <Typography variant="h6" style={{ margin: '0 0 12px 0' }}>
              Interactive
            </Typography>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <Rating value={state.value} precision={0.5} onValueChange={(newValue) => setState({ value: newValue })} />
              <span style={{ fontSize: '14px', color: 'var(--shades-theme-text-secondary)' }}>
                Value: {state.value}
              </span>
            </div>
          </div>
        </Paper>
      </PageContainer>
    )
  },
})
