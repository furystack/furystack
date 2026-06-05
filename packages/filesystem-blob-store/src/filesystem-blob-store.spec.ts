import { mkdtemp, readFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { BlobStoreError } from '@furystack/blob-store'
import { FileSystemBlobStore } from './filesystem-blob-store.js'
import { MIN_SECRET_LENGTH, verifyToken } from './sign-token.js'

const SECRET = 'a'.repeat(MIN_SECRET_LENGTH)

const decode = (data: Uint8Array): string => new TextDecoder().decode(data)

const collect = async (stream: ReadableStream<Uint8Array>): Promise<Uint8Array> => {
  const reader = stream.getReader()
  const chunks: Uint8Array[] = []
  for (;;) {
    const { done, value } = await reader.read()
    if (done) break
    chunks.push(value)
  }
  reader.releaseLock()
  const total = chunks.reduce((acc, c) => acc + c.byteLength, 0)
  const merged = new Uint8Array(total)
  let offset = 0
  for (const chunk of chunks) {
    merged.set(chunk, offset)
    offset += chunk.byteLength
  }
  return merged
}

describe('FileSystemBlobStore', () => {
  let root: string

  beforeEach(async () => {
    root = await mkdtemp(join(tmpdir(), 'furystack-fs-blob-'))
  })

  afterEach(async () => {
    await rm(root, { recursive: true, force: true })
  })

  describe('constructor', () => {
    it('throws on missing root', () => {
      expect(() => new FileSystemBlobStore({ root: '', secret: SECRET })).toThrow(/non-empty `root`/)
    })

    it('throws on missing secret', () => {
      expect(() => new FileSystemBlobStore({ root, secret: '' })).toThrow(/at least \d+ characters/)
    })

    it('throws when secret is shorter than MIN_SECRET_LENGTH', () => {
      expect(() => new FileSystemBlobStore({ root, secret: 'short' })).toThrow(/at least \d+ characters/)
    })

    it('accepts Uint8Array secrets meeting the length requirement', () => {
      expect(() => new FileSystemBlobStore({ root, secret: new Uint8Array(MIN_SECRET_LENGTH) })).not.toThrow()
    })

    it('defaults storeName to "filesystem"', () => {
      using store = new FileSystemBlobStore({ root, secret: SECRET })
      expect(store.storeName).toBe('filesystem')
    })

    it('honours a custom storeName', () => {
      using store = new FileSystemBlobStore({ root, secret: SECRET, name: 'tenant-a' })
      expect(store.storeName).toBe('tenant-a')
    })
  })

  describe('put / get', () => {
    it('writes a buffer payload and reads it back', async () => {
      using store = new FileSystemBlobStore({ root, secret: SECRET })
      const ref = await store.put('greeting.txt', Buffer.from('hello'), { contentType: 'text/plain' })
      expect(ref.contentLength).toBe(5)
      expect(ref.contentType).toBe('text/plain')
      expect(ref.storeName).toBe('filesystem')
      const result = await store.get('greeting.txt')
      expect(result.contentLength).toBe(5)
      expect(result.contentType).toBe('text/plain')
      expect(decode(await collect(result.stream))).toBe('hello')
    })

    it('writes a Web ReadableStream payload', async () => {
      using store = new FileSystemBlobStore({ root, secret: SECRET })
      const stream = new ReadableStream<Uint8Array>({
        start(controller) {
          controller.enqueue(new TextEncoder().encode('part-'))
          controller.enqueue(new TextEncoder().encode('two'))
          controller.close()
        },
      })
      const ref = await store.put('streamed', stream)
      expect(ref.contentLength).toBe(8)
    })

    it('persists a sidecar metadata file with customMetadata', async () => {
      using store = new FileSystemBlobStore({ root, secret: SECRET })
      await store.put('with-meta', Buffer.from('x'), { contentType: 'application/json', metadata: { tenant: 't1' } })
      const sidecar = JSON.parse(await readFile(join(root, 'with-meta.meta.json'), 'utf8')) as Record<string, unknown>
      expect(sidecar.contentType).toBe('application/json')
      expect(sidecar.customMetadata).toEqual({ tenant: 't1' })
    })

    it('rejects mismatched declared contentLength and removes the temp file', async () => {
      using store = new FileSystemBlobStore({ root, secret: SECRET })
      await expect(store.put('mismatch', Buffer.from('hi'), { contentLength: 99 })).rejects.toMatchObject({
        code: 'invalid-config',
      })
      await expect(store.get('mismatch')).rejects.toMatchObject({ code: 'not-found' })
    })

    it('rejects keys with traversal segments', async () => {
      using store = new FileSystemBlobStore({ root, secret: SECRET })
      await expect(store.put('../oops', Buffer.from('x'))).rejects.toMatchObject({ code: 'invalid-key' })
      await expect(store.put('a/./b', Buffer.from('x'))).rejects.toMatchObject({ code: 'invalid-key' })
      await expect(store.put('a\\b', Buffer.from('x'))).rejects.toMatchObject({ code: 'invalid-key' })
    })

    it('throws not-found on get for missing keys', async () => {
      using store = new FileSystemBlobStore({ root, secret: SECRET })
      await expect(store.get('missing')).rejects.toMatchObject({ code: 'not-found' })
    })
  })

  describe('head', () => {
    it('returns metadata for an existing key', async () => {
      using store = new FileSystemBlobStore({ root, secret: SECRET })
      await store.put('h', Buffer.from('payload'), { contentType: 'text/plain', metadata: { who: 'me' } })
      const meta = await store.head('h')
      expect(meta?.contentLength).toBe(7)
      expect(meta?.contentType).toBe('text/plain')
      expect(meta?.customMetadata).toEqual({ who: 'me' })
      expect(meta?.lastModified).toBeInstanceOf(Date)
    })

    it('returns undefined for missing keys', async () => {
      using store = new FileSystemBlobStore({ root, secret: SECRET })
      expect(await store.head('missing')).toBeUndefined()
    })

    it('returns metadata even when the sidecar is absent', async () => {
      using store = new FileSystemBlobStore({ root, secret: SECRET })
      await store.put('no-sidecar', Buffer.from('x'))
      await rm(join(root, 'no-sidecar.meta.json'), { force: true })
      const meta = await store.head('no-sidecar')
      expect(meta?.contentLength).toBe(1)
      expect(meta?.contentType).toBeUndefined()
    })
  })

  describe('delete', () => {
    it('removes the payload and the sidecar', async () => {
      using store = new FileSystemBlobStore({ root, secret: SECRET })
      await store.put('rm', Buffer.from('x'))
      await store.delete('rm')
      expect(await store.head('rm')).toBeUndefined()
    })

    it('is idempotent', async () => {
      using store = new FileSystemBlobStore({ root, secret: SECRET })
      await expect(store.delete('never-existed')).resolves.toBeUndefined()
    })
  })

  describe('list', () => {
    it('lists matching keys lexicographically', async () => {
      using store = new FileSystemBlobStore({ root, secret: SECRET })
      await store.put('a/2', Buffer.from('1'))
      await store.put('a/1', Buffer.from('1'))
      await store.put('b/1', Buffer.from('1'))
      const result = await store.list('a/')
      expect(result.items.map((i) => i.key)).toEqual(['a/1', 'a/2'])
    })

    it('paginates with a cursor', async () => {
      using store = new FileSystemBlobStore({ root, secret: SECRET })
      for (let i = 0; i < 5; i++) {
        await store.put(`p/${String(i).padStart(2, '0')}`, Buffer.from('x'))
      }
      const first = await store.list('p/', { limit: 2 })
      expect(first.items.map((i) => i.key)).toEqual(['p/00', 'p/01'])
      expect(first.nextCursor).toBe('p/02')
      const second = await store.list('p/', { limit: 2, cursor: first.nextCursor })
      expect(second.items.map((i) => i.key)).toEqual(['p/02', 'p/03'])
    })

    it('returns an empty list when the root directory is missing', async () => {
      using store = new FileSystemBlobStore({ root: join(root, 'never-created'), secret: SECRET })
      const result = await store.list('')
      expect(result.items).toEqual([])
    })

    it('rejects invalid cursors', async () => {
      using store = new FileSystemBlobStore({ root, secret: SECRET })
      await store.put('a', Buffer.from('x'))
      await expect(store.list('', { cursor: 'never' })).rejects.toMatchObject({ code: 'invalid-config' })
    })

    it('rejects non-string prefix', async () => {
      using store = new FileSystemBlobStore({ root, secret: SECRET })
      await expect(store.list(42 as unknown as string)).rejects.toMatchObject({ code: 'invalid-config' })
    })

    it('rejects non-positive limit', async () => {
      using store = new FileSystemBlobStore({ root, secret: SECRET })
      await expect(store.list('p', { limit: 0 })).rejects.toMatchObject({ code: 'invalid-config' })
    })
  })

  describe('signed URLs', () => {
    it('mints a download URL containing a valid token', async () => {
      using store = new FileSystemBlobStore({
        root,
        secret: SECRET,
        publicUrlBase: 'https://api.example.com/blobs',
        now: () => 1_000_000,
      })
      const url = await store.getDownloadUrl('a/b', { ttlSec: 60 })
      const token = decodeURIComponent(url.split('/').pop() ?? '')
      const payload = verifyToken(token, SECRET, () => 1_000_000)
      expect(payload.k).toBe('a/b')
      expect(payload.o).toBe('download')
      expect(payload.e).toBe(1060)
    })

    it('mints an upload URL with method PUT and embedded constraints', async () => {
      using store = new FileSystemBlobStore({
        root,
        secret: SECRET,
        publicUrlBase: 'https://api.example.com/blobs/',
        now: () => 1_000_000,
      })
      const result = await store.getUploadUrl('upload/key', { ttlSec: 30, contentType: 'image/png', maxBytes: 1024 })
      expect(result.method).toBe('PUT')
      const token = decodeURIComponent(result.url.split('/').pop() ?? '')
      const payload = verifyToken(token, SECRET, () => 1_000_000)
      expect(payload.c).toBe('image/png')
      expect(payload.m).toBe(1024)
    })

    it('rejects URL minting without publicUrlBase', async () => {
      using store = new FileSystemBlobStore({ root, secret: SECRET })
      await expect(store.getDownloadUrl('a', { ttlSec: 60 })).rejects.toMatchObject({ code: 'invalid-config' })
      await expect(store.getUploadUrl('a', { ttlSec: 60 })).rejects.toMatchObject({ code: 'invalid-config' })
    })

    it('rejects URL minting for invalid keys', async () => {
      using store = new FileSystemBlobStore({
        root,
        secret: SECRET,
        publicUrlBase: 'https://example.com/blobs',
      })
      await expect(store.getDownloadUrl('../oops', { ttlSec: 60 })).rejects.toMatchObject({ code: 'invalid-key' })
      await expect(store.getUploadUrl('../oops', { ttlSec: 60 })).rejects.toMatchObject({ code: 'invalid-key' })
    })
  })

  describe('disposal', () => {
    it('rejects subsequent calls', async () => {
      const store = new FileSystemBlobStore({ root, secret: SECRET })
      store[Symbol.dispose]()
      await expect(store.put('after', Buffer.from('x'))).rejects.toMatchObject({ code: 'io-error' })
      await expect(store.get('any')).rejects.toMatchObject({ code: 'io-error' })
      await expect(store.head('any')).rejects.toMatchObject({ code: 'io-error' })
      await expect(store.delete('any')).rejects.toMatchObject({ code: 'io-error' })
      await expect(store.list('')).rejects.toMatchObject({ code: 'io-error' })
    })
  })

  describe('error wrapping', () => {
    it('wraps unexpected get/head errors as io-error (symlink loop)', async () => {
      using store = new FileSystemBlobStore({ root, secret: SECRET })
      const { symlink } = await import('node:fs/promises')
      await symlink('loop', join(root, 'loop'))
      try {
        await store.get('loop')
        throw new Error('should have thrown')
      } catch (error) {
        expect(BlobStoreError.is(error)).toBe(true)
        expect((error as BlobStoreError).code).toBe('io-error')
      }
      try {
        await store.head('loop')
        throw new Error('should have thrown')
      } catch (error) {
        expect(BlobStoreError.is(error)).toBe(true)
        expect((error as BlobStoreError).code).toBe('io-error')
      }
    })

    it('wraps unexpected sidecar-write errors as io-error', async () => {
      using store = new FileSystemBlobStore({ root, secret: SECRET })
      const { mkdir } = await import('node:fs/promises')
      // Pre-create the sidecar path as a directory so writeFile fails with EISDIR.
      await mkdir(join(root, 'pre.meta.json'))
      await expect(store.put('pre', Buffer.from('x'))).rejects.toMatchObject({ code: 'io-error' })
    })

    it('wraps unexpected readdir errors as io-error', async () => {
      const filePath = join(root, 'not-a-dir')
      const { writeFile, mkdir } = await import('node:fs/promises')
      await writeFile(filePath, 'x')
      using store = new FileSystemBlobStore({ root: filePath, secret: SECRET })
      try {
        await store.list('')
        throw new Error('should have thrown')
      } catch (error) {
        expect(BlobStoreError.is(error)).toBe(true)
        expect((error as BlobStoreError).code).toBe('io-error')
      }
      await mkdir(filePath, { recursive: true }).catch(() => undefined)
    })

    it('wraps unexpected sidecar-read errors as io-error', async () => {
      using store = new FileSystemBlobStore({ root, secret: SECRET })
      await store.put('side', Buffer.from('x'))
      const sidecar = join(root, 'side.meta.json')
      await rm(sidecar, { force: true })
      const { mkdir } = await import('node:fs/promises')
      await mkdir(sidecar)
      try {
        await store.head('side')
        throw new Error('should have thrown')
      } catch (error) {
        expect(BlobStoreError.is(error)).toBe(true)
        expect((error as BlobStoreError).code).toBe('io-error')
      }
    })
  })

  describe('toNodeReadable variants', () => {
    it('accepts a Node Readable input', async () => {
      using store = new FileSystemBlobStore({ root, secret: SECRET })
      const { Readable } = await import('node:stream')
      const ref = await store.put('node-input', Readable.from([Buffer.from('node-')], { objectMode: false }))
      expect(ref.contentLength).toBeGreaterThan(0)
      const result = await store.get('node-input')
      expect(decode(await collect(result.stream))).toBe('node-')
    })

    it('propagates errors from a failing Web ReadableStream', async () => {
      using store = new FileSystemBlobStore({ root, secret: SECRET })
      const failing = new ReadableStream<Uint8Array>({
        pull(controller) {
          controller.error(new Error('reader-broken'))
        },
      })
      await expect(store.put('failing', failing)).rejects.toMatchObject({ code: 'io-error' })
    })
  })
})
