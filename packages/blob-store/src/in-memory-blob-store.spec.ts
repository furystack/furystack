import { Readable } from 'node:stream'
import { describe, expect, it } from 'vitest'
import { BlobStoreError } from './blob-store-error.js'
import { InMemoryBlobStore } from './in-memory-blob-store.js'

const readAsString = async (stream: ReadableStream<Uint8Array>): Promise<string> => {
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
  return new TextDecoder().decode(merged)
}

describe('InMemoryBlobStore', () => {
  it('defaults storeName to "in-memory"', () => {
    using store = new InMemoryBlobStore()
    expect(store.storeName).toBe('in-memory')
  })

  it('accepts a custom storeName', () => {
    using store = new InMemoryBlobStore({ name: 'custom' })
    expect(store.storeName).toBe('custom')
  })

  it('declares pessimistic capabilities', () => {
    using store = new InMemoryBlobStore()
    expect(store.capabilities).toEqual({
      presignedUrls: false,
      multipart: false,
      range: false,
      crossNodeAccessible: false,
      maxObjectBytes: Number.POSITIVE_INFINITY,
    })
  })

  describe('put', () => {
    it('stores a Buffer payload and returns a BlobRef', async () => {
      using store = new InMemoryBlobStore({ name: 'tests' })
      const ref = await store.put('a.txt', Buffer.from('hello'), { contentType: 'text/plain' })
      expect(ref.storeName).toBe('tests')
      expect(ref.key).toBe('a.txt')
      expect(ref.contentType).toBe('text/plain')
      expect(ref.contentLength).toBe(5)
      expect(ref.etag).toMatch(/^[0-9a-f]{64}$/)
    })

    it('stores a Uint8Array payload', async () => {
      using store = new InMemoryBlobStore()
      const data = new Uint8Array([1, 2, 3])
      const ref = await store.put('uint8', data)
      expect(ref.contentLength).toBe(3)
    })

    it('stores a Web ReadableStream payload', async () => {
      using store = new InMemoryBlobStore()
      const stream = new ReadableStream<Uint8Array>({
        start(controller) {
          controller.enqueue(new TextEncoder().encode('chunk-1'))
          controller.enqueue(new TextEncoder().encode('chunk-2'))
          controller.close()
        },
      })
      const ref = await store.put('streamed', stream)
      expect(ref.contentLength).toBe('chunk-1chunk-2'.length)
    })

    it('stores a Node Readable payload', async () => {
      using store = new InMemoryBlobStore()
      const ref = await store.put('node-stream', Readable.from(['hello', '-', 'node']))
      const { stream } = await store.get('node-stream')
      expect(await readAsString(stream)).toBe('hello-node')
      expect(ref.contentLength).toBe(10)
    })

    it('rejects payloads whose declared contentLength does not match', async () => {
      using store = new InMemoryBlobStore()
      try {
        await store.put('mismatch', Buffer.from('hi'), { contentLength: 99 })
        throw new Error('should have thrown')
      } catch (error) {
        expect(BlobStoreError.is(error)).toBe(true)
        expect((error as BlobStoreError).code).toBe('invalid-config')
      }
    })

    it('rejects invalid keys', async () => {
      using store = new InMemoryBlobStore()
      await expect(store.put('', Buffer.from('x'))).rejects.toThrow(BlobStoreError)
    })

    it('preserves customMetadata snapshot', async () => {
      using store = new InMemoryBlobStore()
      const meta: Record<string, string> = { owner: 'alice' }
      await store.put('with-meta', Buffer.from('x'), { metadata: meta })
      meta.owner = 'bob'
      const head = await store.head('with-meta')
      expect(head?.customMetadata).toEqual({ owner: 'alice' })
    })
  })

  describe('get', () => {
    it('returns a stream + metadata for an existing key', async () => {
      using store = new InMemoryBlobStore()
      await store.put('greeting', Buffer.from('hello'), { contentType: 'text/plain' })
      const result = await store.get('greeting')
      expect(result.contentType).toBe('text/plain')
      expect(result.contentLength).toBe(5)
      expect(await readAsString(result.stream)).toBe('hello')
    })

    it('throws not-found for a missing key', async () => {
      using store = new InMemoryBlobStore()
      await expect(store.get('nope')).rejects.toMatchObject({ code: 'not-found' })
    })

    it('returns independent stream copies on repeated reads', async () => {
      using store = new InMemoryBlobStore()
      await store.put('shared', Buffer.from('hi'))
      const a = await store.get('shared')
      const b = await store.get('shared')
      expect(await readAsString(a.stream)).toBe('hi')
      expect(await readAsString(b.stream)).toBe('hi')
    })
  })

  describe('head', () => {
    it('returns metadata for an existing key', async () => {
      using store = new InMemoryBlobStore()
      await store.put('h', Buffer.from('payload'))
      const meta = await store.head('h')
      expect(meta?.contentLength).toBe(7)
      expect(meta?.lastModified).toBeInstanceOf(Date)
    })

    it('returns undefined for a missing key', async () => {
      using store = new InMemoryBlobStore()
      expect(await store.head('missing')).toBeUndefined()
    })

    it('still validates the key', async () => {
      using store = new InMemoryBlobStore()
      await expect(store.head('')).rejects.toThrow(BlobStoreError)
    })
  })

  describe('delete', () => {
    it('removes an existing key', async () => {
      using store = new InMemoryBlobStore()
      await store.put('rm', Buffer.from('x'))
      await store.delete('rm')
      expect(await store.head('rm')).toBeUndefined()
    })

    it('is idempotent for missing keys', async () => {
      using store = new InMemoryBlobStore()
      await expect(store.delete('never-existed')).resolves.toBeUndefined()
    })
  })

  describe('list', () => {
    it('returns matching keys sorted lexicographically', async () => {
      using store = new InMemoryBlobStore()
      await store.put('a/2', Buffer.from('1'))
      await store.put('a/1', Buffer.from('1'))
      await store.put('b/1', Buffer.from('1'))
      const result = await store.list('a/')
      expect(result.items.map((i) => i.key)).toEqual(['a/1', 'a/2'])
      expect(result.nextCursor).toBeUndefined()
    })

    it('paginates with an opaque cursor', async () => {
      using store = new InMemoryBlobStore()
      for (let i = 0; i < 5; i++) {
        await store.put(`page/${String(i).padStart(2, '0')}`, Buffer.from('x'))
      }
      const first = await store.list('page/', { limit: 2 })
      expect(first.items.map((i) => i.key)).toEqual(['page/00', 'page/01'])
      expect(first.nextCursor).toBe('page/02')
      const second = await store.list('page/', { limit: 2, cursor: first.nextCursor })
      expect(second.items.map((i) => i.key)).toEqual(['page/02', 'page/03'])
      expect(second.nextCursor).toBe('page/04')
      const third = await store.list('page/', { limit: 2, cursor: second.nextCursor })
      expect(third.items.map((i) => i.key)).toEqual(['page/04'])
      expect(third.nextCursor).toBeUndefined()
    })

    it('rejects non-string prefix', async () => {
      using store = new InMemoryBlobStore()
      await expect(store.list(42 as unknown as string)).rejects.toMatchObject({ code: 'invalid-config' })
    })

    it('rejects non-positive limit', async () => {
      using store = new InMemoryBlobStore()
      await expect(store.list('p', { limit: 0 })).rejects.toMatchObject({ code: 'invalid-config' })
      await expect(store.list('p', { limit: -1 })).rejects.toMatchObject({ code: 'invalid-config' })
      await expect(store.list('p', { limit: 1.5 })).rejects.toMatchObject({ code: 'invalid-config' })
    })

    it('rejects an unknown cursor', async () => {
      using store = new InMemoryBlobStore()
      await store.put('a', Buffer.from('x'))
      await expect(store.list('', { cursor: 'never' })).rejects.toMatchObject({ code: 'invalid-config' })
    })
  })

  describe('presigned-URL methods', () => {
    it('throws capability-missing on getDownloadUrl', async () => {
      using store = new InMemoryBlobStore()
      await expect(store.getDownloadUrl('a', { ttlSec: 60 })).rejects.toMatchObject({
        code: 'capability-missing',
      })
    })

    it('throws capability-missing on getUploadUrl', async () => {
      using store = new InMemoryBlobStore()
      await expect(store.getUploadUrl('a', { ttlSec: 60 })).rejects.toMatchObject({
        code: 'capability-missing',
      })
    })
  })

  describe('disposal', () => {
    it('clears all blobs and rejects subsequent calls', async () => {
      const store = new InMemoryBlobStore()
      await store.put('keep-me', Buffer.from('x'))
      store[Symbol.dispose]()
      await expect(store.put('after', Buffer.from('y'))).rejects.toMatchObject({ code: 'io-error' })
      await expect(store.get('keep-me')).rejects.toMatchObject({ code: 'io-error' })
    })

    it('is idempotent', () => {
      const store = new InMemoryBlobStore()
      store[Symbol.dispose]()
      expect(() => store[Symbol.dispose]()).not.toThrow()
    })
  })
})
