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

export const LazyLoad = Shade<LazyLoadProps>({
  shadowDomName: 'lazy-load',
  constructed: async ({ props, useState }) => {
    const [_component, setComponent] = useState<JSX.Element | undefined>('component', undefined)
    const [_errorState, setErrorState] = useState<unknown | undefined>('error', undefined)
    let isMounted = true
    try {
      const loaded = await props.component()
      isMounted && setComponent(loaded)
    } catch (error) {
      if (props.error) {
        isMounted && setErrorState(error)
      } else {
        throw error
      }
    }
    return () => {
      isMounted = false
    }
  },
  render: ({ props, useState }) => {
    const [error, setError] = useState<unknown | undefined>('error', undefined)
    const [component, setComponent] = useState<JSX.Element | undefined>('component', undefined)

    if (error && props.error) {
      return props.error(error, async () => {
        try {
          setError(undefined)
          setComponent(undefined)
          const loaded = await props.component()
          setComponent(loaded)
        } catch (e) {
          setError(e)
        }
      })
    }
    if (component) {
      return component
    }
    return props.loader
  },
})
