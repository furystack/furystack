import { CreateBucketCommand, DeleteBucketCommand, S3Client } from '@aws-sdk/client-s3'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { S3BlobStore } from './s3-blob-store.js'

const { MINIO_URL } = process.env
const ACCESS_KEY = process.env.MINIO_ACCESS_KEY ?? 'minioadmin'
const SECRET_KEY = process.env.MINIO_SECRET_KEY ?? 'minioadmin'

const describeIntegration = MINIO_URL ? describe : describe.skip

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

describeIntegration('S3BlobStore (integration, requires MINIO_URL)', () => {
  const bucket = `furystack-blob-test-${Date.now()}`
  let client: S3Client
  let store: S3BlobStore

  beforeAll(async () => {
    client = new S3Client({
      endpoint: MINIO_URL,
      region: 'us-east-1',
      forcePathStyle: true,
      credentials: { accessKeyId: ACCESS_KEY, secretAccessKey: SECRET_KEY },
    })
    await client.send(new CreateBucketCommand({ Bucket: bucket }))
    store = new S3BlobStore({ client, bucket, manageLifecycle: false })
  })

  afterAll(async () => {
    try {
      const listing = await store.list('')
      await Promise.all(listing.items.map((item) => store.delete(item.key)))
      await client.send(new DeleteBucketCommand({ Bucket: bucket }))
    } finally {
      store[Symbol.dispose]()
      client.destroy()
    }
  })

  it('round-trips a buffer payload', async () => {
    await store.put('greeting.txt', Buffer.from('hello-minio'), { contentType: 'text/plain' })
    const result = await store.get('greeting.txt')
    expect(result.contentType).toBe('text/plain')
    expect(decode(await collect(result.stream))).toBe('hello-minio')
  })

  it('lists by prefix', async () => {
    await store.put('list/a', Buffer.from('1'))
    await store.put('list/b', Buffer.from('1'))
    const result = await store.list('list/')
    expect(result.items.map((i) => i.key).sort()).toEqual(['list/a', 'list/b'])
  })

  it('returns not-found on missing get', async () => {
    await expect(store.get('absent')).rejects.toMatchObject({ code: 'not-found' })
  })

  it('returns undefined head for missing keys', async () => {
    expect(await store.head('absent')).toBeUndefined()
  })
})
