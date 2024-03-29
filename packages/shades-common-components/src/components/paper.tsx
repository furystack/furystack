import { attachStyles } from '@furystack/shades'
import { Shade, createComponent } from '@furystack/shades'
import { ThemeProviderService } from '../services/theme-provider-service.js'

export const Paper = Shade<{ elevation?: 1 | 2 | 3 }>({
  shadowDomName: 'shade-paper',
  elementBase: HTMLDivElement,
  elementBaseName: 'div',
  style: {
    borderRadius: '3px',
    margin: '8px',
    padding: '6px 16px',
  },
  render: ({ injector, props, children, element }) => {
    const themeProvider = injector.getInstance(ThemeProviderService)
    const { elevation = 1 } = props

    attachStyles(element, {
      style: {
        boxShadow: elevation ? `1px ${elevation}px ${elevation}px rgba(0,0,0,0.3)` : '',
        backgroundColor: themeProvider.theme.background.paper,
        color: themeProvider.theme.text.secondary,
      },
    })

    return <>{children}</>
  },
})
