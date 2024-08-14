import { Shade } from '@furystack/shades'
import { promisifyAnimation } from '../utils/promisify-animation.js'

export type SkeletonProps = {
  /**
   * The time to wait before the skeleton shows up
   */
  delay?: number
}

export const Skeleton = Shade<SkeletonProps>({
  shadowDomName: 'shade-skeleton',
  style: {
    opacity: '0',
    display: 'inline-block',
    background: 'linear-gradient(-45deg, rgba(128,128,128,0.1), rgba(128,128,128,0.3), rgba(128,128,128,0.1))',
    backgroundSize: '400% 400%',
    width: '100%',
    height: '100%',
    minHeight: '1em',
  },
  render: ({ element, props }) => {
    const { delay = 1500 } = props
    setTimeout(() => {
      void promisifyAnimation(element, [{ opacity: 0 }, { opacity: 1 }], {
        fill: 'forwards',
        duration: 300,
        easing: 'ease-out',
        delay,
      }).then(() => {
        void promisifyAnimation(
          element,
          [{ backgroundPosition: '0% 50%' }, { backgroundPosition: '100% 50%' }, { backgroundPosition: '0% 50%' }],
          {
            duration: 10000,
            iterations: Infinity,
          },
        )
      })
    })

    return null
  },
})
