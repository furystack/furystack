import type { PartialElement } from '@furystack/shades'
import { attachProps } from '@furystack/shades'
import { Shade, createComponent } from '@furystack/shades'
import { ThemeProviderService } from '../services/theme-provider-service'

export const Paper = Shade<PartialElement<HTMLDivElement> & { elevation?: 1 | 2 | 3 }>({
  shadowDomName: 'shade-paper',

  render: ({ injector, props, children, element }) => {
    const themeProvider = injector.getInstance(ThemeProviderService)
    const { elevation = 1 } = props

    attachProps(element, {
      ...props,
      style: {
        borderRadius: '3px',
        boxShadow: elevation ? `1px ${elevation}px ${elevation}px rgba(0,0,0,0.3)` : '',
        backgroundColor: themeProvider.theme.background.paper,
        color: themeProvider.theme.text.secondary,
        margin: '8px',
        padding: '6px 16px',
        ...props?.style,
      },
    })

    return <>{children}</>
  },
})
