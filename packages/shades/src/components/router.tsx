import { ObservableAlreadyDisposedError } from '@furystack/utils'
import type { MatchOptions, MatchResult } from 'path-to-regexp'
import { match } from 'path-to-regexp'
import type { RenderOptions } from '../models/render-options.js'
import { LocationService } from '../services/location-service.js'
import { createComponent } from '../shade-component.js'
import { Shade } from '../shade.js'

/**
 * @deprecated Use NestedRouter instead
 */
export interface Route<TMatchResult = unknown> {
  url: string
  component: (options: {
    currentUrl: string
    match: MatchResult<TMatchResult extends object ? TMatchResult : object>
  }) => JSX.Element
  routingOptions?: MatchOptions
  onVisit?: (options: RenderOptions<unknown> & { element: JSX.Element }) => Promise<void>
  onLeave?: (options: RenderOptions<unknown> & { element: JSX.Element }) => Promise<void>
}

/**
 * @deprecated Use NestedRouterProps instead
 */
export interface RouterProps {
  style?: CSSStyleDeclaration
  routes: Array<Route<any>>
  notFound?: JSX.Element
}

/**
 * @deprecated Use NestedRouterState instead
 */
export interface RouterState {
  activeRoute?: Route<unknown> | null
  activeRouteParams?: unknown
  jsx: JSX.Element
}

/**
 * @deprecated Use NestedRouter instead
 */
export const Router = Shade<RouterProps>({
  shadowDomName: 'shade-router',
  render: (options) => {
    const { useState, useObservable, injector } = options
    const [versionRef] = useState('navVersion', { current: 0 })
    const [state, setState] = useState<RouterState>('routerState', {
      jsx: <div />,
    })

    const updateUrl = async (currentUrl: string) => {
      const [lastState] = useState<RouterState>('routerState', state)
      const { activeRoute: lastRoute, activeRouteParams: lastRouteParams, jsx: lastJsx } = lastState
      try {
        for (const route of options.props.routes) {
          const matchFn = match(route.url, route.routingOptions)
          const matchResult = matchFn(currentUrl)
          if (matchResult) {
            if (route !== lastRoute || JSON.stringify(lastRouteParams) !== JSON.stringify(matchResult.params)) {
              const version = ++versionRef.current
              await lastRoute?.onLeave?.({ ...options, element: lastState.jsx })
              if (version !== versionRef.current) return
              const newJsx = route.component({ currentUrl, match: matchResult })
              setState({ jsx: newJsx, activeRoute: route, activeRouteParams: matchResult.params })
              await route.onVisit?.({ ...options, element: newJsx })
              if (version !== versionRef.current) return
            }
            return
          }
        }

        if (lastRoute !== null) {
          const version = ++versionRef.current
          await lastRoute?.onLeave?.({ ...options, element: lastJsx })
          if (version !== versionRef.current) return
          setState({
            jsx: options.props.notFound || <div />,
            activeRoute: null,
            activeRouteParams: null,
          })
        }
      } catch (e) {
        if (!(e instanceof ObservableAlreadyDisposedError)) {
          throw e
        }
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
