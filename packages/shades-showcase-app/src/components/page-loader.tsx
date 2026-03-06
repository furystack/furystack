import { createComponent, Shade } from '@furystack/shades'
import { PageContainer, Paper, Skeleton, Typography } from '@furystack/shades-common-components'

export const PageLoader = Shade({
  shadowDomName: 'shade-page-loader',
  render: () => {
    return (
      <PageContainer centered>
        <Paper elevation={2} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <Typography variant="h4" style={{ margin: '0' }}>
            <Skeleton delay={0} />
          </Typography>
          <Typography variant="body1" style={{ margin: '0' }}>
            <Skeleton delay={10} />
          </Typography>
        </Paper>
        <Paper elevation={3} style={{ padding: '32px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {new Array(10).fill(0).map((_, i) => (
            <Typography variant="body1" style={{ margin: '0' }}>
              <Skeleton delay={20 + i * 10} />
            </Typography>
          ))}
        </Paper>
      </PageContainer>
    )
  },
})
