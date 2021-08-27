import { Shade } from '../shade'

export interface LazyLoadProps {
  loader: JSX.Element
  error?: (error: unknown, retry: () => void) => JSX.Element
  component: () => Promise<JSX.Element>
}

export interface LazyLoadState {
  component?: JSX.Element
  error?: unknown
}

export const LazyLoad = Shade<LazyLoadProps, LazyLoadState>({
  getInitialState: () => ({}),
  shadowDomName: 'lazy-load',
  constructed: async ({ props, updateState }) => {
    try {
      const loaded = await props.component()
      updateState({ component: loaded })
    } catch (error) {
      if (props.error) {
        updateState({ error })
      } else {
        throw error
      }
    }
  },
  render: ({ props, getState, updateState }) => {
    const currentState = getState()
    if (currentState.error && props.error) {
      return props.error(currentState.error, async () => {
        try {
          updateState({ error: undefined, component: undefined })
          const loaded = await props.component()
          updateState({ component: loaded })
        } catch (error) {
          updateState({ error })
        }
      })
    }
    if (currentState.component) {
      return currentState.component
    }
    return props.loader
  },
})
