import { Injector } from '@furystack/inject'
import { sleepAsync, usingAsync } from '@furystack/utils'
import { LazyLoad } from './lazy-load.js'

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { initializeShadeRoot } from '../initialize.js'
import { createComponent } from '../shade-component.js'
import { flushUpdates } from '../shade.js'

describe('Lazy Load', () => {
  beforeEach(() => {
    document.body.innerHTML = '<div id="root"></div>'
  })
  afterEach(() => {
    document.body.innerHTML = ''
    delete (document as unknown as Record<string, unknown>).startViewTransition
  })

  it('Shuld display the loader and completed state', async () => {
    await usingAsync(new Injector(), async (injector) => {
      const rootElement = document.getElementById('root') as HTMLDivElement

      initializeShadeRoot({
        injector,
        rootElement,
        jsxElement: (
          <LazyLoad
            loader={<div>Loading...</div>}
            component={async () => {
              await sleepAsync(100)
              return <div>Loaded</div>
            }}
          />
        ),
      })
      await flushUpdates()
      expect(document.body.innerHTML).toBe('<div id="root"><lazy-load><div>Loading...</div></lazy-load></div>')
      await sleepAsync(150)
      expect(document.body.innerHTML).toBe('<div id="root"><lazy-load><div>Loaded</div></lazy-load></div>')
    })
  })

  it('Shuld display the failed state with a retryer', async () => {
    await usingAsync(new Injector(), async (injector) => {
      const rootElement = document.getElementById('root') as HTMLDivElement

      const load = vi.fn(async () => {
        throw Error(':(')
      })

      initializeShadeRoot({
        injector,
        rootElement,
        jsxElement: (
          <LazyLoad
            loader={<div>Loading...</div>}
            component={load}
            error={(e, retry) => (
              <button id="retry" onclick={retry}>
                {(e as Error).message}
              </button>
            )}
          />
        ),
      })
      await flushUpdates()
      expect(document.body.innerHTML).toBe('<div id="root"><lazy-load><div>Loading...</div></lazy-load></div>')
      await flushUpdates()
      expect(load).toBeCalledTimes(1)
      expect(document.body.innerHTML).toBe('<div id="root"><lazy-load><button id="retry">:(</button></lazy-load></div>')
      document.getElementById('retry')?.click()
      expect(load).toBeCalledTimes(2)
    })
  })

  it('Should succeed on retry after initial failure', async () => {
    await usingAsync(new Injector(), async (injector) => {
      const rootElement = document.getElementById('root') as HTMLDivElement
      let counter = 0

      const load = vi.fn(async () => {
        if (!counter) {
          counter += 1
          throw Error(':(')
        }
        return <div>success</div>
      })

      initializeShadeRoot({
        injector,
        rootElement,
        jsxElement: (
          <LazyLoad
            loader={<div>Loading...</div>}
            component={load}
            error={(e, retry) => (
              <button id="retry" onclick={retry}>
                {(e as Error).message}
              </button>
            )}
          />
        ),
      })
      await flushUpdates()
      expect(document.body.innerHTML).toBe('<div id="root"><lazy-load><div>Loading...</div></lazy-load></div>')
      await flushUpdates()
      expect(load).toBeCalledTimes(1)
      expect(document.body.innerHTML).toBe('<div id="root"><lazy-load><button id="retry">:(</button></lazy-load></div>')
      document.getElementById('retry')?.click()
      expect(load).toBeCalledTimes(2)
      await flushUpdates()
      expect(document.body.innerHTML).toBe('<div id="root"><lazy-load><div>success</div></lazy-load></div>')
    })
  })

  it('should call startViewTransition when viewTransition is enabled and component loads', async () => {
    const startViewTransitionSpy = vi.fn((optionsOrCallback: StartViewTransitionOptions | (() => void)) => {
      const update = typeof optionsOrCallback === 'function' ? optionsOrCallback : optionsOrCallback.update
      update?.()
      return {
        finished: Promise.resolve(),
        ready: Promise.resolve(),
        updateCallbackDone: Promise.resolve(),
        skipTransition: vi.fn(),
      } as unknown as ViewTransition
    })
    document.startViewTransition = startViewTransitionSpy as typeof document.startViewTransition

    await usingAsync(new Injector(), async (injector) => {
      const rootElement = document.getElementById('root') as HTMLDivElement

      initializeShadeRoot({
        injector,
        rootElement,
        jsxElement: (
          <LazyLoad
            viewTransition
            loader={<div>Loading...</div>}
            component={async () => {
              await sleepAsync(50)
              return <div>Loaded</div>
            }}
          />
        ),
      })
      await flushUpdates()
      expect(document.body.innerHTML).toContain('Loading...')

      await sleepAsync(100)
      expect(startViewTransitionSpy).toHaveBeenCalledTimes(1)
      expect(document.body.innerHTML).toContain('Loaded')
    })
  })

  it('should not call startViewTransition when viewTransition is not set', async () => {
    const startViewTransitionSpy = vi.fn((optionsOrCallback: StartViewTransitionOptions | (() => void)) => {
      const update = typeof optionsOrCallback === 'function' ? optionsOrCallback : optionsOrCallback.update
      update?.()
      return {
        finished: Promise.resolve(),
        ready: Promise.resolve(),
        updateCallbackDone: Promise.resolve(),
        skipTransition: vi.fn(),
      } as unknown as ViewTransition
    })
    document.startViewTransition = startViewTransitionSpy as typeof document.startViewTransition

    await usingAsync(new Injector(), async (injector) => {
      const rootElement = document.getElementById('root') as HTMLDivElement

      initializeShadeRoot({
        injector,
        rootElement,
        jsxElement: (
          <LazyLoad
            loader={<div>Loading...</div>}
            component={async () => {
              await sleepAsync(50)
              return <div>Loaded</div>
            }}
          />
        ),
      })
      await flushUpdates()
      await sleepAsync(100)

      expect(startViewTransitionSpy).not.toHaveBeenCalled()
      expect(document.body.innerHTML).toContain('Loaded')
    })
  })
})
