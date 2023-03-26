export interface LoadedCacheResult<T> {
  value: T
  status: 'loaded'
}

export interface PendingCacheResult<T> {
  value: Promise<T>
  status: 'pending'
}

export interface FailedCacheResult {
  error: unknown
  status: 'failed'
}

export type CacheResult<T> = LoadedCacheResult<T> | PendingCacheResult<T> | FailedCacheResult

export const isLoadedCacheResult = <T>(result: CacheResult<T>): result is LoadedCacheResult<T> =>
  result.status === 'loaded'

export const isPendingCacheResult = <T>(result: CacheResult<T>): result is PendingCacheResult<T> =>
  result.status === 'pending'

export const isFailedCacheResult = <T>(result: CacheResult<T>): result is FailedCacheResult =>
  result.status === 'failed'
