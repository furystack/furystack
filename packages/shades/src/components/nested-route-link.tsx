import { compileRoute } from '../compile-route.js'
import type { ChildrenList } from '../models/children-list.js'
import type { PartialElement } from '../models/partial-element.js'
import { LocationService } from '../services/location-service.js'
import { attachProps, createComponent } from '../shade-component.js'
import { Shade } from '../shade.js'
import type { NestedRoute } from './nested-router.js'
import type { ExtractRouteParams, ExtractRoutePaths } from './nested-route-types.js'

/**
 * Props for the NestedRouteLink component.
 * Combines SPA navigation from RouteLink with parameter compilation from LinkToRoute.
 */
export type NestedRouteLinkProps = {
  href: string
  params?: Record<string, string>
} & PartialElement<Omit<HTMLAnchorElement, 'onclick' | 'href'>>

/**
 * A link component for NestedRouter that supports SPA navigation with
 * optional route parameter compilation.
 *
 * Intercepts click events to use `history.pushState` for client-side navigation,
 * and compiles parameterized routes (e.g. `/users/:id`) when `params` is provided.
 */
export const NestedRouteLink = Shade<NestedRouteLinkProps>({
  shadowDomName: 'nested-route-link',
  elementBase: HTMLAnchorElement,
  elementBaseName: 'a',
  css: {
    color: 'inherit',
    textDecoration: 'inherit',
  },
  render: ({ children, props, injector, element }) => {
    const { href, params, ...anchorProps } = props
    const resolvedUrl = params ? compileRoute(href, params) : href

    attachProps(element, {
      ...anchorProps,
      href: resolvedUrl,
      onclick: (ev: MouseEvent) => {
        ev.preventDefault()
        history.pushState('', props.title || '', resolvedUrl)
        injector.getInstance(LocationService).updateState()
      },
    })
    return <>{children}</>
  },
})

/**
 * Props for a type-safe nested route link, constrained to valid route paths.
 * When the path contains parameters (e.g. `:id`), the `params` prop becomes required.
 * @typeParam TPath - A specific route path string
 */
export type TypedNestedRouteLinkProps<TPath extends string> = {
  href: TPath
} & (string extends keyof ExtractRouteParams<TPath>
  ? { params?: Record<string, string> }
  : { params: ExtractRouteParams<TPath> }) &
  PartialElement<Omit<HTMLAnchorElement, 'onclick' | 'href'>>

/**
 * Creates a type-safe wrapper around NestedRouteLink constrained to a specific route tree.
 * The returned component has the same runtime behavior but narrows `href` to only accept
 * valid route paths, and requires `params` when the route has parameters.
 *
 * @typeParam TRoutes - The route tree type (use `typeof yourRoutes`)
 * @returns A narrowed NestedRouteLink component
 *
 * @example
 * ```typescript
 * const AppLink = createNestedRouteLink<typeof appRoutes>()
 *
 * // Type-safe: only valid paths accepted
 * <AppLink href="/buttons">Buttons</AppLink>
 *
 * // TypeScript error: invalid path
 * <AppLink href="/nonexistent">Error!</AppLink>
 *
 * // Params required for parameterized routes
 * <AppLink href="/users/:id" params={{ id: '123' }}>User</AppLink>
 * ```
 */
export const createNestedRouteLink = <TRoutes extends Record<string, NestedRoute<unknown>>>() => {
  return NestedRouteLink as unknown as <TPath extends ExtractRoutePaths<TRoutes>>(
    props: TypedNestedRouteLinkProps<TPath>,
    children?: ChildrenList,
  ) => JSX.Element
}
