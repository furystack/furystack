import type { NestedRouteLinkProps } from '@furystack/shades'
import { createComponent, LocationService, NestedRouteLink, Shade } from '@furystack/shades'
import { match, type MatchOptions } from 'path-to-regexp'
import { cssVariableTheme } from '../services/css-variable-theme.js'

export const AppBarLink = Shade<NestedRouteLinkProps & { routingOptions?: MatchOptions }>({
  shadowDomName: 'shade-app-bar-link',
  css: {
    display: 'flex',
    height: '100%',
    textDecoration: 'none',
    alignItems: 'center',
    padding: '0 8px',
    transition: 'color .2s ease-in-out, transform .2s ease-in-out',
    cursor: 'pointer',
    color: cssVariableTheme.text.secondary,
    opacity: '0.8',
    transform: 'scale(0.9)',
    '&.active': {
      color: cssVariableTheme.text.primary,
      opacity: '1',
      transform: 'scale(1)',
    },
  },
  render: ({ children, props, useObservable, injector, element }) => {
    const [currentUrl] = useObservable('locationChange', injector.getInstance(LocationService).onLocationPathChanged)

    const isActive = !!match(props.href, props.routingOptions)(currentUrl)
    element.classList.toggle('active', isActive)

    return <NestedRouteLink {...props}>{children}</NestedRouteLink>
  },
})
