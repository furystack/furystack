import { createComponent, Shade } from '@furystack/shades'
import { Skeleton } from '@furystack/shades-common-components'

export const PageLoader = Shade({
  tagName: 'shade-page-loader',
  render: () => {
    return (
      <>
        <h1>
          <Skeleton delay={0} />
        </h1>
        {new Array(15).fill(0).map((_, i) => (
          <p>
            <Skeleton delay={i * 10} />
          </p>
        ))}
      </>
    )
  },
})
