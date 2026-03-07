import { Cache } from '@furystack/cache'
import type { CacheResult, CacheWithValue } from '@furystack/cache'
import { Shade, createComponent, flushUpdates } from '@furystack/shades'
import { using, usingAsync } from '@furystack/utils'

import { describe, expect, it, vi } from 'vitest'
import { CacheView } from './cache-view.js'

const TestContent = Shade<{ data: CacheWithValue<string> }>({
  customElementName: 'test-cache-content',
  render: ({ props }) => <span className="content-value">{props.data.value}</span>,
})

const TestContentWithLabel = Shade<{ data: CacheWithValue<string>; label: string }>({
  customElementName: 'test-cache-content-with-label',
  render: ({ props }) => (
    <span className="content-value">
      {props.label}: {props.data.value}
    </span>
  ),
})

const renderCacheView = async (
  cache: Cache<string, [string]>,
  args: [string],
  options?: {
    loader?: JSX.Element
    error?: (error: unknown, retry: () => void) => JSX.Element
  },
) => {
  const el = (
    <div>
      <CacheView cache={cache} args={args} content={TestContent} loader={options?.loader} error={options?.error} />
    </div>
  )
  const cacheView = el.firstElementChild as JSX.Element
  cacheView.updateComponent()
  await flushUpdates()
  return { container: el, cacheView }
}

describe('CacheView', () => {
  it('should be defined', () => {
    expect(CacheView).toBeDefined()
    expect(typeof CacheView).toBe('function')
  })

  it('should create a cache-view element', () => {
    using(new Cache<string, [string]>({ load: async (key) => key }), (cache) => {
      const el = (<CacheView cache={cache} args={['test']} content={TestContent} />) as unknown as HTMLElement
      expect(el).toBeDefined()
      expect(el.tagName?.toLowerCase()).toBe('shade-cache-view')
    })
  })

  describe('loading state', () => {
    it('should render null by default when loading', async () => {
      await usingAsync(
        new Cache<string, [string]>({
          load: () => new Promise(() => {}),
        }),
        async (cache) => {
          const { cacheView } = await renderCacheView(cache, ['test'])
          expect(cacheView.querySelector('test-cache-content')).toBeNull()
          expect(cacheView.querySelector('shade-result')).toBeNull()
        },
      )
    })

    it('should render custom loader when provided', async () => {
      await usingAsync(
        new Cache<string, [string]>({
          load: () => new Promise(() => {}),
        }),
        async (cache) => {
          const { cacheView } = await renderCacheView(cache, ['test'], {
            loader: (<span className="custom-loader">Loading...</span>) as unknown as JSX.Element,
          })
          const loader = cacheView.querySelector('.custom-loader')
          expect(loader).not.toBeNull()
          expect(loader?.textContent).toBe('Loading...')
        },
      )
    })
  })

  describe('loaded state', () => {
    it('should render content when cache has loaded value', async () => {
      await usingAsync(new Cache<string, [string]>({ load: async (key) => `Hello ${key}` }), async (cache) => {
        await cache.get('world')
        const { cacheView } = await renderCacheView(cache, ['world'])
        const contentEl = cacheView.querySelector('test-cache-content')
        expect(contentEl).not.toBeNull()
        const contentComponent = contentEl as JSX.Element
        contentComponent.updateComponent()
        await flushUpdates()
        const valueEl = contentComponent.querySelector('.content-value')
        expect(valueEl?.textContent).toBe('Hello world')
      })
    })
  })

  describe('failed state', () => {
    it('should render default error UI when cache has failed', async () => {
      await usingAsync(
        new Cache<string, [string]>({
          load: async () => {
            throw new Error('Test failure')
          },
        }),
        async (cache) => {
          try {
            await cache.get('test')
          } catch {
            // expected
          }
          const { cacheView } = await renderCacheView(cache, ['test'])
          const resultEl = cacheView.querySelector('shade-result')
          expect(resultEl).not.toBeNull()
          const resultComponent = resultEl as JSX.Element
          resultComponent.updateComponent()
          await flushUpdates()
          const titleEl = resultComponent.querySelector('.result-title') as JSX.Element
          titleEl.updateComponent()
          await flushUpdates()
          expect(titleEl?.textContent).toBe('Something went wrong')
        },
      )
    })

    it('should render custom error UI when error prop is provided', async () => {
      await usingAsync(
        new Cache<string, [string]>({
          load: async () => {
            throw new Error('Custom failure')
          },
        }),
        async (cache) => {
          try {
            await cache.get('test')
          } catch {
            // expected
          }
          const customError = vi.fn(
            (err: unknown, _retry: () => void) =>
              (<span className="custom-error">{String(err)}</span>) as unknown as JSX.Element,
          )
          const { cacheView } = await renderCacheView(cache, ['test'], { error: customError })
          expect(customError).toHaveBeenCalledOnce()
          expect(customError.mock.calls[0][0]).toBeInstanceOf(Error)
          const customErrorEl = cacheView.querySelector('.custom-error')
          expect(customErrorEl).not.toBeNull()
        },
      )
    })

    it('should not render content when failed even if stale value exists', async () => {
      await usingAsync(new Cache<string, [string]>({ load: async (key) => key }), async (cache) => {
        await cache.get('test')
        cache.setExplicitValue({
          loadArgs: ['test'],
          value: { status: 'failed', error: new Error('fail'), value: 'stale', updatedAt: new Date() },
        })
        const { cacheView } = await renderCacheView(cache, ['test'])
        expect(cacheView.querySelector('test-cache-content')).toBeNull()
        expect(cacheView.querySelector('shade-result')).not.toBeNull()
      })
    })

    it('should call cache.reload when retry is invoked', async () => {
      const loadFn = vi.fn<(key: string) => Promise<string>>(async () => {
        throw new Error('fail')
      })
      await usingAsync(new Cache<string, [string]>({ load: loadFn }), async (cache) => {
        try {
          await cache.get('test')
        } catch {
          // expected
        }
        let capturedRetry: (() => void) | undefined
        const customError = (_err: unknown, retry: () => void) => {
          capturedRetry = retry
          return (<span className="custom-error">Error</span>) as unknown as JSX.Element
        }
        await renderCacheView(cache, ['test'], { error: customError })
        expect(capturedRetry).toBeDefined()

        loadFn.mockResolvedValueOnce('recovered')
        capturedRetry!()
        await flushUpdates()

        const observable = cache.getObservable('test')
        const result = observable.getValue()
        expect(result.status).toBe('loaded')
        expect(result.value).toBe('recovered')
      })
    })
  })

  describe('obsolete state', () => {
    it('should render content when obsolete and trigger reload', async () => {
      const loadFn = vi.fn(async (key: string) => `Hello ${key}`)
      await usingAsync(new Cache<string, [string]>({ load: loadFn }), async (cache) => {
        await cache.get('test')
        cache.setObsolete('test')

        const { cacheView } = await renderCacheView(cache, ['test'])
        const contentEl = cacheView.querySelector('test-cache-content')
        expect(contentEl).not.toBeNull()

        await flushUpdates()
        // reload should have been called (initial load + obsolete reload)
        expect(loadFn).toHaveBeenCalledTimes(2)
      })
    })
  })

  describe('error takes priority over value', () => {
    it('should show error when failed with value, not content', async () => {
      await usingAsync(new Cache<string, [string]>({ load: async (key) => key }), async (cache) => {
        await cache.get('test')
        const failedWithValue: CacheResult<string> = {
          status: 'failed',
          error: new Error('whoops'),
          value: 'stale-data',
          updatedAt: new Date(),
        }
        cache.setExplicitValue({ loadArgs: ['test'], value: failedWithValue })
        const { cacheView } = await renderCacheView(cache, ['test'])
        expect(cacheView.querySelector('test-cache-content')).toBeNull()
        expect(cacheView.querySelector('shade-result')).not.toBeNull()
      })
    })
  })

  describe('contentProps', () => {
    it('should forward contentProps to the content component', async () => {
      await usingAsync(new Cache<string, [string]>({ load: async (key) => `Hello ${key}` }), async (cache) => {
        await cache.get('world')

        const el = (
          <div>
            <CacheView
              cache={cache}
              args={['world']}
              content={TestContentWithLabel}
              contentProps={{ label: 'Greeting' }}
            />
          </div>
        )
        const cacheView = el.firstElementChild as JSX.Element
        cacheView.updateComponent()
        await flushUpdates()

        const contentEl = cacheView.querySelector('test-cache-content-with-label') as JSX.Element
        expect(contentEl).not.toBeNull()
        contentEl.updateComponent()
        await flushUpdates()
        const valueEl = contentEl.querySelector('.content-value')
        expect(valueEl?.textContent).toBe('Greeting: Hello world')
      })
    })

    it('should forward contentProps when cache entry is obsolete', async () => {
      const loadFn = vi.fn(async (key: string) => `Hello ${key}`)
      await usingAsync(new Cache<string, [string]>({ load: loadFn }), async (cache) => {
        await cache.get('world')
        cache.setObsolete('world')

        const el = (
          <div>
            <CacheView
              cache={cache}
              args={['world']}
              content={TestContentWithLabel}
              contentProps={{ label: 'Stale' }}
            />
          </div>
        )
        const cacheView = el.firstElementChild as JSX.Element
        cacheView.updateComponent()
        await flushUpdates()

        const contentEl = cacheView.querySelector('test-cache-content-with-label') as JSX.Element
        expect(contentEl).not.toBeNull()
        contentEl.updateComponent()
        await flushUpdates()
        const valueEl = contentEl.querySelector('.content-value')
        expect(valueEl?.textContent).toBe('Stale: Hello world')
        expect(loadFn).toHaveBeenCalledTimes(2)
      })
    })
  })

  describe('view transitions', () => {
    const mockStartViewTransition = () => {
      const spy = vi.fn((optionsOrCallback: StartViewTransitionOptions | (() => void)) => {
        const update = typeof optionsOrCallback === 'function' ? optionsOrCallback : optionsOrCallback.update
        update?.()
        return {
          finished: Promise.resolve(),
          ready: Promise.resolve(),
          updateCallbackDone: Promise.resolve(),
          skipTransition: vi.fn(),
        } as unknown as ViewTransition
      })
      document.startViewTransition = spy as typeof document.startViewTransition
      return spy
    }

    it('should call startViewTransition when viewTransition is enabled and cache state category changes', async () => {
      const spy = mockStartViewTransition()
      await usingAsync(new Cache<string, [string]>({ load: async (key) => `loaded-${key}` }), async (cache) => {
        const el = (
          <div>
            <CacheView
              cache={cache}
              args={['test']}
              content={TestContent}
              loader={<span className="loader">Loading</span>}
              viewTransition
            />
          </div>
        )
        const cacheView = el.firstElementChild as JSX.Element
        cacheView.updateComponent()
        await flushUpdates()

        expect(cacheView.querySelector('.loader')).toBeTruthy()
        spy.mockClear()

        await cache.get('test')
        cacheView.updateComponent()
        await flushUpdates()

        expect(spy).toHaveBeenCalled()
      })
      delete (document as unknown as Record<string, unknown>).startViewTransition
    })

    it('should not call startViewTransition when viewTransition is not set', async () => {
      const spy = mockStartViewTransition()
      await usingAsync(new Cache<string, [string]>({ load: async (key) => `loaded-${key}` }), async (cache) => {
        const el = (
          <div>
            <CacheView
              cache={cache}
              args={['test']}
              content={TestContent}
              loader={<span className="loader">Loading</span>}
            />
          </div>
        )
        const cacheView = el.firstElementChild as JSX.Element
        cacheView.updateComponent()
        await flushUpdates()

        spy.mockClear()

        await cache.get('test')
        cacheView.updateComponent()
        await flushUpdates()

        expect(spy).not.toHaveBeenCalled()
      })
      delete (document as unknown as Record<string, unknown>).startViewTransition
    })
  })
})
