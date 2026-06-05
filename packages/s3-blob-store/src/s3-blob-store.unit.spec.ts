import { Readable } from 'node:stream'
import {
  DeleteObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  ListObjectsV2Command,
  PutBucketLifecycleConfigurationCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3'
import { describe, expect, it, vi } from 'vitest'
import { BlobStoreError } from '@furystack/blob-store'
import { S3BlobStore } from './s3-blob-store.js'

type CommandMatcher = (input: object) => unknown

class FakeS3Client {
  public readonly sent: Array<{ name: string; input: object }> = []
  public lifecycleAttempts = 0

  constructor(private readonly handlers: Record<string, CommandMatcher>) {}

  public send = vi.fn(async (command: { constructor: { name: string }; input: object }) => {
    this.sent.push({ name: command.constructor.name, input: command.input })
    if (command.constructor.name === 'PutBucketLifecycleConfigurationCommand') {
      this.lifecycleAttempts += 1
    }
    const handler = this.handlers[command.constructor.name]
    if (!handler) {
      throw new Error(`No handler for ${command.constructor.name}`)
    }
    return handler(command.input)
  })
}

const asClient = (fake: FakeS3Client): S3Client => fake as unknown as S3Client

const makeNoSuchKey = (): Error => {
  const err = new Error('NoSuchKey') as Error & { name: string; $metadata: { httpStatusCode: number } }
  err.name = 'NoSuchKey'
  err.$metadata = { httpStatusCode: 404 }
  return err
}

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

describe('S3BlobStore', () => {
  describe('constructor', () => {
    it('throws on missing bucket', () => {
      expect(() => new S3BlobStore({ client: {} as S3Client, bucket: '' })).toThrow(/non-empty `bucket`/)
    })

    it('defaults storeName to "s3"', () => {
      using store = new S3BlobStore({ client: {} as S3Client, bucket: 'b' })
      expect(store.storeName).toBe('s3')
    })

    it('honours a custom storeName', () => {
      using store = new S3BlobStore({ client: {} as S3Client, bucket: 'b', name: 'tenant-a' })
      expect(store.storeName).toBe('tenant-a')
    })

    it('declares S3-shaped capabilities', () => {
      using store = new S3BlobStore({ client: {} as S3Client, bucket: 'b' })
      expect(store.capabilities).toMatchObject({
        presignedUrls: true,
        multipart: false,
        range: true,
        crossNodeAccessible: true,
      })
    })
  })

  describe('put', () => {
    it('runs an Upload + writes lifecycle on first put', async () => {
      const fake = new FakeS3Client({
        PutBucketLifecycleConfigurationCommand: () => ({}),
        PutObjectCommand: () => ({ ETag: '"abc"' }),
        HeadObjectCommand: () => ({ ContentLength: 5 }),
      })
      using store = new S3BlobStore({ client: asClient(fake), bucket: 'b' })
      const ref = await store.put('hello', Buffer.from('hello'), { contentType: 'text/plain' })
      expect(ref.etag).toBe('abc')
      expect(ref.contentLength).toBe(5)
      expect(fake.lifecycleAttempts).toBe(1)
    })

    it('only attempts lifecycle once', async () => {
      const fake = new FakeS3Client({
        PutBucketLifecycleConfigurationCommand: () => ({}),
        PutObjectCommand: () => ({ ETag: '"x"' }),
        HeadObjectCommand: () => ({ ContentLength: 1 }),
      })
      using store = new S3BlobStore({ client: asClient(fake), bucket: 'b' })
      await store.put('a', Buffer.from('x'))
      await store.put('b', Buffer.from('x'))
      expect(fake.lifecycleAttempts).toBe(1)
    })

    it('skips lifecycle entirely when manageLifecycle: false', async () => {
      const fake = new FakeS3Client({
        PutObjectCommand: () => ({ ETag: '"x"' }),
        HeadObjectCommand: () => ({ ContentLength: 1 }),
      })
      using store = new S3BlobStore({ client: asClient(fake), bucket: 'b', manageLifecycle: false })
      await store.put('a', Buffer.from('x'))
      expect(fake.lifecycleAttempts).toBe(0)
    })

    it('reports lifecycle errors via onLifecycleError', async () => {
      const onLifecycleError = vi.fn()
      const fake = new FakeS3Client({
        PutBucketLifecycleConfigurationCommand: () => {
          throw new Error('AccessDenied')
        },
        PutObjectCommand: () => ({ ETag: '"x"' }),
        HeadObjectCommand: () => ({ ContentLength: 1 }),
      })
      using store = new S3BlobStore({ client: asClient(fake), bucket: 'b', onLifecycleError })
      await store.put('a', Buffer.from('x'))
      expect(onLifecycleError).toHaveBeenCalledOnce()
    })

    it('wraps S3 upload failures as io-error', async () => {
      const fake = new FakeS3Client({
        PutBucketLifecycleConfigurationCommand: () => ({}),
        PutObjectCommand: () => {
          throw new Error('s3 down')
        },
      })
      using store = new S3BlobStore({ client: asClient(fake), bucket: 'b' })
      await expect(store.put('k', Buffer.from('x'))).rejects.toMatchObject({ code: 'io-error' })
    })

    it('prepends keyPrefix on the wire and strips it on responses', async () => {
      const fake = new FakeS3Client({
        PutBucketLifecycleConfigurationCommand: () => ({}),
        PutObjectCommand: () => ({ ETag: '"x"' }),
        HeadObjectCommand: () => ({ ContentLength: 3 }),
      })
      using store = new S3BlobStore({ client: asClient(fake), bucket: 'b', keyPrefix: 'tenant-a/' })
      const ref = await store.put('docs/file', Buffer.from('xyz'))
      expect(ref.key).toBe('docs/file')
      const sentPut = fake.sent.find((s) => s.name === 'PutObjectCommand')
      expect((sentPut?.input as { Key: string }).Key).toBe('tenant-a/docs/file')
    })

    it('forwards content type, length and metadata to the Upload', async () => {
      const fake = new FakeS3Client({
        PutBucketLifecycleConfigurationCommand: () => ({}),
        PutObjectCommand: (input) => {
          expect(input).toMatchObject({
            ContentType: 'application/json',
            ContentLength: 4,
            Metadata: { tenant: 't1' },
          })
          return { ETag: '"x"' }
        },
      })
      using store = new S3BlobStore({ client: asClient(fake), bucket: 'b' })
      const ref = await store.put('k', Buffer.from('abcd'), {
        contentType: 'application/json',
        contentLength: 4,
        metadata: { tenant: 't1' },
      })
      expect(ref.contentLength).toBe(4)
    })

    it('tolerates HEAD failure when contentLength is unknown', async () => {
      const fake = new FakeS3Client({
        PutBucketLifecycleConfigurationCommand: () => ({}),
        PutObjectCommand: () => ({ ETag: '"x"' }),
        HeadObjectCommand: () => {
          throw new Error('AccessDenied')
        },
      })
      using store = new S3BlobStore({ client: asClient(fake), bucket: 'b' })
      const ref = await store.put('k', Buffer.from('x'))
      expect(ref.contentLength).toBeUndefined()
    })
  })

  describe('get', () => {
    it('returns a stream + headers', async () => {
      const fake = new FakeS3Client({
        GetObjectCommand: () => ({
          Body: Readable.from([Buffer.from('payload')]),
          ContentType: 'text/plain',
          ContentLength: 7,
          ETag: '"deadbeef"',
        }),
      })
      using store = new S3BlobStore({ client: asClient(fake), bucket: 'b', manageLifecycle: false })
      const result = await store.get('k')
      expect(result.contentType).toBe('text/plain')
      expect(result.etag).toBe('deadbeef')
      expect(decode(await collect(result.stream))).toBe('payload')
    })

    it('handles a Web ReadableStream body', async () => {
      const fake = new FakeS3Client({
        GetObjectCommand: () => ({
          Body: new ReadableStream<Uint8Array>({
            start(c) {
              c.enqueue(new TextEncoder().encode('web'))
              c.close()
            },
          }),
          ContentLength: 3,
        }),
      })
      using store = new S3BlobStore({ client: asClient(fake), bucket: 'b', manageLifecycle: false })
      const result = await store.get('k')
      expect(decode(await collect(result.stream))).toBe('web')
    })

    it('throws not-found when the underlying error is NoSuchKey', async () => {
      const fake = new FakeS3Client({
        GetObjectCommand: () => {
          throw makeNoSuchKey()
        },
      })
      using store = new S3BlobStore({ client: asClient(fake), bucket: 'b', manageLifecycle: false })
      await expect(store.get('k')).rejects.toMatchObject({ code: 'not-found' })
    })

    it('wraps generic errors as io-error', async () => {
      const fake = new FakeS3Client({
        GetObjectCommand: () => {
          throw new Error('TLS handshake')
        },
      })
      using store = new S3BlobStore({ client: asClient(fake), bucket: 'b', manageLifecycle: false })
      await expect(store.get('k')).rejects.toMatchObject({ code: 'io-error' })
    })

    it('throws io-error when S3 returns no body', async () => {
      const fake = new FakeS3Client({
        GetObjectCommand: () => ({ Body: undefined }),
      })
      using store = new S3BlobStore({ client: asClient(fake), bucket: 'b', manageLifecycle: false })
      await expect(store.get('k')).rejects.toMatchObject({ code: 'io-error' })
    })
  })

  describe('head', () => {
    it('returns metadata', async () => {
      const fake = new FakeS3Client({
        HeadObjectCommand: () => ({
          ContentType: 'text/plain',
          ContentLength: 5,
          ETag: '"v1"',
          LastModified: new Date('2026-01-01T00:00:00Z'),
          Metadata: { tenant: 't1' },
        }),
      })
      using store = new S3BlobStore({ client: asClient(fake), bucket: 'b', manageLifecycle: false })
      const meta = await store.head('k')
      expect(meta?.contentLength).toBe(5)
      expect(meta?.etag).toBe('v1')
      expect(meta?.customMetadata).toEqual({ tenant: 't1' })
    })

    it('returns undefined on NoSuchKey', async () => {
      const fake = new FakeS3Client({
        HeadObjectCommand: () => {
          throw makeNoSuchKey()
        },
      })
      using store = new S3BlobStore({ client: asClient(fake), bucket: 'b', manageLifecycle: false })
      expect(await store.head('k')).toBeUndefined()
    })

    it('wraps unexpected errors as io-error', async () => {
      const fake = new FakeS3Client({
        HeadObjectCommand: () => {
          throw new Error('throttled')
        },
      })
      using store = new S3BlobStore({ client: asClient(fake), bucket: 'b', manageLifecycle: false })
      await expect(store.head('k')).rejects.toMatchObject({ code: 'io-error' })
    })
  })

  describe('delete', () => {
    it('issues DeleteObjectCommand', async () => {
      const fake = new FakeS3Client({
        DeleteObjectCommand: () => ({}),
      })
      using store = new S3BlobStore({ client: asClient(fake), bucket: 'b', manageLifecycle: false })
      await store.delete('k')
      expect(fake.sent.find((s) => s.name === 'DeleteObjectCommand')).toBeDefined()
    })

    it('is idempotent on NoSuchKey', async () => {
      const fake = new FakeS3Client({
        DeleteObjectCommand: () => {
          throw makeNoSuchKey()
        },
      })
      using store = new S3BlobStore({ client: asClient(fake), bucket: 'b', manageLifecycle: false })
      await expect(store.delete('k')).resolves.toBeUndefined()
    })

    it('wraps unexpected errors as io-error', async () => {
      const fake = new FakeS3Client({
        DeleteObjectCommand: () => {
          throw new Error('AccessDenied')
        },
      })
      using store = new S3BlobStore({ client: asClient(fake), bucket: 'b', manageLifecycle: false })
      await expect(store.delete('k')).rejects.toMatchObject({ code: 'io-error' })
    })
  })

  describe('list', () => {
    it('returns items + nextCursor', async () => {
      const fake = new FakeS3Client({
        ListObjectsV2Command: () => ({
          Contents: [
            { Key: 'p/a', Size: 1, ETag: '"e1"', LastModified: new Date(0) },
            { Key: 'p/b', Size: 2 },
          ],
          NextContinuationToken: 'next-page',
        }),
      })
      using store = new S3BlobStore({ client: asClient(fake), bucket: 'b', manageLifecycle: false })
      const result = await store.list('p/')
      expect(result.items.map((i) => i.key)).toEqual(['p/a', 'p/b'])
      expect(result.nextCursor).toBe('next-page')
    })

    it('strips keyPrefix on returned keys', async () => {
      const fake = new FakeS3Client({
        ListObjectsV2Command: () => ({
          Contents: [{ Key: 'tenant-a/p/a', Size: 1 }],
        }),
      })
      using store = new S3BlobStore({
        client: asClient(fake),
        bucket: 'b',
        keyPrefix: 'tenant-a/',
        manageLifecycle: false,
      })
      const result = await store.list('p/')
      expect(result.items[0].key).toBe('p/a')
    })

    it('rejects non-string prefix and bad limits', async () => {
      const fake = new FakeS3Client({})
      using store = new S3BlobStore({ client: asClient(fake), bucket: 'b', manageLifecycle: false })
      await expect(store.list(42 as unknown as string)).rejects.toMatchObject({ code: 'invalid-config' })
      await expect(store.list('p', { limit: 0 })).rejects.toMatchObject({ code: 'invalid-config' })
    })

    it('wraps S3 list failures as io-error', async () => {
      const fake = new FakeS3Client({
        ListObjectsV2Command: () => {
          throw new Error('throttled')
        },
      })
      using store = new S3BlobStore({ client: asClient(fake), bucket: 'b', manageLifecycle: false })
      await expect(store.list('')).rejects.toMatchObject({ code: 'io-error' })
    })

    it('treats missing Contents as an empty page', async () => {
      const fake = new FakeS3Client({
        ListObjectsV2Command: () => ({}),
      })
      using store = new S3BlobStore({ client: asClient(fake), bucket: 'b', manageLifecycle: false })
      const result = await store.list('')
      expect(result.items).toEqual([])
      expect(result.nextCursor).toBeUndefined()
    })

    it('skips entries without a Key', async () => {
      const fake = new FakeS3Client({
        ListObjectsV2Command: () => ({
          Contents: [{ Size: 1 }, { Key: 'k', Size: 2 }],
        }),
      })
      using store = new S3BlobStore({ client: asClient(fake), bucket: 'b', manageLifecycle: false })
      const result = await store.list('')
      expect(result.items.map((i) => i.key)).toEqual(['k'])
    })
  })

  describe('signed URLs', () => {
    const realClient = (): S3Client =>
      new S3Client({
        region: 'us-east-1',
        endpoint: 'http://127.0.0.1:9000',
        forcePathStyle: true,
        credentials: { accessKeyId: 'AKIA0000', secretAccessKey: 'secret-key' },
      })

    it('mints a download URL pointing at the bucket + key', async () => {
      using store = new S3BlobStore({ client: realClient(), bucket: 'tests', manageLifecycle: false })
      const url = await store.getDownloadUrl('a/b', { ttlSec: 60 })
      expect(url.startsWith('http')).toBe(true)
      expect(url).toContain('tests/a/b')
      expect(url).toContain('X-Amz-Signature=')
    })

    it('mints an upload URL with method PUT', async () => {
      using store = new S3BlobStore({ client: realClient(), bucket: 'tests', manageLifecycle: false })
      const result = await store.getUploadUrl('upload/key', { ttlSec: 30, contentType: 'image/png', maxBytes: 1024 })
      expect(result.method).toBe('PUT')
      expect(result.url.startsWith('http')).toBe(true)
      expect(result.url).toContain('tests/upload/key')
    })

    it('rejects mid-disposal calls', async () => {
      const store = new S3BlobStore({ client: realClient(), bucket: 'tests', manageLifecycle: false })
      store[Symbol.dispose]()
      await expect(store.getDownloadUrl('a', { ttlSec: 60 })).rejects.toMatchObject({ code: 'io-error' })
      await expect(store.getUploadUrl('a', { ttlSec: 60 })).rejects.toMatchObject({ code: 'io-error' })
    })
  })

  describe('S3BlobStore.bodyToBuffer', () => {
    it('handles Uint8Array', async () => {
      expect(await S3BlobStore.bodyToBuffer(new Uint8Array([1, 2]))).toEqual(new Uint8Array([1, 2]))
    })

    it('handles Buffer', async () => {
      const out = await S3BlobStore.bodyToBuffer(Buffer.from([3, 4]))
      expect(Array.from(out)).toEqual([3, 4])
    })

    it('handles string', async () => {
      expect(decode(await S3BlobStore.bodyToBuffer('abc'))).toBe('abc')
    })

    it('handles a Web ReadableStream', async () => {
      const body = new ReadableStream<Uint8Array>({
        start(c) {
          c.enqueue(new TextEncoder().encode('x'))
          c.close()
        },
      })
      expect(decode(await S3BlobStore.bodyToBuffer(body))).toBe('x')
    })

    it('handles a Node Readable', async () => {
      expect(decode(await S3BlobStore.bodyToBuffer(Readable.from([Buffer.from('node')])))).toBe('node')
    })

    it('throws on unsupported body shapes', async () => {
      await expect(S3BlobStore.bodyToBuffer(123)).rejects.toThrow(BlobStoreError)
    })
  })

  describe('verifying command construction', () => {
    it('uses GetObjectCommand on get', async () => {
      const fake = new FakeS3Client({
        GetObjectCommand: () => ({ Body: Readable.from([Buffer.from('x')]), ContentLength: 1 }),
      })
      using store = new S3BlobStore({ client: asClient(fake), bucket: 'b', manageLifecycle: false })
      await store.get('k')
      expect(fake.send.mock.calls[0][0]).toBeInstanceOf(GetObjectCommand)
    })

    it('uses HeadObjectCommand on head', async () => {
      const fake = new FakeS3Client({ HeadObjectCommand: () => ({ ContentLength: 0 }) })
      using store = new S3BlobStore({ client: asClient(fake), bucket: 'b', manageLifecycle: false })
      await store.head('k')
      expect(fake.send.mock.calls[0][0]).toBeInstanceOf(HeadObjectCommand)
    })

    it('uses DeleteObjectCommand on delete', async () => {
      const fake = new FakeS3Client({ DeleteObjectCommand: () => ({}) })
      using store = new S3BlobStore({ client: asClient(fake), bucket: 'b', manageLifecycle: false })
      await store.delete('k')
      expect(fake.send.mock.calls[0][0]).toBeInstanceOf(DeleteObjectCommand)
    })

    it('uses ListObjectsV2Command on list', async () => {
      const fake = new FakeS3Client({ ListObjectsV2Command: () => ({}) })
      using store = new S3BlobStore({ client: asClient(fake), bucket: 'b', manageLifecycle: false })
      await store.list('')
      expect(fake.send.mock.calls[0][0]).toBeInstanceOf(ListObjectsV2Command)
    })

    it('uses PutObjectCommand on put body (verified via Upload single-part path)', async () => {
      const fake = new FakeS3Client({
        PutObjectCommand: () => ({ ETag: '"x"' }),
        HeadObjectCommand: () => ({ ContentLength: 1 }),
      })
      using store = new S3BlobStore({ client: asClient(fake), bucket: 'b', manageLifecycle: false })
      await store.put('k', Buffer.from('x'))
      const putCall = fake.send.mock.calls.find((c) => c[0] instanceof PutObjectCommand)
      expect(putCall).toBeDefined()
    })

    it('emits PutBucketLifecycleConfigurationCommand on first put', async () => {
      const fake = new FakeS3Client({
        PutBucketLifecycleConfigurationCommand: () => ({}),
        PutObjectCommand: () => ({ ETag: '"x"' }),
        HeadObjectCommand: () => ({ ContentLength: 1 }),
      })
      using store = new S3BlobStore({ client: asClient(fake), bucket: 'b' })
      await store.put('k', Buffer.from('x'))
      const lifecycleCall = fake.send.mock.calls.find((c) => c[0] instanceof PutBucketLifecycleConfigurationCommand)
      expect(lifecycleCall).toBeDefined()
    })
  })

  describe('disposal', () => {
    it('rejects subsequent calls', async () => {
      const store = new S3BlobStore({ client: {} as S3Client, bucket: 'b' })
      store[Symbol.dispose]()
      await expect(store.put('k', Buffer.from('x'))).rejects.toMatchObject({ code: 'io-error' })
      await expect(store.get('k')).rejects.toMatchObject({ code: 'io-error' })
      await expect(store.head('k')).rejects.toMatchObject({ code: 'io-error' })
      await expect(store.delete('k')).rejects.toMatchObject({ code: 'io-error' })
      await expect(store.list('')).rejects.toMatchObject({ code: 'io-error' })
    })
  })
})
