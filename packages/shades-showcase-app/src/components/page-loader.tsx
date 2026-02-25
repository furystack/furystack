import { createComponent, Shade } from '@furystack/shades'
import { Skeleton, Typography } from '@furystack/shades-common-components'

export const PageLoader = Shade({
  shadowDomName: 'shade-page-loader',
  render: () => {
    return (
      <>
        <Typography variant="h3">
          <Skeleton delay={0} />
        </Typography>
        {new Array(15).fill(0).map((_, i) => (
          <Typography variant="body1">
            <Skeleton delay={i * 10} />
          </Typography>
        ))}
      </>
    )
  },
})
