import type { PartialElement } from '@furystack/shades'
import { attachProps } from '@furystack/shades'
import { Shade, createComponent } from '@furystack/shades'
import { ThemeProviderService } from '../services/theme-provider-service.js'

export const Paper = Shade<PartialElement<HTMLDivElement> & { elevation?: 1 | 2 | 3 }>({
  shadowDomName: 'shade-paper',
  style: {
    borderRadius: '3px',
    margin: '8px',
    padding: '6px 16px',
  },
  render: ({ injector, props, children, element }) => {
    const themeProvider = injector.getInstance(ThemeProviderService)
    const { elevation = 1 } = props

    attachProps(element, {
      ...props,
      style: {
        boxShadow: elevation ? `1px ${elevation}px ${elevation}px rgba(0,0,0,0.3)` : '',
        backgroundColor: themeProvider.theme.background.paper,
        color: themeProvider.theme.text.secondary,
      },
    })

    return <>{children}</>
  },
})
