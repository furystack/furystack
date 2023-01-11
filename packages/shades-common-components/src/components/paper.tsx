import type { PartialElement } from '@furystack/shades'
import { Shade, createComponent } from '@furystack/shades'
import { ThemeProviderService } from '../services/theme-provider-service'

export const Paper = Shade<PartialElement<HTMLDivElement> & { elevation?: 1 | 2 | 3 }>({
  shadowDomName: 'shade-paper',

  render: ({ injector, props, children }) => {
    const themeProvider = injector.getInstance(ThemeProviderService)
    return (
      <div
        {...props}
        style={{
          borderRadius: '3px',
          boxShadow: props.elevation ? `1px ${props.elevation}px ${props.elevation}px rgba(0,0,0,0.3)` : '',
          backgroundColor: themeProvider.theme.background.paper,
          color: themeProvider.theme.text.secondary,
          margin: '8px',
          padding: '6px 16px',
          ...props?.style,
        }}
      >
        {children}
      </div>
    )
  },
})
