import type { ChildrenList, ExtractRoutePaths, NestedRoute, NestedRouteLinkProps } from '@furystack/shades'
import { createComponent, LocationService, NestedRouteLink, Shade } from '@furystack/shades'
import { match, type MatchOptions } from 'path-to-regexp'
import { cssVariableTheme } from '../services/css-variable-theme.js'

export type AppBarLinkProps = NestedRouteLinkProps & { routingOptions?: MatchOptions }

export const AppBarLink = Shade<AppBarLinkProps>({
  shadowDomName: 'shade-app-bar-link',
  css: {
    display: 'flex',
    height: '100%',
    textDecoration: 'none',
    alignItems: 'center',
    padding: `0 ${cssVariableTheme.spacing.sm}`,
    transition: `color ${cssVariableTheme.transitions.duration.normal} ${cssVariableTheme.transitions.easing.easeInOut}, transform ${cssVariableTheme.transitions.duration.normal} ${cssVariableTheme.transitions.easing.easeInOut}`,
    cursor: 'pointer',
    color: cssVariableTheme.text.secondary,
    opacity: '0.8',
    transform: 'scale(0.9)',
    '&[data-active]': {
      color: cssVariableTheme.text.primary,
      opacity: '1',
      transform: 'scale(1)',
    },
  },
  render: ({ children, props, useObservable, injector, useHostProps }) => {
    const [currentUrl] = useObservable('locationChange', injector.getInstance(LocationService).onLocationPathChanged)

    const isActive = !!match(props.href, props.routingOptions)(currentUrl)
    if (isActive) {
      useHostProps({ 'data-active': '' })
    }

    return <NestedRouteLink {...props}>{children}</NestedRouteLink>
  },
})

/**
 * Creates a type-safe wrapper around AppBarLink constrained to a specific route tree.
 * The returned component has the same runtime behavior but narrows `href` to only accept
 * valid route paths, and requires `params` when the route has parameters.
 *
 * @typeParam TRoutes - The route tree type (use `typeof yourRoutes`)
 * @returns A type-safe AppBarLink component constrained to a specific route tree.
 */
export const createAppBarLink = <TRoutes extends Record<string, NestedRoute<unknown>>>() => {
  return AppBarLink as unknown as <TPath extends ExtractRoutePaths<TRoutes>>(
    props: AppBarLinkProps & { href: TPath },
    children?: ChildrenList,
  ) => JSX.Element
}
