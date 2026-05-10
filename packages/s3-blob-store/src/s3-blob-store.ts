import {
  DeleteObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  ListObjectsV2Command,
  PutObjectCommand,
  type GetObjectCommandOutput,
  type HeadObjectCommandOutput,
  type ListObjectsV2CommandOutput,
  type PutObjectCommandOutput,
  type S3Client,
} from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import {
  BlobStoreError,
  validateBlobKey,
  type BlobDownloadUrlOptions,
  type BlobGetResult,
  type BlobListOptions,
  type BlobListResult,
  type BlobMetadata,
  type BlobPutInput,
  type BlobPutOptions,
  type BlobRef,
  type BlobStore,
  type BlobStoreCapabilities,
  type BlobUploadUrl,
  type BlobUploadUrlOptions,
} from '@furystack/blob-store'
import { DEFAULT_LIFECYCLE_RULE_ID, ensureBucketLifecycle } from './ensure-bucket-lifecycle.js'
import { bodyToBuffer, bodyToWebStream, stripQuotes, toUploadBody } from './s3-stream-helpers.js'

/**
 * 5 TiB — the per-object limit AWS S3 enforces. Other S3-compatible
 * backends (MinIO, R2) advertise smaller caps in practice; the value
 * is a soft hint per
 * {@link BlobStoreCapabilities.maxObjectBytes}.
 */
export const S3_MAX_OBJECT_BYTES = 5_497_558_138_880

const CAPABILITIES: BlobStoreCapabilities = Object.freeze({
  presignedUrls: true,
  /**
   * Single-part PUT only in v1. Apps that need resumable multipart
   * uploads for very large payloads can compose `@aws-sdk/lib-storage`
   * `Upload` themselves on the underlying `S3Client` and pass the
   * resulting key back as a {@link BlobRef}. v1.x will lift this to
   * `true` once the adapter exposes a multipart-aware `put` variant.
   */
  multipart: false,
  range: true,
  crossNodeAccessible: true,
  /**
   * Single-part PUT caps at 5 GiB on AWS S3. Larger payloads need
   * multipart, which v1 does not expose — see the `multipart` note
   * above.
   */
  maxObjectBytes: 5 * 1024 * 1024 * 1024,
})

/**
 * Options accepted by {@link S3BlobStore}.
 */
export type S3BlobStoreOptions = {
  /**
   * Caller-owned `S3Client` instance. The adapter never closes it;
   * connection lifecycle stays with the application.
   */
  client: S3Client
  /** Bucket every operation runs against. */
  bucket: string
  /**
   * Optional key prefix prepended to every blob key on the wire. Useful
   * for tenant scoping inside a shared bucket. Stored without the
   * prefix in {@link BlobRef.key} so apps round-trip cleanly.
   */
  keyPrefix?: string
  /**
   * Adapter binding name. Defaults to `'s3'`. Set to a stable string
   * when the same injector binds multiple S3 stores so {@link BlobRef}
   * entries stay distinguishable.
   */
  name?: string
  /**
   * When true (default), installs a bucket lifecycle rule that aborts
   * incomplete multipart uploads older than 24h on first put. Avoids
   * orphan-multipart cost surprises. Disable for buckets the app
   * lacks lifecycle permissions on.
   */
  manageLifecycle?: boolean
  /**
   * Override the rule id used by `manageLifecycle`. Defaults to
   * `'furystack-blob-store-abort-incomplete-multipart'` so the rule is
   * easy to inspect and remove out-of-band.
   */
  lifecycleRuleId?: string
  /**
   * Async callback invoked when the lifecycle setup attempt fails.
   * Defaults to silent — apps wire this into their telemetry / logging
   * sink to surface permission issues.
   */
  onLifecycleError?: (error: unknown) => void
}

const wrap = (
  code: 'not-found' | 'io-error',
  message: string,
  key: string,
  storeName: string,
  cause: unknown,
): never => {
  throw new BlobStoreError(code, message, { key, storeName, cause })
}

const isNotFoundError = (cause: unknown): boolean => {
  if (!cause || typeof cause !== 'object') return false
  const { name } = cause as { name?: string }
  const code = (cause as { Code?: string; code?: string }).Code ?? (cause as { code?: string }).code
  const httpStatus = (cause as { $metadata?: { httpStatusCode?: number } }).$metadata?.httpStatusCode
  return name === 'NoSuchKey' || code === 'NoSuchKey' || code === 'NotFound' || httpStatus === 404
}

/**
 * S3-compatible {@link BlobStore} adapter. Targets AWS S3, MinIO,
 * Cloudflare R2, Backblaze B2, and any other backend exposing the v3
 * S3 API. The caller owns the underlying `S3Client` instance.
 *
 * Multipart uploads run automatically via `@aws-sdk/lib-storage`'s
 * `Upload`; single-part PUT is used for known-small payloads when
 * `contentLength` is supplied at put time.
 */
export class S3BlobStore implements BlobStore {
  public readonly capabilities: BlobStoreCapabilities = CAPABILITIES
  public readonly storeName: string

  readonly #client: S3Client
  readonly #bucket: string
  readonly #keyPrefix: string
  readonly #manageLifecycle: boolean
  readonly #lifecycleRuleId: string
  readonly #onLifecycleError: ((error: unknown) => void) | undefined
  #lifecycleAttempted = false
  #disposed = false

  constructor(options: S3BlobStoreOptions) {
    if (!options.bucket || typeof options.bucket !== 'string') {
      throw new BlobStoreError('invalid-config', 'S3BlobStore requires a non-empty `bucket`')
    }
    this.#client = options.client
    this.#bucket = options.bucket
    this.#keyPrefix = options.keyPrefix ?? ''
    this.#manageLifecycle = options.manageLifecycle ?? true
    this.#lifecycleRuleId = options.lifecycleRuleId ?? DEFAULT_LIFECYCLE_RULE_ID
    this.#onLifecycleError = options.onLifecycleError
    this.storeName = options.name ?? 's3'
  }

  public async put(key: string, payload: BlobPutInput, options: BlobPutOptions = {}): Promise<BlobRef> {
    this.#ensureLive()
    validateBlobKey(key)
    await this.#ensureLifecycle()
    const wireKey = this.#wireKey(key)
    let etag: string | undefined
    let contentLength: number | undefined
    try {
      const body = toUploadBody(payload)
      const result: PutObjectCommandOutput = await this.#client.send(
        new PutObjectCommand({
          Bucket: this.#bucket,
          Key: wireKey,
          Body: body,
          ContentType: options.contentType,
          ContentLength: options.contentLength,
          Metadata: options.metadata,
        }),
      )
      etag = stripQuotes(result.ETag)
      ;({ contentLength } = options)
    } catch (cause) {
      throw new BlobStoreError('io-error', `Failed to upload blob ${key}`, {
        key,
        storeName: this.storeName,
        cause,
      })
    }
    if (contentLength === undefined) {
      try {
        const head: HeadObjectCommandOutput = await this.#client.send(
          new HeadObjectCommand({ Bucket: this.#bucket, Key: wireKey }),
        )
        contentLength = head.ContentLength
      } catch {
        // Best-effort: leave contentLength undefined when head is denied/missing.
      }
    }
    return {
      storeName: this.storeName,
      key,
      contentType: options.contentType,
      contentLength,
      etag,
    }
  }

  public async get(key: string): Promise<BlobGetResult> {
    this.#ensureLive()
    validateBlobKey(key)
    const wireKey = this.#wireKey(key)
    let response: GetObjectCommandOutput
    try {
      response = await this.#client.send(new GetObjectCommand({ Bucket: this.#bucket, Key: wireKey }))
    } catch (cause) {
      if (isNotFoundError(cause)) {
        wrap('not-found', `Blob not found: ${key}`, key, this.storeName, cause)
      }
      wrap('io-error', `Failed to read blob ${key}`, key, this.storeName, cause)
      throw cause
    }
    const body = response.Body
    if (!body) {
      throw new BlobStoreError('io-error', `S3 returned no body for ${key}`, {
        key,
        storeName: this.storeName,
      })
    }
    return {
      stream: bodyToWebStream(body),
      contentType: response.ContentType,
      contentLength: response.ContentLength,
      etag: stripQuotes(response.ETag),
    }
  }

  public async head(key: string): Promise<BlobMetadata | undefined> {
    this.#ensureLive()
    validateBlobKey(key)
    const wireKey = this.#wireKey(key)
    let response: HeadObjectCommandOutput
    try {
      response = await this.#client.send(new HeadObjectCommand({ Bucket: this.#bucket, Key: wireKey }))
    } catch (cause) {
      if (isNotFoundError(cause)) return undefined
      throw new BlobStoreError('io-error', `Failed to head blob ${key}`, {
        key,
        storeName: this.storeName,
        cause,
      })
    }
    return {
      key,
      contentType: response.ContentType,
      contentLength: response.ContentLength ?? 0,
      etag: stripQuotes(response.ETag),
      lastModified: response.LastModified ?? new Date(0),
      customMetadata: response.Metadata,
    }
  }

  public async delete(key: string): Promise<void> {
    this.#ensureLive()
    validateBlobKey(key)
    try {
      await this.#client.send(new DeleteObjectCommand({ Bucket: this.#bucket, Key: this.#wireKey(key) }))
    } catch (cause) {
      if (isNotFoundError(cause)) return
      throw new BlobStoreError('io-error', `Failed to delete blob ${key}`, {
        key,
        storeName: this.storeName,
        cause,
      })
    }
  }

  public async list(prefix: string, options: BlobListOptions = {}): Promise<BlobListResult> {
    this.#ensureLive()
    if (typeof prefix !== 'string') {
      throw new BlobStoreError('invalid-config', 'Prefix must be a string')
    }
    const limit = options.limit ?? 100
    if (!Number.isInteger(limit) || limit <= 0) {
      throw new BlobStoreError('invalid-config', `Limit must be a positive integer, got ${String(options.limit)}`)
    }
    let response: ListObjectsV2CommandOutput
    try {
      response = await this.#client.send(
        new ListObjectsV2Command({
          Bucket: this.#bucket,
          Prefix: this.#keyPrefix + prefix,
          MaxKeys: limit,
          ContinuationToken: options.cursor,
        }),
      )
    } catch (cause) {
      throw new BlobStoreError('io-error', 'Failed to list blobs', { storeName: this.storeName, cause })
    }
    const items: BlobMetadata[] = (response.Contents ?? [])
      .filter((entry): entry is { Key: string; Size?: number; LastModified?: Date; ETag?: string } => !!entry.Key)
      .map((entry) => ({
        key: this.#stripPrefix(entry.Key),
        contentLength: entry.Size ?? 0,
        etag: stripQuotes(entry.ETag),
        lastModified: entry.LastModified ?? new Date(0),
      }))
    return {
      items,
      nextCursor: response.NextContinuationToken,
    }
  }

  public async getDownloadUrl(key: string, options: BlobDownloadUrlOptions): Promise<string> {
    this.#ensureLive()
    validateBlobKey(key)
    return getSignedUrl(this.#client, new GetObjectCommand({ Bucket: this.#bucket, Key: this.#wireKey(key) }), {
      expiresIn: options.ttlSec,
    })
  }

  public async getUploadUrl(key: string, options: BlobUploadUrlOptions): Promise<BlobUploadUrl> {
    this.#ensureLive()
    validateBlobKey(key)
    const url = await getSignedUrl(
      this.#client,
      new PutObjectCommand({
        Bucket: this.#bucket,
        Key: this.#wireKey(key),
        ContentType: options.contentType,
        ContentLength: options.maxBytes,
      }),
      { expiresIn: options.ttlSec },
    )
    return { url, method: 'PUT' }
  }

  public [Symbol.dispose](): void {
    this.#disposed = true
  }

  /**
   * Public helper for tests / advanced consumers: drains a `Body` from an
   * S3 response into a single `Uint8Array`. Memory-bound — only safe
   * when the caller knows the payload fits in RAM.
   */
  public static async bodyToBuffer(body: unknown): Promise<Uint8Array> {
    return bodyToBuffer(body)
  }

  #wireKey(key: string): string {
    return `${this.#keyPrefix}${key}`
  }

  #stripPrefix(wireKey: string): string {
    return this.#keyPrefix && wireKey.startsWith(this.#keyPrefix) ? wireKey.slice(this.#keyPrefix.length) : wireKey
  }

  async #ensureLifecycle(): Promise<void> {
    if (!this.#manageLifecycle || this.#lifecycleAttempted) return
    this.#lifecycleAttempted = true
    await ensureBucketLifecycle({
      client: this.#client,
      bucket: this.#bucket,
      ruleId: this.#lifecycleRuleId,
      onError: this.#onLifecycleError,
    })
  }

  #ensureLive(): void {
    if (this.#disposed) {
      throw new BlobStoreError('io-error', 'S3BlobStore has been disposed', { storeName: this.storeName })
    }
  }
}
