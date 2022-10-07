import { Shade, createComponent } from '@furystack/shades'
import { ThemeProviderService } from '../services/theme-provider-service.js'
import { promisifyAnimation } from '../utils/promisify-animation.js'

interface LoaderProps {
  /**
   * Style declaration for the loader
   */
  style?: Partial<CSSStyleDeclaration>
  /**
   * The time to wait before the loader shows up
   */
  delay?: number
}

export const Loader = Shade<LoaderProps>({
  shadowDomName: 'shade-loader',
  resources: ({ injector, element }) => [
    injector.getInstance(ThemeProviderService).theme.subscribe((theme) => {
      const el = element.firstElementChild
      if (el) {
        ;(el as HTMLElement).style.borderBottom = `15px solid ${theme.palette.primary.main}`
      }
    }, true),
  ],
  render: ({ element, props }) => {
    element.style.display = 'inline-block'
    element.style.transformOrigin = 'center'
    element.style.opacity = '0'
    const { delay = 500 } = props

    setTimeout(() => {
      promisifyAnimation(element, [{ opacity: '0' }, { opacity: '1' }], {
        duration: 500,
        delay,
        fill: 'forwards',
      })
      promisifyAnimation(
        element.firstElementChild,
        [{ transform: 'rotate(0deg)' }, { transform: 'rotate(180deg)' }, { transform: 'rotate(360deg)' }],
        {
          duration: 1500,
          easing: 'ease-in-out',
          iterations: Infinity,
        },
      )
    }, 1)
    return (
      <div
        style={{
          position: 'relative',
          width: 'calc(100% - 30px)',
          height: 'calc(100% - 30px)',
          border: '15px solid rgba(128,128,128,0.1)',
          borderBottom: '15px solid red',
          borderRadius: '50%',
        }}
      />
    )
  },
})
