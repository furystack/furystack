import { LocationService, Shade, createComponent } from '@furystack/shades'

type NavigateProps = {
  to: string
}

/**
 * Redirect helper component. Navigates to the given path on render
 * by calling history.pushState and updating LocationService state.
 */
export const Navigate = Shade<NavigateProps>({
  shadowDomName: 'showcase-navigate',
  constructed: ({ props, injector }) => {
    const locationService = injector.getInstance(LocationService)
    const current = locationService.onLocationPathChanged.getValue()
    if (current !== props.to) {
      history.pushState({}, '', props.to)
    }
  },
  render: () => <></>,
})
