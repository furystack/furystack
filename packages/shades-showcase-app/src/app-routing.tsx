import type { ExtractRoutePaths, TypedNestedNavigateArgs } from '@furystack/shades'
import {
  buildNestedNavigateUrl,
  createComponent,
  createNestedNavigate,
  createNestedReplace,
  createNestedRouteLink,
  LocationService,
  Shade,
} from '@furystack/shades'

import type { appRoutes } from './routes.js'

/**
 * Canonical home for showcase-app route typing. All showcase components go
 * through the helpers exported here instead of reaching for `LocationService`
 * directly, so the route tree in `routes.tsx` remains the single source of
 * truth for every navigation call-site.
 */

/**
 * Union of every composed route path declared by the showcase app.
 */
export type AppRoutePath = ExtractRoutePaths<typeof appRoutes>

/**
 * Typed `<NestedRouteLink>` constrained to the showcase route tree.
 * Prefer this over `NestedRouteLink` in showcase code.
 */
export const ShowcaseNestedRouteLink = createNestedRouteLink<typeof appRoutes>()

/**
 * Typed imperative navigate function constrained to the showcase route tree.
 * Pushes a new history entry.
 */
export const showcaseNavigate = createNestedNavigate<typeof appRoutes>()

/**
 * Typed imperative replace function constrained to the showcase route tree.
 * Replaces the current history entry without a push.
 */
export const showcaseReplace = createNestedReplace<typeof appRoutes>()

/**
 * Props for {@link ShowcaseReplaceRoute}.
 *
 * Mirrors the args accepted by {@link createNestedReplace}: `path` is narrowed
 * to the showcase route tree, and `params` / `query` / `hash` are derived from
 * the route declared at that path.
 */
export type ShowcaseReplaceRouteProps<TPath extends AppRoutePath = AppRoutePath> = TypedNestedNavigateArgs<
  typeof appRoutes,
  TPath
>

const _ShowcaseReplaceRoute = Shade<ShowcaseReplaceRouteProps>({
  customElementName: 'showcase-replace-route',
  render: ({ props, injector, useDisposable }) => {
    useDisposable('showcase-replace-route', () => {
      const locationService = injector.get(LocationService)
      const targetUrl = buildNestedNavigateUrl(props)
      const currentPath = locationService.onLocationPathChanged.getValue()
      const currentSearch = locationService.onLocationSearchChanged.getValue()
      const currentHash = locationService.onLocationHashChanged.getValue()
      const currentUrl = `${currentPath}${currentSearch ? `?${currentSearch}` : ''}${currentHash ? `#${currentHash}` : ''}`

      if (currentUrl !== targetUrl) {
        showcaseReplace(injector, props)
      }
      return { [Symbol.dispose]: () => {} }
    })

    return <></>
  },
})

/**
 * Redirect helper component for the showcase app. Replaces the current
 * history entry with the target route on mount so the intermediate URL does
 * not pollute the browser's back / forward stack. Typed against `appRoutes`,
 * so `path`, `params`, `query` and `hash` are narrowed at the call-site.
 *
 * Used by parent routes to redirect to a default child when no sub-route is
 * selected, e.g. `<ShowcaseReplaceRoute path="/inputs-and-forms/buttons" />`.
 */
export const ShowcaseReplaceRoute = _ShowcaseReplaceRoute as unknown as <TPath extends AppRoutePath>(
  props: ShowcaseReplaceRouteProps<TPath>,
) => JSX.Element
