import { LocationService, Shade, createComponent } from '@furystack/shades'

type NavigateProps = {
  to: string
}

/**
 * Redirect helper component. Navigates to the given path on render
 * by replacing the current history entry so the intermediate URL
 * does not pollute the browser's back/forward stack.
 */
export const Navigate = Shade<NavigateProps>({
  shadowDomName: 'showcase-navigate',
  constructed: ({ props, injector }) => {
    const locationService = injector.getInstance(LocationService)
    const current = locationService.onLocationPathChanged.getValue()
    if (current !== props.to) {
      history.replaceState({}, '', props.to)
    }
  },
  render: () => <></>,
})
