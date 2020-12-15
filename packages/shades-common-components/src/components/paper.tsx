import { Shade, createComponent, PartialElement } from '@furystack/shades'
import { ThemeProviderService } from '../services/theme-provider-service'

export const Paper = Shade<PartialElement<HTMLDivElement> & { elevation?: 1 | 2 | 3 }>({
  shadowDomName: 'shade-paper',
  constructed: ({ injector, element }) => {
    const themeProvider = injector.getInstance(ThemeProviderService)
    const observable = themeProvider.theme.subscribe((newTheme) => {
      ;(element.firstChild as HTMLDivElement).style.background = newTheme.background.paper
      ;(element.firstChild as HTMLDivElement).style.color = themeProvider.theme.getValue().text.secondary
    })
    return () => observable.dispose()
  },
  render: ({ injector, props, children }) => {
    const themeProvider = injector.getInstance(ThemeProviderService)
    return (
      <div
        {...props}
        style={{
          borderRadius: '3px',
          boxShadow: props.elevation ? `1px ${props.elevation}px ${props.elevation}px rgba(0,0,0,0.3)` : '',
          backgroundColor: themeProvider.theme.getValue().background.paper,
          color: themeProvider.theme.getValue().text.secondary,
          margin: '8px',
          padding: '6px 16px',
          ...(props ? props.style : {}),
        }}>
        {children}
      </div>
    )
  },
})
