import { Cache } from '@furystack/cache'
import type { CacheResult, CacheWithValue } from '@furystack/cache'
import { Shade, createComponent, flushUpdates } from '@furystack/shades'
import { sleepAsync } from '@furystack/utils'
import { describe, expect, it, vi } from 'vitest'
import { CacheView } from './cache-view.js'

const TestContent = Shade<{ data: CacheWithValue<string> }>({
  shadowDomName: 'test-cache-content',
  render: ({ props }) => <span className="content-value">{props.data.value}</span>,
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
    const cache = new Cache<string, [string]>({ load: async (key) => key })
    const el = (<CacheView cache={cache} args={['test']} content={TestContent} />) as unknown as HTMLElement
    expect(el).toBeDefined()
    expect(el.tagName?.toLowerCase()).toBe('shade-cache-view')
    cache[Symbol.dispose]()
  })

  describe('loading state', () => {
    it('should render null by default when loading', async () => {
      const cache = new Cache<string, [string]>({
        load: () => new Promise(() => {}),
      })
      const { cacheView } = await renderCacheView(cache, ['test'])
      expect(cacheView.querySelector('test-cache-content')).toBeNull()
      expect(cacheView.querySelector('shade-result')).toBeNull()
      cache[Symbol.dispose]()
    })

    it('should render custom loader when provided', async () => {
      const cache = new Cache<string, [string]>({
        load: () => new Promise(() => {}),
      })
      const { cacheView } = await renderCacheView(cache, ['test'], {
        loader: (<span className="custom-loader">Loading...</span>) as unknown as JSX.Element,
      })
      const loader = cacheView.querySelector('.custom-loader')
      expect(loader).not.toBeNull()
      expect(loader?.textContent).toBe('Loading...')
      cache[Symbol.dispose]()
    })
  })

  describe('loaded state', () => {
    it('should render content when cache has loaded value', async () => {
      const cache = new Cache<string, [string]>({ load: async (key) => `Hello ${key}` })
      await cache.get('world')
      const { cacheView } = await renderCacheView(cache, ['world'])
      const contentEl = cacheView.querySelector('test-cache-content')
      expect(contentEl).not.toBeNull()
      const contentComponent = contentEl as JSX.Element
      contentComponent.updateComponent()
      await flushUpdates()
      const valueEl = contentComponent.querySelector('.content-value')
      expect(valueEl?.textContent).toBe('Hello world')
      cache[Symbol.dispose]()
    })
  })

  describe('failed state', () => {
    it('should render default error UI when cache has failed', async () => {
      const cache = new Cache<string, [string]>({
        load: async () => {
          throw new Error('Test failure')
        },
      })
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
      expect(resultComponent.querySelector('.result-title')?.textContent).toBe('Something went wrong')
      cache[Symbol.dispose]()
    })

    it('should render custom error UI when error prop is provided', async () => {
      const cache = new Cache<string, [string]>({
        load: async () => {
          throw new Error('Custom failure')
        },
      })
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
      cache[Symbol.dispose]()
    })

    it('should not render content when failed even if stale value exists', async () => {
      const cache = new Cache<string, [string]>({ load: async (key) => key })
      await cache.get('test')
      cache.setExplicitValue({
        loadArgs: ['test'],
        value: { status: 'failed', error: new Error('fail'), value: 'stale', updatedAt: new Date() },
      })
      const { cacheView } = await renderCacheView(cache, ['test'])
      expect(cacheView.querySelector('test-cache-content')).toBeNull()
      expect(cacheView.querySelector('shade-result')).not.toBeNull()
      cache[Symbol.dispose]()
    })

    it('should call cache.reload when retry is invoked', async () => {
      const loadFn = vi.fn(async () => {
        throw new Error('fail')
      })
      const cache = new Cache<string, [string]>({ load: loadFn })
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
      await sleepAsync(50)

      const observable = cache.getObservable('test')
      const result = observable.getValue()
      expect(result.status).toBe('loaded')
      expect(result.value).toBe('recovered')
      cache[Symbol.dispose]()
    })
  })

  describe('obsolete state', () => {
    it('should render content when obsolete and trigger reload', async () => {
      const loadFn = vi.fn(async (key: string) => `Hello ${key}`)
      const cache = new Cache<string, [string]>({ load: loadFn })
      await cache.get('test')
      cache.setObsolete('test')

      const { cacheView } = await renderCacheView(cache, ['test'])
      const contentEl = cacheView.querySelector('test-cache-content')
      expect(contentEl).not.toBeNull()

      await sleepAsync(50)
      // reload should have been called (initial load + obsolete reload)
      expect(loadFn).toHaveBeenCalledTimes(2)
      cache[Symbol.dispose]()
    })
  })

  describe('error takes priority over value', () => {
    it('should show error when failed with value, not content', async () => {
      const cache = new Cache<string, [string]>({ load: async (key) => key })
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
      cache[Symbol.dispose]()
    })
  })
})
