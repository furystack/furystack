/* eslint-disable @typescript-eslint/ban-ts-comment */
import {
  hasCacheValue,
  isFailedCacheResult,
  isLoadedCacheResult,
  isObsoleteCacheResult,
  isPendingCacheResult,
} from './cache-result'
import { describe, it, expect } from 'vitest'

describe('CacheResult', () => {
  it('should be able to use the isLoaded type guard', () => {
    expect(isLoadedCacheResult({ status: 'loaded', value: 'foo', updatedAt: new Date() })).toBe(true)
    expect(isLoadedCacheResult({ status: 'loading', updatedAt: new Date() })).toBe(false)
    expect(isLoadedCacheResult({ status: 'failed', error: 'foo', updatedAt: new Date() })).toBe(false)
  })

  it('should be able to use the isPending type guard', () => {
    expect(isPendingCacheResult({ status: 'loading', updatedAt: new Date() })).toBe(true)
    expect(isPendingCacheResult({ status: 'loaded', value: 'foo', updatedAt: new Date() })).toBe(false)
    expect(isPendingCacheResult({ status: 'failed', error: 'foo', updatedAt: new Date() })).toBe(false)
  })

  it('should be able to use the isFailed type guard', () => {
    expect(isFailedCacheResult({ status: 'failed', error: 'foo', updatedAt: new Date() })).toBe(true)
    expect(isFailedCacheResult({ status: 'loading', updatedAt: new Date() })).toBe(false)
    expect(isFailedCacheResult({ status: 'loaded', value: 'foo', updatedAt: new Date() })).toBe(false)
  })

  it('should be able to use the isObsolete type guard', () => {
    expect(isObsoleteCacheResult({ status: 'obsolete', value: 'foo', updatedAt: new Date() })).toBe(true)
    expect(isObsoleteCacheResult({ status: 'loading', updatedAt: new Date() })).toBe(false)
    expect(isObsoleteCacheResult({ status: 'loaded', value: 'foo', updatedAt: new Date() })).toBe(false)
  })

  it('should be able to use the hasCacheValue type guard', () => {
    expect(hasCacheValue({ status: 'loaded', value: 'foo', updatedAt: new Date() })).toBe(true)
    expect(hasCacheValue({ status: 'loading', updatedAt: new Date() })).toBe(false)
    expect(hasCacheValue({ status: 'failed', error: 'foo', updatedAt: new Date() })).toBe(false)

    // @ts-expect-error
    expect(hasCacheValue({ status: 'loaded' })).toBe(false)
    // @ts-expect-error
    expect(hasCacheValue({ status: 'pending' })).toBe(false)
    // @ts-expect-error
    expect(hasCacheValue({ status: 'failed' })).toBe(false)

    // @ts-expect-error
    expect(hasCacheValue({ status: 'loaded', value: 'valami' })).toBe(false)
  })
})
