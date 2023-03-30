import { createComponent, Shade } from '@furystack/shades'
import { Skeleton } from '@furystack/shades-common-components'

export const PageLoader = Shade({
  shadowDomName: 'shade-page-loader',
  render: () => {
    return (
      <div
        style={{
          position: 'fixed',
          top: '32px',
          left: '0',
          width: 'calc(100% - 64px)',
          height: '100%',
          padding: '32px',
        }}
      >
        <h1>
          <Skeleton delay={0} />
        </h1>
        {new Array(15).fill(0).map((_, i) => (
          <p>
            <Skeleton delay={i * 10} />
          </p>
        ))}
      </div>
    )
  },
})
