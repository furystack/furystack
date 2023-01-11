import type { RouteLinkProps } from '@furystack/shades'
import { createComponent, LocationService, RouteLink, Shade } from '@furystack/shades'
import { match } from 'path-to-regexp'
import { ThemeProviderService } from '../services'

export const AppBarLink = Shade<RouteLinkProps>({
  resources: ({ injector, props, element }) => {
    const updateColor = (isActive: boolean) => {
      const themeProviderService = injector.getInstance(ThemeProviderService)
      const { theme } = themeProviderService
      const el = element.querySelector('a') as HTMLElement
      el.style.color = isActive ? theme.text.primary : theme.text.secondary
      el.style.opacity = isActive ? '1' : '0.8'
      el.style.transform = isActive ? 'scale(1)' : 'scale(0.9)'
    }
    return [
      injector.getInstance(LocationService).onLocationChanged.subscribe(async (currentUrl) => {
        const isActive = !!match(props.href as string)(currentUrl)
        updateColor(isActive)
      }, true),
    ]
  },
  shadowDomName: 'shade-app-bar-link',
  render: ({ children, props }) => {
    return (
      <RouteLink
        style={{
          display: 'flex',
          height: '100%',
          textDecoration: 'none',
          alignItems: 'center',
          padding: '0 8px',
          transition: 'color .2s ease-in-out, transform .2s ease-in-out',
          ...props.style,
        }}
        {...props}
      >
        {children}
      </RouteLink>
    )
  },
})
