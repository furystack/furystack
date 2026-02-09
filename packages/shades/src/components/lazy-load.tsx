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

    const tracker = useDisposable('loadTracker', () => {
      const state: {
        factory: (() => Promise<JSX.Element>) | null
        active: boolean
        [Symbol.dispose](): void
      } = {
        factory: null,
        active: true,
        [Symbol.dispose]() {
          state.active = false
        },
      }
      return state
    })

    const isNewFactory = tracker.factory !== props.component

    if (isNewFactory) {
      tracker.factory = props.component
      const factory = props.component

      factory()
        .then((loaded) => {
          if (tracker.active && tracker.factory === factory) {
            setError(undefined)
            setComponent(loaded)
          }
        })
        .catch((err: unknown) => {
          if (tracker.active && tracker.factory === factory) {
            setComponent(undefined)
            if (props.error) {
              setError(err)
            }
          }
        })

      return props.loader
    }

    if (error && props.error) {
      return props.error(error, async () => {
        const factory = props.component
        try {
          setError(undefined)
          setComponent(undefined)
          const loaded = await factory()
          if (tracker.active && tracker.factory === factory) {
            setComponent(loaded)
          }
        } catch (e) {
          if (tracker.active && tracker.factory === factory) {
            setError(e)
          }
        }
      })
    }
    if (component) {
      return component
    }
    return props.loader
  },
})
