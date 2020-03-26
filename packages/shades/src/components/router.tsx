import { Shade } from '../shade'
import { createComponent } from '../shade-component'
import { LocationService } from '../services'
import { match, MatchResult } from 'path-to-regexp'

export interface RouterProps {
  routes: Array<{ url: string; component: (options: { currentUrl: URL; match: MatchResult }) => JSX.Element }>
  notFound?: (currentUrl: URL) => JSX.Element
}

export interface RouterState {
  url: URL
}
export const Router = Shade<RouterProps, RouterState>({
  shadowDomName: 'shade-router',
  getInitialState: () => ({
    url: new URL(location.href),
  }),
  constructed: (options) => {
    const subscription = options.injector.getInstance(LocationService).onLocationChanged.subscribe((u) => {
      if (u.toString() !== options.getState().url.toString()) {
        options.updateState({ url: u })
      }
    }, true)
    return () => subscription.dispose()
  },
  render: (options) => {
    const currentUrl = options.getState().url
    for (const route of options.props.routes) {
      const matchFn = match(route.url)
      const matchResult = matchFn(currentUrl.pathname)
      if (matchResult) {
        return route.component({ currentUrl, match: matchResult })
      }
    }
    if (options.props.notFound) {
      return options.props.notFound(currentUrl)
    }
    return <div></div>
  },
})
