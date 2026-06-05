import { describe, expect, it } from 'vitest'
import { BlobStoreError } from './blob-store-error.js'
import { MAX_BLOB_KEY_LENGTH, validateBlobKey } from './validate-blob-key.js'

describe('validateBlobKey', () => {
  it('accepts a normal key', () => {
    expect(() => validateBlobKey('uploads/2026/05/file.bin')).not.toThrow()
  })

  it('rejects empty strings', () => {
    expect(() => validateBlobKey('')).toThrow(BlobStoreError)
  })

  it('rejects non-string input', () => {
    expect(() => validateBlobKey(123 as unknown as string)).toThrow(BlobStoreError)
  })

  it('rejects keys longer than the limit', () => {
    const tooLong = 'a'.repeat(MAX_BLOB_KEY_LENGTH + 1)
    try {
      validateBlobKey(tooLong)
      throw new Error('should have thrown')
    } catch (error) {
      expect(BlobStoreError.is(error)).toBe(true)
      expect((error as BlobStoreError).code).toBe('invalid-key')
      expect((error as BlobStoreError).details.limit).toBe(MAX_BLOB_KEY_LENGTH)
    }
  })

  it('rejects NUL bytes', () => {
    expect(() => validateBlobKey('a\0b')).toThrow(/NUL/)
  })

  it('rejects leading slash', () => {
    expect(() => validateBlobKey('/leading')).toThrow(/start with/)
  })

  it('accepts a key exactly at the length limit', () => {
    expect(() => validateBlobKey('a'.repeat(MAX_BLOB_KEY_LENGTH))).not.toThrow()
  })
})
