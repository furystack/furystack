import { Shade } from '../shade'
import { createComponent } from '../shade-component'
import { LocationService } from '../services'

export interface RouterProps {
  routes: Array<{ url: string; component: (currentUrl: URL) => JSX.Element }>
  notFound?: (currentUrl: URL) => JSX.Element
  routeMatcher: (currentUrl: URL, componentUrl: string) => boolean
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
    const routeMatch = options.props.routes.find((r) => options.props.routeMatcher(currentUrl, r.url))
    if (routeMatch) {
      const match = routeMatch.component(currentUrl)
      return match
    }
    if (options.props.notFound) {
      return options.props.notFound(currentUrl)
    }
    return <div></div>
  },
})
