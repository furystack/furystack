import { ObservableAlreadyDisposedError } from '@furystack/utils'
import type { MatchOptions, MatchResult } from 'path-to-regexp'
import { match } from 'path-to-regexp'
import { Lock } from 'semaphore-async-await'
import type { RenderOptions } from '../models/render-options.js'
import { LocationService } from '../services/location-service.js'
import { createComponent } from '../shade-component.js'
import { Shade } from '../shade.js'

/**
 * A single route entry in a NestedRouter configuration.
 * Unlike flat `Route`, the URL is the Record key (not a field), and the
 * `component` receives an `outlet` for rendering matched child content.
 * @typeParam TMatchResult - The type of matched URL parameters
 */
export type NestedRoute<TMatchResult = unknown> = {
  component: (options: {
    currentUrl: string
    match: MatchResult<TMatchResult extends object ? TMatchResult : object>
    outlet?: JSX.Element
  }) => JSX.Element
  routingOptions?: MatchOptions
  onVisit?: (options: RenderOptions<unknown> & { element: JSX.Element }) => Promise<void>
  onLeave?: (options: RenderOptions<unknown> & { element: JSX.Element }) => Promise<void>
  children?: Record<string, NestedRoute<any>>
}

/**
 * Props for the NestedRouter component.
 * Routes are defined as a Record where keys are URL patterns.
 */
export type NestedRouterProps = {
  routes: Record<string, NestedRoute<any>>
  notFound?: JSX.Element
}

/**
 * A single entry in a match chain, pairing a matched route with its match result.
 */
export type MatchChainEntry = {
  route: NestedRoute<unknown>
  match: MatchResult<object>
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
 * @param routes - The route definitions to match against
 * @param currentUrl - The URL path to match
 * @returns An array of matched chain entries from outermost to innermost, or null if no match
 */
export const buildMatchChain = (
  routes: Record<string, NestedRoute<any>>,
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
          return [{ route, match: prefixResult }, ...childChain]
        }
      }

      const exactMatchFn = match(pattern, route.routingOptions)
      const exactResult = exactMatchFn(currentUrl)
      if (exactResult) {
        return [{ route, match: exactResult }]
      }
    } else {
      const matchFn = match(pattern, route.routingOptions)
      const matchResult = matchFn(currentUrl)
      if (matchResult) {
        return [{ route, match: matchResult }]
      }
    }
  }

  return null
}

/**
 * Finds the first index where two match chains diverge.
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
      outlet,
    })
    chainElements[i] = outlet
  }

  return { jsx: outlet as JSX.Element, chainElements }
}

/**
 * A nested router component that supports hierarchical route definitions
 * with parent/child relationships. Parent routes receive an `outlet` prop
 * containing the rendered child route, enabling layout composition.
 *
 * Routes are defined as a Record where keys are URL patterns (following the
 * RestApi pattern). The matching algorithm builds a chain from outermost to
 * innermost route, then renders inside-out so each parent wraps its child.
 */
export const NestedRouter = Shade<NestedRouterProps>({
  shadowDomName: 'shade-nested-router',
  render: (options) => {
    const { useState, useObservable, injector } = options
    const [lock] = useState('lock', new Lock())
    const [state, setState] = useState<NestedRouterState>('routerState', {
      matchChain: [],
      jsx: <div />,
      chainElements: [],
    })

    const updateUrl = async (currentUrl: string) => {
      const [lastState] = useState<NestedRouterState>('routerState', state)
      const { matchChain: lastChain, chainElements: lastChainElements } = lastState
      try {
        await lock.acquire()
        const newChain = buildMatchChain(options.props.routes, currentUrl)

        if (newChain) {
          const lastChainEntries = lastChain ?? []
          const divergeIndex = findDivergenceIndex(lastChainEntries, newChain)
          const hasChanged =
            divergeIndex < lastChainEntries.length ||
            divergeIndex < newChain.length ||
            lastChainEntries.length !== newChain.length

          if (hasChanged) {
            // Call onLeave for routes that are being left (from divergence point to end of old chain)
            for (let i = lastChainEntries.length - 1; i >= divergeIndex; i--) {
              await lastChainEntries[i].route.onLeave?.({ ...options, element: lastChainElements[i] })
            }

            const { jsx: newJsx, chainElements: newChainElements } = renderMatchChain(newChain, currentUrl)
            setState({ matchChain: newChain, jsx: newJsx, chainElements: newChainElements })

            // Call onVisit for routes that are being entered (from divergence point to end of new chain)
            for (let i = divergeIndex; i < newChain.length; i++) {
              await newChain[i].route.onVisit?.({ ...options, element: newChainElements[i] })
            }
          }
        } else if (lastChain !== null) {
          // No match found — call onLeave for all active routes and show notFound.
          // The null sentinel prevents re-entering this block on re-render.
          for (let i = (lastChain?.length ?? 0) - 1; i >= 0; i--) {
            await lastChain[i].route.onLeave?.({ ...options, element: lastChainElements[i] })
          }
          setState({
            matchChain: null,
            jsx: options.props.notFound || <div />,
            chainElements: [],
          })
        }
      } catch (e) {
        if (!(e instanceof ObservableAlreadyDisposedError)) {
          throw e
        }
      } finally {
        lock?.release()
      }
    }

    const [locationPath] = useObservable(
      'locationPathChanged',
      injector.getInstance(LocationService).onLocationPathChanged,
      {
        onChange: (newValue) => {
          void updateUrl(newValue)
        },
      },
    )
    void updateUrl(locationPath)
    return state.jsx
  },
})
