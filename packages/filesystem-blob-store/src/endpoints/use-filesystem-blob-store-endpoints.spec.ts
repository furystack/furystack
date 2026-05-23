import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { createInjector } from '@furystack/inject'
import { FileSystemBlobStore } from '../filesystem-blob-store.js'
import { MIN_SECRET_LENGTH } from '../sign-token.js'
import { useFileSystemBlobStoreEndpoints } from './use-filesystem-blob-store-endpoints.js'

const SECRET = 'a'.repeat(MIN_SECRET_LENGTH)

const findFreePort = async (): Promise<number> => {
  const { createServer } = await import('node:net')
  return new Promise<number>((resolve, reject) => {
    const server = createServer()
    server.unref()
    server.on('error', reject)
    server.listen(0, () => {
      const address = server.address()
      if (typeof address === 'object' && address) {
        const { port } = address
        server.close(() => resolve(port))
        return
      }
      reject(new Error('Failed to acquire a free port'))
    })
  })
}

describe('useFileSystemBlobStoreEndpoints', () => {
  let root: string
  let port: number

  beforeEach(async () => {
    root = await mkdtemp(join(tmpdir(), 'furystack-fs-blob-use-endpoints-'))
    port = await findFreePort()
  })

  afterEach(async () => {
    await rm(root, { recursive: true, force: true })
  })

  it('mounts upload + download endpoints on a pooled HTTP server', async () => {
    const injector = createInjector()
    try {
      using store = new FileSystemBlobStore({
        root,
        secret: SECRET,
        publicUrlBase: `http://127.0.0.1:${port}/blobs`,
      })
      await useFileSystemBlobStoreEndpoints({
        injector,
        port,
        baseUrl: '/blobs',
        root,
        secret: SECRET,
      })

      const upload = await store.getUploadUrl('hello.txt', { ttlSec: 60, maxBytes: 64 })
      const putResponse = await fetch(upload.url, { method: 'PUT', body: 'mounted' })
      expect(putResponse.status).toBe(204)

      const download = await store.getDownloadUrl('hello.txt', { ttlSec: 60 })
      const getResponse = await fetch(download)
      expect(getResponse.status).toBe(200)
      expect(await getResponse.text()).toBe('mounted')
    } finally {
      await injector[Symbol.asyncDispose]()
    }
  })
})
