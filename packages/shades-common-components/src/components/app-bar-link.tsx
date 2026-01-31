import type { RouteLinkProps } from '@furystack/shades'
import { createComponent, LocationService, RouteLink, Shade } from '@furystack/shades'
import { match, type MatchOptions } from 'path-to-regexp'

export const AppBarLink = Shade<RouteLinkProps & { routingOptions?: MatchOptions }>({
  shadowDomName: 'shade-app-bar-link',
  css: {
    display: 'flex',
    height: '100%',
    textDecoration: 'none',
    alignItems: 'center',
    padding: '0 8px',
    transition: 'color .2s ease-in-out, transform .2s ease-in-out',
    cursor: 'pointer',
    color: 'var(--shades-theme-text-secondary)',
    opacity: '0.8',
    transform: 'scale(0.9)',
    '&.active': {
      color: 'var(--shades-theme-text-primary)',
      opacity: '1',
      transform: 'scale(1)',
    },
  },
  render: ({ children, props, useObservable, injector, element }) => {
    const [currentUrl] = useObservable('locationChange', injector.getInstance(LocationService).onLocationPathChanged)

    const isActive = !!match(props.href as string, props.routingOptions)(currentUrl)
    element.classList.toggle('active', isActive)

    return <RouteLink {...props}>{children}</RouteLink>
  },
})
