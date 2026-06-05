import { createHash } from 'node:crypto'
import { BlobStoreError } from './blob-store-error.js'
import type { BlobStore } from './blob-store.js'
import { collectStream, normalizePutInput } from './normalize-put-input.js'
import type {
  BlobDownloadUrlOptions,
  BlobGetResult,
  BlobListOptions,
  BlobListResult,
  BlobMetadata,
  BlobPutInput,
  BlobPutOptions,
  BlobRef,
  BlobStoreCapabilities,
  BlobUploadUrl,
  BlobUploadUrlOptions,
} from './types.js'
import { validateBlobKey } from './validate-blob-key.js'

const CAPABILITIES: BlobStoreCapabilities = Object.freeze({
  presignedUrls: false,
  multipart: false,
  range: false,
  crossNodeAccessible: false,
  maxObjectBytes: Number.POSITIVE_INFINITY,
})

type StoredBlob = {
  data: Uint8Array
  metadata: BlobMetadata
}

/**
 * Options accepted by {@link InMemoryBlobStore}.
 */
export type InMemoryBlobStoreOptions = {
  /**
   * Adapter binding name embedded in every {@link BlobRef}. Defaults to
   * `'in-memory'`. Tests that bind multiple in-memory stores in the same
   * injector tree should pass distinct names so refs are distinguishable
   * post-resolution.
   */
  name?: string
}

/**
 * In-memory {@link BlobStore} adapter. Backs unit + integration tests
 * and is the canonical reference implementation for the interface.
 *
 * Capabilities are deliberately pessimistic
 * (`crossNodeAccessible: false`) so accidental use in a multi-node
 * deployment is caught by the boot-time capability cross-check.
 */
export class InMemoryBlobStore implements BlobStore {
  public readonly capabilities: BlobStoreCapabilities = CAPABILITIES
  public readonly storeName: string

  readonly #blobs: Map<string, StoredBlob> = new Map()
  #disposed = false

  constructor(options: InMemoryBlobStoreOptions = {}) {
    this.storeName = options.name ?? 'in-memory'
  }

  public async put(key: string, payload: BlobPutInput, options: BlobPutOptions = {}): Promise<BlobRef> {
    this.#ensureLive()
    validateBlobKey(key)
    const data = await collectStream(normalizePutInput(payload))
    if (options.contentLength !== undefined && options.contentLength !== data.byteLength) {
      throw new BlobStoreError(
        'invalid-config',
        `Declared contentLength ${options.contentLength} does not match payload size ${data.byteLength}`,
        { key, storeName: this.storeName, limit: options.contentLength, actual: data.byteLength },
      )
    }
    const etag = createHash('sha256').update(data).digest('hex')
    // Freeze the metadata + nested `customMetadata` so consumers of
    // `head()` / `list()` cannot mutate stored state via the returned
    // reference.
    const customMetadata = options.metadata ? Object.freeze({ ...options.metadata }) : undefined
    const metadata: BlobMetadata = Object.freeze({
      key,
      contentType: options.contentType,
      contentLength: data.byteLength,
      etag,
      lastModified: new Date(),
      customMetadata,
    })
    this.#blobs.set(key, { data, metadata })
    return {
      storeName: this.storeName,
      key,
      contentType: options.contentType,
      contentLength: data.byteLength,
      etag,
    }
  }

  public async get(key: string): Promise<BlobGetResult> {
    this.#ensureLive()
    validateBlobKey(key)
    const stored = this.#blobs.get(key)
    if (!stored) {
      throw new BlobStoreError('not-found', `Blob not found: ${key}`, { key, storeName: this.storeName })
    }
    const copy = new Uint8Array(stored.data)
    const stream = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(copy)
        controller.close()
      },
    })
    return {
      stream,
      contentType: stored.metadata.contentType,
      contentLength: stored.metadata.contentLength,
      etag: stored.metadata.etag,
    }
  }

  public async head(key: string): Promise<BlobMetadata | undefined> {
    this.#ensureLive()
    validateBlobKey(key)
    return this.#blobs.get(key)?.metadata
  }

  public async delete(key: string): Promise<void> {
    this.#ensureLive()
    validateBlobKey(key)
    this.#blobs.delete(key)
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
    const allMatching = [...this.#blobs.keys()].filter((key) => key.startsWith(prefix)).sort()
    const startIndex = options.cursor ? allMatching.indexOf(options.cursor) : 0
    if (startIndex < 0) {
      throw new BlobStoreError('invalid-config', 'Cursor does not match any current key', { key: options.cursor })
    }
    const slice = allMatching.slice(startIndex, startIndex + limit)
    const items = slice.map((key) => this.#blobs.get(key)!.metadata)
    const nextIndex = startIndex + limit
    const nextCursor = nextIndex < allMatching.length ? allMatching[nextIndex] : undefined
    return { items, nextCursor }
  }

  public async getDownloadUrl(_key: string, _options: BlobDownloadUrlOptions): Promise<string> {
    throw new BlobStoreError(
      'capability-missing',
      'InMemoryBlobStore does not support presigned URLs (capability `presignedUrls`).',
      { storeName: this.storeName, capability: 'presignedUrls' },
    )
  }

  public async getUploadUrl(_key: string, _options: BlobUploadUrlOptions): Promise<BlobUploadUrl> {
    throw new BlobStoreError(
      'capability-missing',
      'InMemoryBlobStore does not support presigned URLs (capability `presignedUrls`).',
      { storeName: this.storeName, capability: 'presignedUrls' },
    )
  }

  public [Symbol.dispose](): void {
    if (this.#disposed) return
    this.#disposed = true
    this.#blobs.clear()
  }

  #ensureLive(): void {
    if (this.#disposed) {
      throw new BlobStoreError('io-error', 'InMemoryBlobStore has been disposed', { storeName: this.storeName })
    }
  }
}
