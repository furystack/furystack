import { Shade, createComponent } from '@furystack/shades'
import { ThemeProviderService } from '../services'
import { promisifyAnimation } from '../utils'

interface LoaderProps {
  style?: Partial<CSSStyleDeclaration>
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
          width: '100%',
          height: '100%',
          border: '15px solid #f3f3f3',
          borderBottom: '15px solid red',
          borderRadius: '50%',
        }}
      />
    )
  },
})
