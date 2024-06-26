import type { RouteLinkProps } from '@furystack/shades'
import { attachProps, createComponent, LocationService, RouteLink, Shade } from '@furystack/shades'
import { match, type MatchOptions } from 'path-to-regexp'
import { ThemeProviderService } from '../services/theme-provider-service.js'

export const AppBarLink = Shade<RouteLinkProps & { routingOptions?: MatchOptions }>({
  shadowDomName: 'shade-app-bar-link',
  render: ({ children, props, useObservable, injector, element }) => {
    const getAnchorStyle = (currentUrl: string) => {
      const isActive = !!match(props.href as string, props.routingOptions)(currentUrl)
      const themeProviderService = injector.getInstance(ThemeProviderService)
      const { theme } = themeProviderService
      return {
        display: 'flex',
        height: '100%',
        textDecoration: 'none',
        alignItems: 'center',
        padding: '0 8px',
        transition: 'color .2s ease-in-out, transform .2s ease-in-out',
        color: isActive ? theme.text.primary : theme.text.secondary,
        opacity: isActive ? '1' : '0.8',
        transform: isActive ? 'scale(1)' : 'scale(0.9)',
        cursor: 'pointer',
      }
    }

    const [currentUrl] = useObservable('locationChange', injector.getInstance(LocationService).onLocationPathChanged)

    attachProps(element as HTMLElement, { style: getAnchorStyle(currentUrl) })

    return <RouteLink {...props}>{children}</RouteLink>
  },
})
