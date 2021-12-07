import { Shade } from '../shade'
import { createComponent } from '../shade-component'
import { LocationService } from '../services'
import { match, MatchResult, TokensToRegexpOptions } from 'path-to-regexp'
import { RenderOptions } from '../models'
import Semaphore from 'semaphore-async-await'

export interface Route<TMatchResult extends object> {
  url: string
  component: (options: { currentUrl: string; match: MatchResult<TMatchResult> }) => JSX.Element
  routingOptions?: TokensToRegexpOptions
  onVisit?: (options: Omit<RenderOptions<RouterProps, RouterState, {}>, 'getObservableValues'>) => Promise<void>
  onLeave?: (options: Omit<RenderOptions<RouterProps, RouterState, {}>, 'getObservableValues'>) => Promise<void>
}

export interface RouterProps {
  style?: CSSStyleDeclaration
  routes: Array<Route<any>>
  notFound?: (currentUrl: string) => JSX.Element
}

export interface RouterState {
  activeRoute?: Route<any>
  activeRouteParams?: any
  jsx?: JSX.Element
  lock: Semaphore
}
export const Router = Shade<RouterProps, RouterState>({
  shadowDomName: 'shade-router',
  getInitialState: () => ({
    lock: new Semaphore(1),
  }),
  constructed: ({ children, props, injector, updateState, getState, element }) => {
    const subscription = injector.getInstance(LocationService).onLocationChanged.subscribe(async (currentUrl) => {
      const { activeRoute: lastRoute, activeRouteParams: lastParams, lock } = getState()
      try {
        await lock.acquire()

        for (const route of props.routes) {
          const matchFn = match(route.url, route.routingOptions)
          const matchResult = matchFn(currentUrl)
          if (matchResult) {
            if (route !== lastRoute || JSON.stringify(lastParams) !== JSON.stringify(matchResult.params)) {
              if (lastRoute?.onLeave) {
                await lastRoute.onLeave({ children, props, injector, updateState, getState, element })
              }
              updateState({
                jsx: route.component({ currentUrl, match: matchResult }),
                activeRoute: route,
                activeRouteParams: matchResult.params,
              })
              if (route.onVisit) {
                await route.onVisit({ children, props, injector, updateState, getState, element })
              }
            }
            return
          }
        }
        if (lastRoute?.onLeave) {
          await lastRoute.onLeave({ children, props, injector, updateState, getState, element })
        }
        updateState({ jsx: props.notFound?.(currentUrl), activeRoute: undefined })
      } finally {
        lock.release()
      }
    }, true)
    return () => subscription.dispose()
  },
  render: ({ getState }) => {
    const { jsx } = getState()
    if (jsx) {
      return jsx
    }
    return <div></div>
  },
})
