import { Shade, createComponent } from '@furystack/shades'
import { cssVariableTheme } from '../services/css-variable-theme.js'
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

  /**
   * The color of the loader
   */
  borderColor?: string

  /**
   * The width of the border
   */
  borderWidth?: number
}

export const Loader = Shade<LoaderProps>({
  tagName: 'shade-loader',
  css: {
    display: 'inline-block',
    transformOrigin: 'center',
    opacity: '0',
  },
  render: ({ element, props, injector }) => {
    const { theme } = injector.getInstance(ThemeProviderService)

    const { delay = 500 } = props
    const { borderWidth = 15 } = props
    const { borderColor = theme.palette.primary.main } = props

    setTimeout(() => {
      void promisifyAnimation(element, [{ opacity: '0' }, { opacity: '1' }], {
        duration: 500,
        delay,
        fill: 'forwards',
      })
      void promisifyAnimation(
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
          width: `calc(100% - ${borderWidth * 2}px)`,
          height: `calc(100% - ${borderWidth * 2}px)`,
          border: `${borderWidth}px solid ${cssVariableTheme.action.subtleBorder}`,
          borderBottom: `${borderWidth}px solid ${borderColor}`,
          borderRadius: cssVariableTheme.shape.borderRadius.full,
        }}
      />
    )
  },
})
