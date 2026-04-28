import type { Cache, CacheWithValue } from '@furystack/cache'
import { hasCacheValue, isFailedCacheResult, isObsoleteCacheResult } from '@furystack/cache'
import type { PartialElement, ShadeComponent, ViewTransitionConfig } from '@furystack/shades'
import { Shade, createComponent, transitionedValue } from '@furystack/shades'

import { cssVariableTheme } from '../services/css-variable-theme.js'
import { Button } from './button.js'
import { Result } from './result.js'

/**
 * Props for the CacheView component.
 * @typeParam TData - The type of data stored in the cache
 * @typeParam TArgs - The tuple type of arguments used to identify the cache entry
 * @typeParam TContentProps - The full props type of the content component (must include `data`)
 */
export type CacheViewProps<
  TData,
  TArgs extends any[],
  TContentProps extends { data: CacheWithValue<TData> } = { data: CacheWithValue<TData> },
> = {
  /** The cache instance to observe and control */
  cache: Cache<TData, TArgs>
  /** The arguments identifying which cache entry to display */
  args: TArgs
  /** Shades component rendered when a value is available (loaded or obsolete). */
  content: ShadeComponent<TContentProps>
  /** Optional custom loader element. Default: null (nothing shown when loading). */
  loader?: JSX.Element
  /**
   * Optional custom error UI. Receives the error and a retry callback.
   * The retry callback calls cache.reload(...args).
   * If not provided, a default Result + retry Button is shown.
   */
  error?: (error: unknown, retry: () => void) => JSX.Element
  viewTransition?: boolean | ViewTransitionConfig
} & (keyof Omit<TContentProps, 'data' | keyof PartialElement<HTMLElement>> extends never
  ? { contentProps?: never }
  : { contentProps: Omit<TContentProps, 'data' | keyof PartialElement<HTMLElement>> })

const getDefaultErrorUi = (error: unknown, retry: () => void): JSX.Element => (
  <Result status="error" title="Something went wrong" subtitle={String(error)}>
    <Button variant="outlined" onclick={retry}>
      Retry
    </Button>
  </Result>
)

type InternalCacheViewProps = {
  cache: Cache<unknown, unknown[]>
  args: unknown[]
  content: ShadeComponent<{ data: CacheWithValue<unknown> }>
  contentProps?: Record<string, unknown>
  loader?: JSX.Element
  error?: (error: unknown, retry: () => void) => JSX.Element
  viewTransition?: boolean | ViewTransitionConfig
}

/**
 * Renders the state of a cache entry for the given `cache` + `args`.
 *
 * Subscribes to the cache observable and dispatches in this order:
 * 1. **Error** — failed result renders the error UI with a retry callback.
 * 2. **Value** — loaded or obsolete result renders `content`. Obsolete also
 *    triggers a single `cache.reload(...args)` per obsolete cycle.
 * 3. **Loading** — no value, no error: renders `loader` (default `null`).
 *
 * @example
 * ```tsx
 * const MyContent = Shade<{ data: CacheWithValue<User> }>({
 *   customElementName: 'my-content',
 *   render: ({ props }) => <div>{props.data.value.name}</div>,
 * })
 *
 * <CacheView cache={userCache} args={[userId]} content={MyContent} />
 * ```
 */
export const CacheView = Shade<InternalCacheViewProps>({
  customElementName: 'shade-cache-view',
  css: {
    fontFamily: cssVariableTheme.typography.fontFamily,
  },
  render: ({ props, useObservable, useState }): JSX.Element | null => {
    const { cache, args, content, loader, error, contentProps, viewTransition } = props

    const argsKey = JSON.stringify(args)
    const observable = cache.getObservable(...args)

    const [result] = useObservable(`cache-${argsKey}`, observable)

    const getCategory = (r: typeof result) =>
      isFailedCacheResult(r) ? 'error' : hasCacheValue(r) ? 'value' : 'loading'

    const displayedResult = transitionedValue(
      useState,
      'displayedResult',
      result,
      viewTransition,
      (prev, next) => getCategory(prev) !== getCategory(next),
    )

    const [lastReloadedArgsKey, setLastReloadedArgsKey] = useState<string | null>('lastReloadedArgsKey', null)

    const retry = () => {
      cache.reload(...args).catch(() => {
        /* error state will be set by cache */
      })
    }

    // 1. Error first
    if (isFailedCacheResult(displayedResult)) {
      const errorRenderer = error ?? getDefaultErrorUi
      return errorRenderer(displayedResult.error, retry)
    }

    // 2. Value next
    if (hasCacheValue(displayedResult)) {
      if (isObsoleteCacheResult(displayedResult)) {
        if (lastReloadedArgsKey !== argsKey) {
          setLastReloadedArgsKey(argsKey)
          cache.reload(...args).catch(() => {
            /* error state will be set by cache */
          })
        }
      } else if (lastReloadedArgsKey !== null) {
        setLastReloadedArgsKey(null)
      }
      return createComponent(content, {
        data: displayedResult,
        ...(contentProps ?? {}),
      }) as unknown as JSX.Element
    }

    // 3. Loading last
    return loader ?? null
  },
}) as unknown as <
  TData,
  TArgs extends any[],
  TContentProps extends { data: CacheWithValue<TData> } = { data: CacheWithValue<TData> },
>(
  props: CacheViewProps<TData, TArgs, TContentProps>,
) => JSX.Element
