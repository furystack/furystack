import type { ChildrenList } from '../models/children-list.js'
import type { PartialElement } from '../models/partial-element.js'
import { LocationService } from '../services/location-service.js'
import { createComponent } from '../shade-component.js'
import { Shade } from '../shade.js'
import { buildNestedNavigateUrl } from './nested-navigate.js'
import type {
  ExtractRouteHash,
  ExtractRouteQuery,
  ExtractRoutePaths,
  RouteAt,
  TypedHashArg,
  TypedParamsArg,
  TypedQueryArg,
} from './nested-route-types.js'
import type { NestedRoute } from './nested-router.js'

/**
 * Props for the NestedRouteLink component.
 * Combines SPA navigation from RouteLink with parameter compilation from LinkToRoute,
 * plus optional query string and hash fragment composition.
 */
export type NestedRouteLinkProps = {
  path: string
  params?: Record<string, string>
  query?: Record<string, unknown>
  hash?: string
} & PartialElement<Omit<HTMLAnchorElement, 'onclick' | 'href'>>

/**
 * Props for a type-safe nested route link.
 * When the path contains parameters (e.g. `:id`), the `params` prop becomes required.
 * `query` and `hash` remain loose (untyped) on this variant; use
 * {@link createNestedRouteLink} to narrow them against a specific route tree.
 * @typeParam TPath - A specific route path string
 */
export type TypedNestedRouteLinkProps<TPath extends string> = {
  path: TPath
  query?: Record<string, unknown>
  hash?: string
} & TypedParamsArg<TPath> &
  PartialElement<Omit<HTMLAnchorElement, 'onclick' | 'href'>>

/**
 * Props for a route-tree-aware nested route link. Narrows `query` and `hash`
 * against the specific route at `TPath` in `TRoutes`.
 * @typeParam TRoutes - The route tree
 * @typeParam TPath - A composed route path within `TRoutes`
 */
export type TreeAwareNestedRouteLinkProps<
  TRoutes extends Record<string, NestedRoute<any, any, any>>,
  TPath extends string,
> = { path: TPath } & TypedParamsArg<TPath> &
  TypedQueryArg<ExtractRouteQuery<RouteAt<TRoutes, TPath>>> &
  TypedHashArg<ExtractRouteHash<RouteAt<TRoutes, TPath>>> &
  PartialElement<Omit<HTMLAnchorElement, 'onclick' | 'href'>>

const _NestedRouteLink = Shade<NestedRouteLinkProps>({
  customElementName: 'nested-route-link',
  elementBase: HTMLAnchorElement,
  elementBaseName: 'a',
  css: {
    color: 'inherit',
    textDecoration: 'inherit',
  },
  render: ({ children, props, injector, useHostProps }) => {
    const { path, params, query, hash } = props
    const resolvedUrl = buildNestedNavigateUrl({ path, params, query, hash })

    useHostProps({
      href: resolvedUrl,
      onclick: (ev: MouseEvent) => {
        ev.preventDefault()
        // eslint-disable-next-line furystack/prefer-location-service -- This IS the SPA link component; it must call pushState directly.
        history.pushState('', props.title || '', resolvedUrl)
        injector.getInstance(LocationService).updateState()
      },
    })
    return <>{children}</>
  },
})

/**
 * A link component for NestedRouter that supports SPA navigation with
 * type-safe route parameter compilation.
 *
 * Intercepts click events to use `history.pushState` for client-side navigation,
 * compiles parameterized routes (e.g. `/users/:id`) when `params` is provided,
 * serializes `query` to the URL search string and appends `hash` when set.
 *
 * Route parameters are automatically inferred from the `path` pattern:
 * - `path="/buttons"` — `params` is optional
 * - `path="/users/:id"` — `params: { id: string }` is required
 *
 * For additional URL validation against a route tree (including `query` and
 * `hash` narrowing), use {@link createNestedRouteLink}.
 */
export const NestedRouteLink = _NestedRouteLink as unknown as <TPath extends string = string>(
  props: TypedNestedRouteLinkProps<TPath>,
  children?: ChildrenList,
) => JSX.Element

/**
 * Creates a type-safe wrapper around NestedRouteLink constrained to a specific
 * route tree. The returned component has the same runtime behavior but narrows
 * `path` to only accept valid route paths, requires `params` when the route
 * has parameters, and enforces the route's declared `query` and `hash` schemas.
 *
 * @typeParam TRoutes - The route tree type (use `typeof yourRoutes`)
 * @returns A narrowed NestedRouteLink component
 *
 * @example
 * ```typescript
 * const AppLink = createNestedRouteLink<typeof appRoutes>()
 *
 * <AppLink path="/buttons">Buttons</AppLink>
 * <AppLink path="/users/:id" params={{ id: '123' }}>User</AppLink>
 * <AppLink path="/users/:id" params={{ id: '1' }} query={{ tab: 'profile' }} hash="notes">User</AppLink>
 * ```
 */
export const createNestedRouteLink = <TRoutes extends Record<string, NestedRoute<any, any, any>>>() => {
  return _NestedRouteLink as unknown as <TPath extends ExtractRoutePaths<TRoutes>>(
    props: TreeAwareNestedRouteLinkProps<TRoutes, TPath>,
    children?: ChildrenList,
  ) => JSX.Element
}
