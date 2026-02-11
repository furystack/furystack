import type { Cache, CacheResult, CacheWithValue } from '@furystack/cache'
import { hasCacheValue, isFailedCacheResult, isObsoleteCacheResult } from '@furystack/cache'
import type { ShadeComponent } from '@furystack/shades'
import { Shade, createComponent } from '@furystack/shades'

import { Button } from './button.js'
import { Result } from './result.js'

/**
 * Props for the CacheView component.
 * @typeParam TData - The type of data stored in the cache
 * @typeParam TArgs - The tuple type of arguments used to identify the cache entry
 */
export type CacheViewProps<TData, TArgs extends any[]> = {
  /** The cache instance to observe and control */
  cache: Cache<TData, TArgs>
  /** The arguments identifying which cache entry to display */
  args: TArgs
  /** Shades component rendered when a value is available (loaded or obsolete). Receives CacheWithValue<TData>. */
  content: ShadeComponent<{ data: CacheWithValue<TData> }>
  /** Optional custom loader element. Default: null (nothing shown when loading). */
  loader?: JSX.Element
  /**
   * Optional custom error UI. Receives the error and a retry callback.
   * The retry callback calls cache.reload(...args).
   * If not provided, a default Result + retry Button is shown.
   */
  error?: (error: unknown, retry: () => void) => JSX.Element
}

const getDefaultErrorUi = (error: unknown, retry: () => void): JSX.Element =>
  (
    <Result status="error" title="Something went wrong" subtitle={String(error)}>
      <Button variant="outlined" onclick={retry}>
        Retry
      </Button>
    </Result>
  ) as unknown as JSX.Element

/**
 * CacheView renders the state of a cache entry for the given cache + args.
 *
 * It subscribes to the cache observable and handles all states:
 * 1. **Error first** - If the cache entry has failed, shows the error UI with a retry button.
 * 2. **Value next** - If the entry has a value (loaded or obsolete), renders the content component.
 *    When obsolete, it also triggers a reload automatically.
 * 3. **Loading last** - If there is no value and no error, shows the loader (or null by default).
 *
 * @example
 * ```tsx
 * const MyContent = Shade<{ data: CacheWithValue<User> }>({
 *   shadowDomName: 'my-content',
 *   render: ({ props }) => <div>{props.data.value.name}</div>,
 * })
 *
 * <CacheView cache={userCache} args={[userId]} content={MyContent} />
 * ```
 */
export const CacheView: <TData, TArgs extends any[]>(
  props: CacheViewProps<TData, TArgs>,
) => JSX.Element = Shade({
  shadowDomName: 'shade-cache-view',
  render: ({ props, useObservable, useState }): JSX.Element | null => {
    const { cache, args, content, loader, error } = props as CacheViewProps<unknown, any[]>

    const argsKey = JSON.stringify(args)
    const observable = cache.getObservable(...args)

    const [result] = useObservable<CacheResult<unknown>>(`cache-${argsKey}`, observable)

    const [lastReloadedArgsKey, setLastReloadedArgsKey] = useState<string | null>('lastReloadedArgsKey', null)

    const retry = () => {
      cache.reload(...args).catch(() => {
        /* error state will be set by cache */
      })
    }

    // 1. Error first
    if (isFailedCacheResult(result)) {
      const errorRenderer = error ?? getDefaultErrorUi
      return errorRenderer(result.error, retry)
    }

    // 2. Value next
    if (hasCacheValue(result)) {
      if (isObsoleteCacheResult(result) && lastReloadedArgsKey !== argsKey) {
        setLastReloadedArgsKey(argsKey)
        cache.reload(...args).catch(() => {
          /* error state will be set by cache */
        })
      }
      return createComponent(content as ShadeComponent<{ data: CacheWithValue<unknown> }>, {
        data: result,
      }) as unknown as JSX.Element
    }

    // 3. Loading last
    return loader ?? null
  },
})
