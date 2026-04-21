import type { Injector } from '@furystack/inject'
import { ObservableAlreadyDisposedError } from '@furystack/utils'
import type { MatchOptions, MatchResult } from 'path-to-regexp'
import { match } from 'path-to-regexp'
import type { RenderOptions } from '../models/render-options.js'
import { LocationService } from '../services/location-service.js'
import { RouteMatchService } from '../services/route-match-service.js'
import { createComponent, setRenderMode } from '../shade-component.js'
import { Shade } from '../shade.js'
import type { ViewTransitionConfig } from '../view-transition.js'
import { maybeViewTransition } from '../view-transition.js'
import type { HashLiterals, QueryValidator } from './nested-route-types.js'

/**
 * Options passed to a dynamic title resolver function.
 * @typeParam TMatchResult - The type of matched URL parameters
 */
export type TitleResolverOptions<TMatchResult = unknown> = {
  match: MatchResult<TMatchResult extends object ? TMatchResult : object>
  injector: Injector
}

/**
 * Metadata associated with a route entry.
 * Used by consumers (breadcrumbs, document title, navigation trees) to
 * derive display information from the route hierarchy.
 *
 * This is an `interface` so that applications can augment it with custom fields
 * via declaration merging:
 *
 * @example
 * ```typescript
 * declare module '@furystack/shades' {
 *   interface NestedRouteMeta {
 *     icon?: IconDefinition
 *     hidden?: boolean
 *   }
 * }
 * ```
 *
 * @typeParam TMatchResult - The type of matched URL parameters
 */
export interface NestedRouteMeta<TMatchResult = unknown> {
  title?: string | ((options: TitleResolverOptions<TMatchResult>) => string | Promise<string>)
}

/**
 * A single route entry in a NestedRouter configuration.
 * Unlike flat `Route`, the URL is the Record key (not a field), and the
 * `component` receives an `outlet` for rendering matched child content.
 *
 * Routes may additionally declare:
 * - `query`: a validator that parses the deserialized query string into a
 *   typed shape; `component` receives the parsed value (or `null` when
 *   validation fails). The route still matches on path alone — an invalid
 *   query never prevents navigation.
 * - `hash`: a readonly tuple of allowed URL hash literals; `component`
 *   receives the current hash when it matches one of the listed literals,
 *   or `undefined` otherwise.
 *
 * @typeParam TMatchResult - The type of matched URL parameters
 * @typeParam TQuery - The typed query shape parsed from the URL search string (defaults to `never`)
 * @typeParam THash - The readonly tuple of allowed hash literals (defaults to `never`)
 */
export type NestedRoute<TMatchResult = unknown, TQuery = any, THash extends HashLiterals = readonly any[]> = {
  meta?: NestedRouteMeta<TMatchResult>
  component: (options: {
    currentUrl: string
    match: MatchResult<TMatchResult extends object ? TMatchResult : object>
    query: TQuery | null
    hash: THash[number] | undefined
    outlet?: JSX.Element
  }) => JSX.Element
  routingOptions?: MatchOptions
  /**
   * Called after the route's DOM has been mounted. When view transitions are enabled,
   * this runs after the transition's update callback has completed and the new DOM is in place.
   * Use for imperative side effects like data fetching or focus management — not for visual
   * animations, which are handled by the View Transition API when `viewTransition` is enabled.
   */
  onVisit?: (options: RenderOptions<unknown> & { element: JSX.Element }) => Promise<void>
  /**
   * Called before the route's DOM is removed (and before the view transition starts, if enabled).
   * Use for cleanup or teardown logic — not for exit animations, which are handled by the
   * View Transition API when `viewTransition` is enabled.
   */
  onLeave?: (options: RenderOptions<unknown> & { element: JSX.Element }) => Promise<void>
  children?: Record<string, NestedRoute<any, any, any>>
  viewTransition?: boolean | ViewTransitionConfig
  /**
   * Optional validator that narrows the deserialized URL query string into a
   * typed shape. Return `null` when the URL's query does not satisfy the route's
   * contract — the route still matches on path, but `component` receives `null`.
   */
  query?: QueryValidator<TQuery>
  /**
   * Optional readonly tuple of URL hash literals the route understands. Declare
   * with `as const` to preserve literal types, e.g. `hash: ['tab1', 'tab2'] as const`.
   * The router forwards the current hash to `component` only when it matches one
   * of the listed literals; otherwise `component.hash` is `undefined`.
   */
  hash?: THash
}

/**
 * Props for the NestedRouter component.
 * Routes are defined as a Record where keys are URL patterns.
 */
export type NestedRouterProps = {
  routes: Record<string, NestedRoute<any, any, any>>
  notFound?: JSX.Element
  viewTransition?: boolean | ViewTransitionConfig
}

/**
 * A single entry in a match chain, pairing a matched route with its match
 * result and the typed `query` / `hash` values derived from the URL for that
 * route's declared schema.
 */
export type MatchChainEntry = {
  route: NestedRoute<unknown, any, any>
  match: MatchResult<object>
  query: unknown
  hash: string | undefined
}

/**
 * Internal state for the NestedRouter component.
 * `matchChain` is `null` when a notFound fallback has been rendered,
 * distinguishing it from the initial empty array (not yet processed).
 */
export type NestedRouterState = {
  matchChain: MatchChainEntry[] | null
  jsx: JSX.Element
  chainElements: JSX.Element[]
}

/**
 * Recursively builds a match chain from outermost to innermost matched route.
 *
 * For routes with children, a prefix match (`end: false`) is attempted first.
 * If a child matches the remaining URL, the parent and child chain are combined.
 * If no child matches, an exact match on the parent alone is attempted.
 *
 * For leaf routes (no children), only exact matching is used.
 *
 * The returned entries contain placeholder `query: null` / `hash: undefined`
 * values; callers are expected to populate them via {@link enrichMatchChain}.
 *
 * @param routes - The route definitions to match against
 * @param currentUrl - The URL path to match
 * @returns An array of matched chain entries from outermost to innermost, or null if no match
 */
export const buildMatchChain = (
  routes: Record<string, NestedRoute<any, any, any>>,
  currentUrl: string,
): MatchChainEntry[] | null => {
  for (const [pattern, route] of Object.entries(routes)) {
    if (route.children) {
      const prefixMatchFn = match(pattern, { ...route.routingOptions, end: false })
      let prefixResult = prefixMatchFn(currentUrl)

      // In path-to-regexp v8, match('/', { end: false }) only matches exact '/'.
      // For the root pattern, any URL is logically under '/', so force a prefix match.
      if (!prefixResult && pattern === '/') {
        prefixResult = { path: '/', params: {} }
      }

      if (prefixResult) {
        let remainingUrl = currentUrl.slice(prefixResult.path.length)
        if (!remainingUrl.startsWith('/')) {
          remainingUrl = `/${remainingUrl}`
        }

        const childChain = buildMatchChain(route.children, remainingUrl)
        if (childChain) {
          return [{ route, match: prefixResult, query: null, hash: undefined }, ...childChain]
        }
      }

      const exactMatchFn = match(pattern, route.routingOptions)
      const exactResult = exactMatchFn(currentUrl)
      if (exactResult) {
        return [{ route, match: exactResult, query: null, hash: undefined }]
      }
    } else {
      const matchFn = match(pattern, route.routingOptions)
      const matchResult = matchFn(currentUrl)
      if (matchResult) {
        return [{ route, match: matchResult, query: null, hash: undefined }]
      }
    }
  }

  return null
}

/**
 * Populates each chain entry's `query` and `hash` fields by running the route's
 * declared validator against the URL's deserialized query string, and matching
 * the current URL hash against the route's declared literal tuple.
 *
 * Entries whose route declares neither `query` nor `hash` are returned with
 * `query: null` / `hash: undefined`.
 *
 * When no entry in the chain declares either `query` or `hash`, the input
 * array is returned unchanged to avoid a per-navigation allocation on the
 * common path-only case.
 *
 * @param chain - The chain produced by {@link buildMatchChain}
 * @param deserializedSearch - The deserialized URL query string
 * @param currentHash - The current URL hash (without the leading `#`)
 */
export const enrichMatchChain = (
  chain: MatchChainEntry[],
  deserializedSearch: Record<string, unknown>,
  currentHash: string,
): MatchChainEntry[] => {
  const hasAnyDeclaration = chain.some((entry) => entry.route.query || entry.route.hash)
  if (!hasAnyDeclaration) return chain

  return chain.map((entry) => {
    const validator = entry.route.query as QueryValidator<unknown> | undefined
    const query: unknown = validator ? validator(deserializedSearch) : null
    const declaredHash = entry.route.hash as readonly string[] | undefined
    const hash = declaredHash?.includes(currentHash) ? currentHash : undefined
    return { ...entry, query, hash }
  })
}

/**
 * Finds the first index where two match chains diverge, considering route
 * identity and matched path parameters only. Used to scope lifecycle hooks
 * (`onLeave` / `onVisit`) so that a query string or hash change does not
 * fire spurious mount / unmount callbacks.
 *
 * Returns the length of the shorter chain if one is a prefix of the other.
 */
export const findDivergenceIndex = (oldChain: MatchChainEntry[], newChain: MatchChainEntry[]): number => {
  const minLength = Math.min(oldChain.length, newChain.length)
  for (let i = 0; i < minLength; i++) {
    if (
      oldChain[i].route !== newChain[i].route ||
      JSON.stringify(oldChain[i].match.params) !== JSON.stringify(newChain[i].match.params)
    ) {
      return i
    }
  }
  return minLength
}

/**
 * Shallow structural equality for query values. Handles the shapes produced by
 * route-declared query validators: primitives, plain objects (by own enumerable
 * string keys, recursively shallow-compared), and arrays (by index).
 *
 * Nested objects / arrays are compared shallowly one level deep, then fall back
 * to `Object.is` — sufficient for the typed-query shapes the router surfaces,
 * and order-independent unlike `JSON.stringify`.
 */
const isShallowEqual = (a: unknown, b: unknown): boolean => {
  if (Object.is(a, b)) return true
  if (a === null || b === null || typeof a !== 'object' || typeof b !== 'object') return false

  if (Array.isArray(a)) {
    if (!Array.isArray(b) || a.length !== b.length) return false
    for (let i = 0; i < a.length; i++) {
      if (!Object.is(a[i], b[i])) return false
    }
    return true
  }
  if (Array.isArray(b)) return false

  const aKeys = Object.keys(a as Record<string, unknown>)
  const bKeys = Object.keys(b as Record<string, unknown>)
  if (aKeys.length !== bKeys.length) return false
  for (const key of aKeys) {
    if (!Object.prototype.hasOwnProperty.call(b, key)) return false
    if (!Object.is((a as Record<string, unknown>)[key], (b as Record<string, unknown>)[key])) return false
  }
  return true
}

/**
 * Returns true when any chain entry differs in its `query` value or `hash`
 * segment, ignoring path-level fields (route identity and params). Used to
 * force a re-render when the URL's query string or hash changes without the
 * matched route chain itself changing.
 *
 * Query values are compared with a key-order-independent shallow equality —
 * sufficient for the typed shapes a route's `query` validator surfaces.
 */
export const hasQueryOrHashChanged = (oldChain: MatchChainEntry[], newChain: MatchChainEntry[]): boolean => {
  const minLength = Math.min(oldChain.length, newChain.length)
  for (let i = 0; i < minLength; i++) {
    if (oldChain[i].hash !== newChain[i].hash) return true
    if (!isShallowEqual(oldChain[i].query, newChain[i].query)) return true
  }
  return false
}

/**
 * The result of rendering a match chain, containing both the fully composed
 * JSX tree and per-entry elements for scoped lifecycle animations.
 */
export type RenderMatchChainResult = {
  jsx: JSX.Element
  chainElements: JSX.Element[]
}

/**
 * Renders a match chain inside-out: starts with the innermost (leaf) route
 * rendered with `outlet: undefined`, then passes its JSX as `outlet` to
 * each successive parent up the chain.
 *
 * Returns per-entry elements so that lifecycle hooks (`onLeave`/`onVisit`)
 * receive only the element for their own route level, not the full tree.
 *
 * @param chain - The match chain from outermost to innermost
 * @param currentUrl - The current URL path
 * @returns The fully composed JSX element and per-entry rendered elements
 */
export const renderMatchChain = (chain: MatchChainEntry[], currentUrl: string): RenderMatchChainResult => {
  let outlet: JSX.Element | undefined
  const chainElements: JSX.Element[] = new Array<JSX.Element>(chain.length)

  for (let i = chain.length - 1; i >= 0; i--) {
    const entry = chain[i]
    outlet = entry.route.component({
      currentUrl,
      match: entry.match,
      query: entry.query,
      hash: entry.hash,
      outlet,
    })
    chainElements[i] = outlet
  }

  return { jsx: outlet as JSX.Element, chainElements }
}

/**
 * Resolves the effective view transition config for a navigation by merging
 * the router-level default with the innermost (leaf) route's override.
 * A per-route `false` disables transitions even when the router default is on.
 */
export const resolveViewTransition = (
  routerConfig: boolean | ViewTransitionConfig | undefined,
  newChain: MatchChainEntry[],
): ViewTransitionConfig | false => {
  if (!routerConfig && routerConfig !== undefined) return false

  const leafRoute = newChain[newChain.length - 1]?.route
  const routeConfig = leafRoute?.viewTransition

  if (routeConfig === false) return false
  if (!routerConfig && !routeConfig) return false

  const baseTypes = typeof routerConfig === 'object' ? routerConfig.types : undefined
  const routeTypes = typeof routeConfig === 'object' ? routeConfig.types : undefined

  return { types: routeTypes ?? baseTypes }
}

/**
 * A nested router component that supports hierarchical route definitions
 * with parent/child relationships. Parent routes receive an `outlet` prop
 * containing the rendered child route, enabling layout composition.
 *
 * Routes are defined as a Record where keys are URL patterns (following the
 * RestApi pattern). The matching algorithm builds a chain from outermost to
 * innermost route, then renders inside-out so each parent wraps its child.
 *
 * The router subscribes to path, query string and hash changes; path-level
 * changes drive `onLeave` / `onVisit` lifecycle hooks while query / hash
 * changes re-render the chain without firing lifecycle callbacks.
 */
export const NestedRouter = Shade<NestedRouterProps>({
  customElementName: 'shade-nested-router',
  render: (options) => {
    const { useState, useObservable, injector } = options
    const [versionRef] = useState('navVersion', { current: 0 })
    const [state, setState] = useState<NestedRouterState>('routerState', {
      matchChain: [],
      jsx: <div />,
      chainElements: [],
    })

    const locationService = injector.getInstance(LocationService)

    const updateUrl = async (currentUrl: string) => {
      const [lastState] = useState<NestedRouterState>('routerState', state)
      const { matchChain: lastChain, chainElements: lastChainElements } = lastState
      try {
        const rawChain = buildMatchChain(options.props.routes, currentUrl)

        if (rawChain) {
          const deserializedSearch = locationService.onDeserializedLocationSearchChanged.getValue()
          const currentHash = locationService.onLocationHashChanged.getValue()
          const newChain = enrichMatchChain(rawChain, deserializedSearch, currentHash)

          const lastChainEntries = lastChain ?? []
          const divergeIndex = findDivergenceIndex(lastChainEntries, newChain)
          const hasPathChanged =
            divergeIndex < lastChainEntries.length ||
            divergeIndex < newChain.length ||
            lastChainEntries.length !== newChain.length
          const hasChanged = hasPathChanged || hasQueryOrHashChanged(lastChainEntries, newChain)

          if (hasChanged) {
            const version = ++versionRef.current

            for (let i = lastChainEntries.length - 1; i >= divergeIndex; i--) {
              await lastChainEntries[i].route.onLeave?.({ ...options, element: lastChainElements[i] })
              if (version !== versionRef.current) return
            }

            let newResult: RenderMatchChainResult
            setRenderMode(true)
            try {
              newResult = renderMatchChain(newChain, currentUrl)
            } finally {
              setRenderMode(false)
            }
            if (version !== versionRef.current) return

            const applyUpdate = () => {
              setState({ matchChain: newChain, jsx: newResult.jsx, chainElements: newResult.chainElements })
              injector.getInstance(RouteMatchService).currentMatchChain.setValue(newChain)
            }

            const vtConfig = resolveViewTransition(options.props.viewTransition, newChain)
            await maybeViewTransition(vtConfig === false ? undefined : vtConfig, applyUpdate)

            for (let i = divergeIndex; i < newChain.length; i++) {
              await newChain[i].route.onVisit?.({ ...options, element: newResult.chainElements[i] })
              if (version !== versionRef.current) return
            }
          }
        } else if (lastChain !== null) {
          const version = ++versionRef.current

          for (let i = (lastChain?.length ?? 0) - 1; i >= 0; i--) {
            await lastChain[i].route.onLeave?.({ ...options, element: lastChainElements[i] })
            if (version !== versionRef.current) return
          }

          const applyNotFound = () => {
            setState({
              matchChain: null,
              jsx: options.props.notFound || <div />,
              chainElements: [],
            })
            injector.getInstance(RouteMatchService).currentMatchChain.setValue([])
          }

          await maybeViewTransition(options.props.viewTransition, applyNotFound)
        }
      } catch (e) {
        if (!(e instanceof ObservableAlreadyDisposedError)) {
          throw e
        }
      }
    }

    /**
     * A single `LocationService.navigate` call synchronously fires three
     * observables (path, search, hash). Without coalescing, each would kick
     * off its own `updateUrl` and rely on `versionRef` to cancel the two
     * that lose the race.
     *
     * We dedupe by the composed URL key: each observer fires after the
     * browser's location has already been updated, so the key read at fire
     * time is the final target URL. The first observer in the burst kicks
     * off `updateUrl`; the remaining two see the same key and short-circuit.
     */
    const getUrlKey = () =>
      `${locationService.onLocationPathChanged.getValue()}?${locationService.onLocationSearchChanged.getValue()}#${locationService.onLocationHashChanged.getValue()}`

    const [lastKeyRef] = useState('navLastKey', { current: getUrlKey() })
    const scheduleUpdate = () => {
      const key = getUrlKey()
      if (key === lastKeyRef.current) return
      lastKeyRef.current = key
      void updateUrl(locationService.onLocationPathChanged.getValue())
    }

    const [locationPath] = useObservable('locationPathChanged', locationService.onLocationPathChanged, {
      onChange: scheduleUpdate,
    })

    useObservable('locationSearchChanged', locationService.onDeserializedLocationSearchChanged, {
      onChange: scheduleUpdate,
    })

    useObservable('locationHashChanged', locationService.onLocationHashChanged, {
      onChange: scheduleUpdate,
    })

    void updateUrl(locationPath)
    return state.jsx
  },
})
