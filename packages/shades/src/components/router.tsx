import { Shade } from '../shade'
import { createComponent } from '../shade-component'
import { LocationService } from '../services'

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface RouterProps {
  routes: Array<{ url: string; component: (currentUrl: URL) => JSX.Element }>
  notFound?: (currentUrl: URL) => JSX.Element
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
  constructed: options => {
    const subscription = options.injector.getInstance(LocationService).onLocationChanged.subscribe(u => {
      if (u.toString() !== options.getState().url.toString()) {
        options.updateState({ url: u })
      }
    }, true)
    return () => subscription.dispose()
  },
  render: options => {
    const currentUrl = options.getState().url
    const routeMatch = options.props.routes.find(r => options.props.routeMatcher(currentUrl, r.url))
    if (routeMatch) {
      const match = routeMatch.component(currentUrl)
      options.logger.information({
        message: `Route matched for '${currentUrl}'`,
        data: { match },
      })
      return match
    }
    if (options.props.notFound) {
      const notFound = options.props.notFound(currentUrl)
      options.logger.information({
        message: `Route not found for '${currentUrl}', falling back to the 'notFound' element...`,
        data: { notFound },
      })
      return notFound
    }
    options.logger.warning({
      message: `Route not found for '${currentUrl}' and no 'notFound' element was provided. Falling back to an empty element...`,
    })
    return <div></div>
  },
})
