import { isFailedCacheResult, isLoadedCacheResult, isPendingCacheResult } from './cache-result'

describe('CacheResult', () => {
  it('should be able to use the isLoaded type guard', () => {
    expect(isLoadedCacheResult({ status: 'loaded', value: 'foo' })).toBe(true)
    expect(isLoadedCacheResult({ status: 'pending', value: new Promise(() => 'foo') })).toBe(false)
    expect(isLoadedCacheResult({ status: 'failed', error: 'foo' })).toBe(false)
  })

  it('should be able to use the isPending type guard', () => {
    expect(isPendingCacheResult({ status: 'pending', value: new Promise(() => 'foo') })).toBe(true)
    expect(isPendingCacheResult({ status: 'loaded', value: 'foo' })).toBe(false)
    expect(isPendingCacheResult({ status: 'failed', error: 'foo' })).toBe(false)
  })

  it('should be able to use the isFailed type guard', () => {
    expect(isFailedCacheResult({ status: 'failed', error: 'foo' })).toBe(true)
    expect(isFailedCacheResult({ status: 'pending', value: new Promise(() => 'foo') })).toBe(false)
    expect(isFailedCacheResult({ status: 'loaded', value: 'foo' })).toBe(false)
  })
})
