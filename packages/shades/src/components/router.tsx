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
  notFound?: JSX.Element
}

export interface RouterState {
  activeRoute?: Route<any> | null
  activeRouteParams?: any
  jsx?: JSX.Element
  lock: Semaphore
}
export const Router = Shade<RouterProps, RouterState>({
  shadowDomName: 'shade-router',
  getInitialState: () => ({
    lock: new Semaphore(1),
  }),
  render: (options) => {
    const { useState, useObservable, injector, updateState } = options

    const updateUrl = async (currentUrl: string) => {
      const [lastRoute, setActiveRoute] = options.useState('activeRoute')
      const [lastParams, setActiveParams] = options.useState('activeRouteParams')
      const [, setJsx] = options.useState('jsx')
      const [lock] = options.useState('lock')
      try {
        await lock.acquire()
        for (const route of options.props.routes) {
          const matchFn = match(route.url, route.routingOptions)
          const matchResult = matchFn(currentUrl)
          if (matchResult) {
            if (route !== lastRoute || JSON.stringify(lastParams) !== JSON.stringify(matchResult.params)) {
              await lastRoute?.onLeave?.(options)
              setJsx(route.component({ currentUrl, match: matchResult }), true)
              setActiveRoute(route, true)
              setActiveParams(matchResult.params)
              await route.onVisit?.(options)
            }
            return
          }
        }
        if (lastRoute?.onLeave) {
          await lastRoute.onLeave(options)
        }
        updateState({
          jsx: options.props.notFound,
          activeRoute: null,
          activeRouteParams: null,
        })
      } catch (e) {
        // path updates can be async, this can be ignored
        if (!(e instanceof ObservableAlreadyDisposedError)) {
          throw e
        }
      } finally {
        lock.release()
      }
    }

    const [initialUrl] = useObservable(
      'locationPathChanged',
      injector.getInstance(LocationService).onLocationPathChanged,
      updateUrl,
    )

    updateUrl(initialUrl)

    const [jsx] = useState('jsx')
    if (jsx) {
      return jsx
    }
    return null
  },
})
