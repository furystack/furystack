/**
 * Reference to a stored blob. Returned by `BlobStore.put` and embedded in
 * task payloads / results. Adapters mint refs with their own `storeName`
 * (declared at construction) so multi-binding deployments can route
 * requests back to the originating store.
 */
export type BlobRef = {
  /** Adapter binding name. Defaults to the adapter's type id. */
  readonly storeName: string
  /** Caller-supplied key within the store. */
  readonly key: string
  /** MIME type recorded at put time, when supplied. */
  readonly contentType?: string
  /** Length in bytes when known at put time. */
  readonly contentLength?: number
  /** Opaque adapter-specific entity tag (e.g. S3 etag, content hash). */
  readonly etag?: string
}

/**
 * Metadata returned by `BlobStore.head` and `BlobStore.list`. Shape covers
 * common fields across in-memory, filesystem (mtime → `lastModified`), and
 * S3-compatible (`etag`, `customMetadata`) backends without forcing
 * lowest-common-denominator behaviour at the type level.
 */
export type BlobMetadata = {
  readonly key: string
  readonly contentType?: string
  readonly contentLength: number
  readonly etag?: string
  readonly lastModified: Date
  /**
   * Caller-supplied key/value pairs forwarded at put time. Backends with
   * limits (S3: 2KB total) reject oversize entries with
   * {@link BlobStoreError} `code: 'invalid-config'`.
   */
  readonly customMetadata?: Record<string, string>
}

/**
 * Static description of an adapter's behaviour. Declared once on the
 * adapter instance and asserted by consumers (notably the task runner)
 * so deployment misconfigurations fail at boot rather than on the first
 * request.
 */
export type BlobStoreCapabilities = {
  /** Adapter can mint short-lived URLs apps hand to untrusted clients. */
  readonly presignedUrls: boolean
  /** Adapter implements resumable multi-part upload internally. */
  readonly multipart: boolean
  /**
   * Adapter supports byte-range requests on `get`. v1 of the interface
   * does not yet expose a `range` parameter on `get`; this flag is
   * future-proofing so adapters can advertise the capability ahead of
   * the API surface that uses it.
   */
  readonly range: boolean
  /**
   * Storage is reachable from any node in the deployment. False for
   * adapters whose backing store is process-local (in-memory) or
   * filesystem-local. The task runner refuses to start when paired
   * with a multi-node queue adapter and a `crossNodeAccessible: false`
   * blob store.
   */
  readonly crossNodeAccessible: boolean
  /**
   * Soft hint on the largest single object the backend will accept.
   * `BlobStore.put` may reject larger payloads with
   * {@link BlobStoreError} `code: 'too-large'`.
   */
  readonly maxObjectBytes: number
}

/**
 * Options accepted by `BlobStore.put`.
 */
export type BlobPutOptions = {
  contentType?: string
  /** When known up front, lets adapters short-circuit before reading the stream. */
  contentLength?: number
  metadata?: Record<string, string>
}

/**
 * Result of `BlobStore.get`. Adapters return Web `ReadableStream` for
 * portability; Node consumers can adapt with `Readable.fromWeb`.
 */
export type BlobGetResult = {
  readonly stream: ReadableStream<Uint8Array>
  readonly contentType?: string
  readonly contentLength?: number
  readonly etag?: string
}

/**
 * Options accepted by `BlobStore.list`. v1 is flat S3-style prefix
 * scanning — no delimiter, opaque cursor.
 */
export type BlobListOptions = {
  cursor?: string
  /** Max entries returned. Adapters cap this further if backing API limits it. */
  limit?: number
}

/**
 * Result of `BlobStore.list`. `nextCursor` is opaque and only valid for
 * the same `prefix`/`limit` pair on the same adapter instance.
 */
export type BlobListResult = {
  readonly items: BlobMetadata[]
  readonly nextCursor?: string
}

/**
 * Options accepted by `BlobStore.getDownloadUrl`.
 */
export type BlobDownloadUrlOptions = {
  /** TTL of the issued URL, in seconds. Adapters may cap this. */
  ttlSec: number
}

/**
 * Options accepted by `BlobStore.getUploadUrl`.
 */
export type BlobUploadUrlOptions = {
  ttlSec: number
  contentType?: string
  /**
   * Upper bound on bytes accepted at the issued URL. **Adapter-dependent
   * enforcement** — adapters that proxy uploads through a server (e.g.
   * `@furystack/filesystem-blob-store`) reject oversize streams in
   * flight; pre-signed direct-to-storage adapters (e.g.
   * `@furystack/s3-blob-store`) cannot enforce a maximum on a PUT
   * pre-sign and therefore treat the value as advisory. Apps that need a
   * hard cap on direct uploads must layer a server-side check (POST
   * policy, lambda, …) in front of the blob store.
   */
  maxBytes?: number
}

/**
 * Result of `BlobStore.getUploadUrl`. Adapters that require a multipart
 * form (e.g. S3 POST policy) populate `fields`; PUT-style adapters
 * leave it undefined.
 */
export type BlobUploadUrl = {
  readonly url: string
  readonly method: 'PUT' | 'POST'
  readonly fields?: Record<string, string>
}

/**
 * Stream shape accepted by `BlobStore.put`. Web `ReadableStream` is the
 * canonical input; Node `Readable` and `Buffer` are accepted as
 * convenience inputs and adapted internally.
 */
export type BlobPutInput = ReadableStream<Uint8Array> | NodeJS.ReadableStream | Buffer | Uint8Array
