import { Shade } from '../shade.js'
import { createComponent } from '../shade-component.js'
import { LocationService } from '../services/location-service.js'
import type { MatchResult, MatchOptions } from 'path-to-regexp'
import { match } from 'path-to-regexp'
import type { RenderOptions } from '../models/render-options.js'
import { Lock } from 'semaphore-async-await'
import { ObservableAlreadyDisposedError } from '@furystack/utils'

export interface Route<TMatchResult extends object> {
  url: string
  component: (options: { currentUrl: string; match: MatchResult<TMatchResult> }) => JSX.Element
  routingOptions?: MatchOptions
  onVisit?: (options: RenderOptions<unknown>) => Promise<void>
  onLeave?: (options: RenderOptions<unknown>) => Promise<void>
}

export interface RouterProps {
  style?: CSSStyleDeclaration
  routes: Array<Route<any>>
  notFound?: JSX.Element
}

export interface RouterState {
  activeRoute?: Route<any> | null
  activeRouteParams?: any
  jsx: JSX.Element
}
export const Router = Shade<RouterProps>({
  shadowDomName: 'shade-router',
  render: (options) => {
    const { useState, useObservable, injector } = options
    const [lock] = useState('lock', new Lock())
    const [state, setState] = useState<RouterState>('routerState', {
      jsx: <div />,
    })

    const updateUrl = async (currentUrl: string) => {
      const [lastState] = useState<RouterState>('routerState', state)
      const { activeRoute: lastRoute, activeRouteParams: lastRouteParams, jsx: lastJsx } = lastState
      try {
        await lock.acquire()
        for (const route of options.props.routes) {
          const matchFn = match(route.url, route.routingOptions)
          const matchResult = matchFn(currentUrl)
          if (matchResult) {
            if (route !== lastRoute || JSON.stringify(lastRouteParams) !== JSON.stringify(matchResult.params)) {
              await lastRoute?.onLeave?.({ ...options, element: lastState.jsx })
              const newJsx = route.component({ currentUrl, match: matchResult })
              setState({ jsx: newJsx, activeRoute: route, activeRouteParams: matchResult.params })
              await route.onVisit?.({ ...options, element: newJsx })
            }
            return
          }
        }

        if (lastRoute !== null) {
          await lastRoute?.onLeave?.({ ...options, element: lastJsx })
          setState({
            jsx: options.props.notFound || <div />,
            activeRoute: null,
            activeRouteParams: null,
          })
        }
      } catch (e) {
        // path updates can be async, this can be ignored
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
      { onChange: updateUrl },
    )
    updateUrl(locationPath)
    return state.jsx
  },
})
