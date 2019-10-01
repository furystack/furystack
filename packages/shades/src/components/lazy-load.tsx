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
  construct: async ({ props, updateState }) => {
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
