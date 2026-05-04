import { defineService, type Token } from '@furystack/inject'
import { BlobStoreNotConfiguredError } from './blob-store-error.js'
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

/**
 * Transport-agnostic large-binary store. Adapters back this interface
 * with concrete storage (in-memory, filesystem, S3-compatible, …).
 *
 * Lifecycle is owned by the binding factory: adapters opened from
 * `defineXxxBlobStore` are disposed when the surrounding injector
 * scope tears down. Direct callers can `using` the instance.
 *
 * Errors are surfaced as {@link BlobStoreError} with a discriminated
 * `code` so apps switch exhaustively rather than substring-matching
 * messages.
 */
export interface BlobStore extends Disposable {
  /** Static description of what this adapter can do. */
  readonly capabilities: BlobStoreCapabilities

  /** Adapter binding name embedded in every {@link BlobRef} this store mints. */
  readonly storeName: string

  /**
   * Stores `payload` under `key`. Returns the canonical {@link BlobRef}
   * apps persist on entities or task payloads. Adapters consume the
   * stream once; callers cannot re-read it after `put` resolves.
   */
  put(key: string, payload: BlobPutInput, options?: BlobPutOptions): Promise<BlobRef>

  /**
   * Reads the blob at `key`. Throws `code: 'not-found'` when missing.
   * Returned `stream` is a Web `ReadableStream<Uint8Array>` — Node
   * consumers adapt via `Readable.fromWeb`.
   */
  get(key: string): Promise<BlobGetResult>

  /**
   * Returns metadata for `key`, or `undefined` when missing. Cheap
   * existence check — does not transfer the body.
   */
  head(key: string): Promise<BlobMetadata | undefined>

  /** Idempotent. Removes `key` if present, no-op when missing. */
  delete(key: string): Promise<void>

  /**
   * Flat S3-style prefix listing. Returns up to `options.limit`
   * entries plus an opaque `nextCursor` when more remain. The cursor
   * is only valid for the same `prefix`/`limit` on the same adapter
   * instance.
   */
  list(prefix: string, options?: BlobListOptions): Promise<BlobListResult>

  /**
   * Mints a short-lived URL clients can `GET` to download `key`
   * directly from the backing transport. Throws
   * `code: 'capability-missing'` when {@link BlobStoreCapabilities.presignedUrls}
   * is `false`.
   */
  getDownloadUrl(key: string, options: BlobDownloadUrlOptions): Promise<string>

  /**
   * Mints a short-lived URL clients use to upload to `key` directly.
   * Returned shape varies per adapter (`PUT` vs. `POST` with form fields).
   * Throws `code: 'capability-missing'` when
   * {@link BlobStoreCapabilities.presignedUrls} is `false`.
   */
  getUploadUrl(key: string, options: BlobUploadUrlOptions): Promise<BlobUploadUrl>
}

/**
 * Shared {@link BlobStore} token. The default factory throws
 * {@link BlobStoreNotConfiguredError} on resolution — blobs are large
 * and persistence-sensitive, so unbound resolution is a misconfiguration
 * rather than a silent in-memory fallback.
 *
 * Apps bind a concrete adapter at boot:
 *
 * ```ts
 * import { BlobStore } from '@furystack/blob-store'
 * import { defineFileSystemBlobStore } from '@furystack/filesystem-blob-store'
 *
 * injector.bind(BlobStore, defineFileSystemBlobStore({ root: './data/blobs', secret }))
 * ```
 *
 * For tests, bind {@link InMemoryBlobStore} directly:
 *
 * ```ts
 * injector.bind(BlobStore, () => new InMemoryBlobStore({ name: 'tests' }))
 * ```
 *
 * Singleton because a single store per injector tree is the right
 * semantic for most apps; tests get isolation by minting their own
 * root injector.
 */
export const BlobStore: Token<BlobStore, 'singleton'> = defineService({
  name: 'furystack/blob-store/BlobStore',
  lifetime: 'singleton',
  factory: () => {
    throw new BlobStoreNotConfiguredError()
  },
})
