import { Shade } from '../shade'
import { createComponent } from '../shade-component'
import { LocationService } from '../services'
import { match, MatchResult } from 'path-to-regexp'
import { RenderOptions } from '../models'

export interface Route<TMatchResult extends object> {
  url: string
  component: (options: { currentUrl: URL; match: MatchResult<TMatchResult> }) => JSX.Element
  onVisit?: (options: RenderOptions<RouterProps, RouterState>) => Promise<void>
  onLeave?: (options: RenderOptions<RouterProps, RouterState>) => Promise<void>
}

export interface RouterProps {
  routes: Array<Route<any>>
  notFound?: (currentUrl: URL) => JSX.Element
}

export interface RouterState {
  activeRoute?: Route<any>
  jsx?: JSX.Element
}
export const Router = Shade<RouterProps, RouterState>({
  shadowDomName: 'shade-router',
  getInitialState: () => ({}),
  constructed: ({ children, props, injector, updateState, getState, element }) => {
    const subscription = injector.getInstance(LocationService).onLocationChanged.subscribe(async (currentUrl) => {
      const lastRoute = getState().activeRoute
      for (const route of props.routes) {
        const matchFn = match(route.url)
        const matchResult = matchFn(currentUrl.pathname)
        if (matchResult) {
          if (route !== lastRoute) {
            if (lastRoute?.onLeave) {
              await lastRoute.onLeave({ children, props, injector, updateState, getState, element })
            }
            updateState({ jsx: route.component({ currentUrl, match: matchResult }), activeRoute: route })
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
