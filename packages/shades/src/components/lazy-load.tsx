import { Shade } from '../shade'

export interface LazyLoadProps {
  loader: JSX.Element
  error?: (error: Error) => JSX.Element
  component: () => Promise<JSX.Element>
}

export interface LazyLoadState {
  component?: JSX.Element
  error?: Error
}

export const LazyLoad = Shade<LazyLoadProps, LazyLoadState>({
  initialState: {},
  shadowDomName: 'lazy-load',
  constructed: async ({ props, updateState, logger }) => {
    try {
      const loaded = await props.component()
      logger.verbose({ message: `Component lazy-loaded`, data: loaded })
      updateState({ component: loaded })
    } catch (error) {
      logger.error({ message: `Failed to lazy-load component`, data: { error } })
      if (props.error) {
        updateState({ error })
      } else {
        throw error
      }
    }
  },
  render: ({ props, getState }) => {
    const currentState = getState()
    if (currentState.error && props.error) {
      return props.error(currentState.error)
    }
    if (currentState.component) {
      return currentState.component
    }
    return props.loader
  },
})
