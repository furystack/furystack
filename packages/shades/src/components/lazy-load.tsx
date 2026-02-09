import { Shade } from '../shade.js'

export interface LazyLoadProps {
  loader: JSX.Element
  error?: (error: unknown, retry: () => Promise<void>) => JSX.Element
  component: () => Promise<JSX.Element>
}

export const LazyLoad = Shade<LazyLoadProps>({
  shadowDomName: 'lazy-load',
  render: ({ props, useState, useDisposable }) => {
    const [error, setError] = useState<unknown>('error', undefined)
    const [component, setComponent] = useState<JSX.Element | undefined>('component', undefined)

    let isConnected = true

    useDisposable('loader', () => {
      props
        .component()
        .then((loaded) => {
          if (isConnected) {
            setComponent(loaded)
          }
        })
        .catch((err: unknown) => {
          if (props.error) {
            if (isConnected) {
              setError(err)
            }
          }
        })
      return {
        [Symbol.dispose]: () => {
          isConnected = false
        },
      }
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
