import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { BlobStore } from '@furystack/blob-store'
import { createInjector } from '@furystack/inject'
import { defineFileSystemBlobStore } from './define-filesystem-blob-store.js'
import { FileSystemBlobStore } from './filesystem-blob-store.js'
import { MIN_SECRET_LENGTH } from './sign-token.js'

const SECRET = 'a'.repeat(MIN_SECRET_LENGTH)

describe('defineFileSystemBlobStore', () => {
  let root: string

  beforeEach(async () => {
    root = await mkdtemp(join(tmpdir(), 'furystack-fs-blob-define-'))
  })

  afterEach(async () => {
    await rm(root, { recursive: true, force: true })
  })

  it('binds a FileSystemBlobStore on the BlobStore token', async () => {
    await using injector = createInjector()
    injector.bind(BlobStore, defineFileSystemBlobStore({ root, secret: SECRET, name: 'bound' }))
    const store = injector.get(BlobStore)
    expect(store).toBeInstanceOf(FileSystemBlobStore)
    expect(store.storeName).toBe('bound')
  })

  it('disposes the store when the injector tears down', async () => {
    const injector = createInjector()
    injector.bind(BlobStore, defineFileSystemBlobStore({ root, secret: SECRET }))
    const store = injector.get(BlobStore)
    await injector[Symbol.asyncDispose]()
    await expect(store.put('after', Buffer.from('x'))).rejects.toMatchObject({ code: 'io-error' })
  })
})
