import { describe, expect, it } from 'vitest'
import { BlobStoreError, BlobStoreNotConfiguredError } from './blob-store-error.js'

describe('BlobStoreError', () => {
  it('exposes code + details + name', () => {
    const error = new BlobStoreError('not-found', 'missing', { key: 'a/b' })
    expect(error).toBeInstanceOf(Error)
    expect(error.name).toBe('BlobStoreError')
    expect(error.code).toBe('not-found')
    expect(error.details.key).toBe('a/b')
  })

  it('preserves Error.cause when supplied via details', () => {
    const cause = new Error('boom')
    const error = new BlobStoreError('io-error', 'wrapper', { cause })
    expect(error.cause).toBe(cause)
    expect(error.details.cause).toBe(cause)
  })

  it('omits Error.cause when no cause is supplied', () => {
    const error = new BlobStoreError('not-found', 'missing')
    expect(error.cause).toBeUndefined()
  })

  describe('BlobStoreError.is', () => {
    it('returns true for BlobStoreError instances', () => {
      expect(BlobStoreError.is(new BlobStoreError('not-found', 'msg'))).toBe(true)
    })

    it('returns true for cross-realm errors named BlobStoreError', () => {
      const fake = new Error('alias')
      fake.name = 'BlobStoreError'
      expect(BlobStoreError.is(fake)).toBe(true)
    })

    it('returns false for unrelated errors', () => {
      expect(BlobStoreError.is(new Error('plain'))).toBe(false)
      expect(BlobStoreError.is('not an error')).toBe(false)
      expect(BlobStoreError.is(undefined)).toBe(false)
    })
  })

  describe('BlobStoreNotConfiguredError', () => {
    it('is a BlobStoreError with code invalid-config and a friendly message', () => {
      const error = new BlobStoreNotConfiguredError()
      expect(error).toBeInstanceOf(BlobStoreError)
      expect(error.code).toBe('invalid-config')
      expect(error.name).toBe('BlobStoreNotConfiguredError')
      expect(error.message).toMatch(/has not been configured/)
    })
  })
})
