import type { Cache, CacheWithValue } from '@furystack/cache'
import { hasCacheValue, isFailedCacheResult, isObsoleteCacheResult } from '@furystack/cache'
import type { PartialElement, ShadeComponent } from '@furystack/shades'
import { Shade, createComponent } from '@furystack/shades'

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
} & (keyof Omit<TContentProps, 'data' | keyof PartialElement<HTMLElement>> extends never
  ? { contentProps?: never }
  : { contentProps: Omit<TContentProps, 'data' | keyof PartialElement<HTMLElement>> })

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
 *
 * // With custom content props
 * const MyContentWithLabel = Shade<{ data: CacheWithValue<User>; label: string }>({
 *   shadowDomName: 'my-content-with-label',
 *   render: ({ props }) => <div>{props.label}: {props.data.value.name}</div>,
 * })
 *
 * <CacheView cache={userCache} args={[userId]} content={MyContentWithLabel} contentProps={{ label: 'User' }} />
 * ```
 */
type InternalCacheViewProps = {
  cache: Cache<unknown, unknown[]>
  args: unknown[]
  content: ShadeComponent<{ data: CacheWithValue<unknown> }>
  contentProps?: Record<string, unknown>
  loader?: JSX.Element
  error?: (error: unknown, retry: () => void) => JSX.Element
}

export const CacheView = Shade<InternalCacheViewProps>({
  shadowDomName: 'shade-cache-view',
  css: {
    fontFamily: cssVariableTheme.typography.fontFamily,
  },
  render: ({ props, useObservable, useState }): JSX.Element | null => {
    const { cache, args, content, loader, error, contentProps } = props

    const argsKey = JSON.stringify(args)
    const observable = cache.getObservable(...args)

    const [result] = useObservable(`cache-${argsKey}`, observable)

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
      if (isObsoleteCacheResult(result)) {
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
        data: result,
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
