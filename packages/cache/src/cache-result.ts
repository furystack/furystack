export interface LoadedCacheResult<T> {
  value: T
  status: 'loaded'
}

export interface PendingCacheResult<T> {
  status: 'pending'
}

export interface FailedCacheResult {
  error: unknown
  status: 'failed'
}

export interface ObsoleteCacheResult<T> {
  value: T
  status: 'obsolete'
}

export type CacheResult<T> = LoadedCacheResult<T> | PendingCacheResult<T> | FailedCacheResult | ObsoleteCacheResult<T>

export const isLoadedCacheResult = <T>(result: CacheResult<T>): result is LoadedCacheResult<T> =>
  result.status === 'loaded'

export const isPendingCacheResult = <T>(result: CacheResult<T>): result is PendingCacheResult<T> =>
  result.status === 'pending'

export const isFailedCacheResult = <T>(result: CacheResult<T>): result is FailedCacheResult =>
  result.status === 'failed'

export const isObsoleteCacheResult = <T>(result: CacheResult<T>): result is ObsoleteCacheResult<T> =>
  result.status === 'obsolete'
