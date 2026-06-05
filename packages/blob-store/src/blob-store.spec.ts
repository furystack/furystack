import { createInjector } from '@furystack/inject'
import { describe, expect, it } from 'vitest'
import { BlobStoreError, BlobStoreNotConfiguredError } from './blob-store-error.js'
import { BlobStore } from './blob-store.js'
import { InMemoryBlobStore } from './in-memory-blob-store.js'

describe('BlobStore token', () => {
  it('throws BlobStoreNotConfiguredError on the default factory', async () => {
    await using injector = createInjector()
    expect(() => injector.get(BlobStore)).toThrow(BlobStoreNotConfiguredError)
  })

  it('honours an override binding', async () => {
    await using injector = createInjector()
    injector.bind(BlobStore, () => new InMemoryBlobStore({ name: 'override' }))
    const store = injector.get(BlobStore)
    expect(store).toBeInstanceOf(InMemoryBlobStore)
    expect(store.storeName).toBe('override')
  })

  it('singleton: returns the same instance per injector', async () => {
    await using injector = createInjector()
    injector.bind(BlobStore, () => new InMemoryBlobStore())
    expect(injector.get(BlobStore)).toBe(injector.get(BlobStore))
  })

  it('default-factory error is a BlobStoreError with invalid-config code', async () => {
    await using injector = createInjector()
    try {
      injector.get(BlobStore)
      throw new Error('should have thrown')
    } catch (error) {
      expect(BlobStoreError.is(error)).toBe(true)
      expect((error as BlobStoreError).code).toBe('invalid-config')
    }
  })
})
