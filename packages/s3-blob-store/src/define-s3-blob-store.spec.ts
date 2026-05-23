import type { S3Client } from '@aws-sdk/client-s3'
import { describe, expect, it } from 'vitest'
import { BlobStore } from '@furystack/blob-store'
import { createInjector } from '@furystack/inject'
import { defineS3BlobStore } from './define-s3-blob-store.js'
import { S3BlobStore } from './s3-blob-store.js'

describe('defineS3BlobStore', () => {
  it('binds an S3BlobStore on the BlobStore token', async () => {
    await using injector = createInjector()
    injector.bind(BlobStore, defineS3BlobStore({ client: {} as S3Client, bucket: 'tests', name: 'bound' }))
    const store = injector.get(BlobStore)
    expect(store).toBeInstanceOf(S3BlobStore)
    expect(store.storeName).toBe('bound')
  })

  it('disposes the store when the injector tears down', async () => {
    const injector = createInjector()
    injector.bind(BlobStore, defineS3BlobStore({ client: {} as S3Client, bucket: 'tests' }))
    const store = injector.get(BlobStore)
    await injector[Symbol.asyncDispose]()
    await expect(store.head('any')).rejects.toMatchObject({ code: 'io-error' })
  })
})
