export interface UninitializedCacheResult<T> {
  status: 'uninitialized'
  value?: T
  updatedAt: Date
}

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

export type CacheResult<T> =
  | LoadedCacheResult<T>
  | LoadingCacheResult<T>
  | FailedCacheResult<T>
  | ObsoleteCacheResult<T>
  | UninitializedCacheResult<T>

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

export const hasCacheValue = <T>(result: CacheResult<T>): result is CacheWithValue<T> =>
  result.value !== undefined && result.updatedAt instanceof Date
