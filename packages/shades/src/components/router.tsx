import { Shade } from '../shade'
import { LocationService } from '../services'
import type { MatchResult, TokensToRegexpOptions } from 'path-to-regexp'
import { match } from 'path-to-regexp'
import type { RenderOptions } from '../models'
import Semaphore from 'semaphore-async-await'
import { ObservableAlreadyDisposedError } from '@furystack/utils'

export interface Route<TMatchResult extends object> {
  url: string
  component: (options: { currentUrl: string; match: MatchResult<TMatchResult> }) => JSX.Element
  routingOptions?: TokensToRegexpOptions
  onVisit?: (options: RenderOptions<RouterProps, RouterState>) => Promise<void>
  onLeave?: (options: RenderOptions<RouterProps, RouterState>) => Promise<void>
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
  resources: ({ children, props, injector, updateState, getState, element }) => [
    injector.getInstance(LocationService).onLocationChanged.subscribe(async (currentUrl) => {
      const { activeRoute: lastRoute, activeRouteParams: lastParams, lock } = getState()
      try {
        await lock.acquire()
        for (const route of props.routes) {
          const matchFn = match(route.url, route.routingOptions)
          const matchResult = matchFn(currentUrl)
          if (matchResult) {
            if (route !== lastRoute || JSON.stringify(lastParams) !== JSON.stringify(matchResult.params)) {
              await lastRoute?.onLeave?.({ children, props, injector, updateState, getState, element })
              updateState({
                jsx: route.component({ currentUrl, match: matchResult }),
                activeRoute: route,
                activeRouteParams: matchResult.params,
              })
              await route.onVisit?.({ children, props, injector, updateState, getState, element })
            }
            return
          }
        }
        if (lastRoute?.onLeave) {
          await lastRoute.onLeave({ children, props, injector, updateState, getState, element })
        }
        updateState({ jsx: props.notFound?.(currentUrl), activeRoute: undefined })
      } catch (e) {
        // path updates can be async, this can be ignored
        if (!(e instanceof ObservableAlreadyDisposedError)) {
          throw e
        }
      } finally {
        lock.release()
      }
    }, true),
  ],
  render: ({ getState }) => {
    const { jsx } = getState()
    if (jsx) {
      return jsx
    }
    return null
  },
})
