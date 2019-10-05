import { Shade } from '../shade'
import { createComponent } from '../shade-component'
import { LocationService } from '../services'

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface RouterProps {
  routes: Array<{ url: string; component: () => JSX.Element }>
  notFound?: () => JSX.Element
  routeMatcher: (currentUrl: URL, componentUrl: string) => boolean
}

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface RouterState {
  url: URL
}
export const Router = Shade<RouterProps, RouterState>({
  shadowDomName: 'shade-router',
  initialState: {
    url: new URL(location.href),
  },
  construct: options => {
    const subscription = options.injector
      .getInstance(LocationService)
      .onLocationChanged.subscribe(u => options.updateState({ url: u }), true)
    return () => subscription.dispose()
  },
  render: options => {
    const currentUrl = options.getState().url
    const routeMatch = options.props.routes.find(r => options.props.routeMatcher(currentUrl, r.url))
    return (routeMatch && routeMatch.component()) || (options.props.notFound && options.props.notFound()) || <div></div>
  },
})
