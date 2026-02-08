import { Shade } from '../shade.js'

export interface LazyLoadProps {
  loader: JSX.Element
  error?: (error: unknown, retry: () => Promise<void>) => JSX.Element
  component: () => Promise<JSX.Element>
}

export interface LazyLoadState {
  component?: JSX.Element
  error?: unknown
}

export const LazyLoad = Shade<LazyLoadProps>({
  tagName: 'lazy-load',
  render: ({ props, useState, useDisposable, element }) => {
    const [error, setError] = useState<unknown>('error', undefined)
    const [component, setComponent] = useState<JSX.Element | undefined>('component', undefined)

    useDisposable('loader', () => {
      void (async () => {
        try {
          const loaded = await props.component()
          if (element.isConnected) {
            setComponent(loaded)
          }
        } catch (e) {
          if (props.error) {
            if (element.isConnected) {
              setError(e)
            }
          } else {
            throw e
          }
        }
      })()
      return { [Symbol.dispose]: () => {} }
    })

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
