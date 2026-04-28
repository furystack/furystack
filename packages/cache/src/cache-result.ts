export interface LoadedCacheResult<T> {
  value: T
  status: 'loaded'
  updatedAt: Date
}

export interface LoadingCacheResult<T> {
  status: 'loading'
  value?: T
  updatedAt: Date
}

export interface FailedCacheResult<T> {
  value?: T
  error: unknown
  status: 'failed'
  updatedAt: Date
}

export interface ObsoleteCacheResult<T> {
  value: T
  status: 'obsolete'
  updatedAt: Date
}

/**
 * Discriminated union over a cache entry's lifecycle:
 *
 * - `loading` — entry is being fetched. May carry the previous `value` while
 *   refreshing (stale-while-revalidate); set to `undefined` on first load.
 * - `loaded` — fresh value present. Stays `loaded` until the stale timer
 *   fires (→ `obsolete`) or a new `reload` runs (→ `loading`).
 * - `obsolete` — value is still present but should be refreshed; consumers
 *   like `CacheView` trigger a reload on first observation.
 * - `failed` — load rejected. May still carry the previous `value` so
 *   consumers can decide between showing stale data or surfacing the error.
 *
 * Discriminate on `status`. Use the type-guards below to narrow.
 */
export type CacheResult<T> =
  | LoadedCacheResult<T>
  | LoadingCacheResult<T>
  | FailedCacheResult<T>
  | ObsoleteCacheResult<T>

/** Narrowing intersection: a {@link CacheResult} that definitely carries a value. */
export type CacheWithValue<T> = CacheResult<T> & {
  value: T
  updatedAt: Date
}

export const isLoadedCacheResult = <T>(result: CacheResult<T>): result is LoadedCacheResult<T> =>
  result.status === 'loaded'

export const isPendingCacheResult = <T>(result: CacheResult<T>): result is LoadingCacheResult<T> =>
  result.status === 'loading'

export const isFailedCacheResult = <T>(result: CacheResult<T>): result is FailedCacheResult<T> =>
  result.status === 'failed'

export const isObsoleteCacheResult = <T>(result: CacheResult<T>): result is ObsoleteCacheResult<T> =>
  result.status === 'obsolete'

/**
 * Narrows to {@link CacheWithValue}. Returns `true` for any status whose
 * `value` is present — i.e. `loaded` / `obsolete` always, `loading` /
 * `failed` only when stale-while-revalidate has populated `value`.
 */
export const hasCacheValue = <T>(result: CacheResult<T>): result is CacheWithValue<T> =>
  result.value !== undefined && result.updatedAt instanceof Date
