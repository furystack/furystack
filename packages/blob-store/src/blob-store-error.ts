/**
 * Discriminator for {@link BlobStoreError}. Apps switch on `.code` to
 * distinguish failure modes without substring-matching error messages.
 *
 * - `not-found`           — get/head on a key that does not exist.
 * - `invalid-key`         — key violates the validation rules in
 *                           {@link validateBlobKey}.
 * - `invalid-config`      — adapter constructor / option misuse
 *                           (e.g. HMAC secret too short, malformed
 *                           metadata, unparsable URL).
 * - `capability-missing`  — caller invoked a method requiring a
 *                           capability the adapter does not advertise
 *                           (e.g. `getDownloadUrl` on filesystem).
 * - `too-large`           — payload exceeds adapter's `maxObjectBytes`
 *                           or a `maxBytes` URL constraint.
 * - `conflict`            — concurrent write conflict (e.g. ETag
 *                           mismatch on a conditional put).
 * - `io-error`            — generic backend I/O failure; adapters
 *                           wrap the underlying error in `cause`.
 * - `signature-invalid`   — server-proxy URL signature failed to
 *                           verify or has expired.
 */
export type BlobStoreErrorCode =
  | 'not-found'
  | 'invalid-key'
  | 'invalid-config'
  | 'capability-missing'
  | 'too-large'
  | 'conflict'
  | 'io-error'
  | 'signature-invalid'

/**
 * Optional diagnostic context attached to a {@link BlobStoreError}.
 * Adapters populate `key`, `storeName`, and similar fields when known
 * so log scrapers and debuggers can correlate without parsing the
 * message string.
 */
export type BlobStoreErrorDetails = {
  readonly key?: string
  readonly storeName?: string
  readonly capability?: string
  readonly limit?: number
  readonly actual?: number
  readonly cause?: unknown
}

/**
 * Single error class thrown by every `@furystack/blob-store` adapter.
 *
 * Discriminated by {@link BlobStoreErrorCode} so callers can `switch`
 * exhaustively. The constructor preserves the originating error on
 * `cause` (both as the standard `Error.cause` slot and inside
 * {@link BlobStoreErrorDetails.cause}) for backend-driven failures.
 */
export class BlobStoreError extends Error {
  public readonly code: BlobStoreErrorCode
  public readonly details: BlobStoreErrorDetails

  constructor(code: BlobStoreErrorCode, message: string, details: BlobStoreErrorDetails = {}) {
    super(message, details.cause !== undefined ? { cause: details.cause } : undefined)
    this.name = 'BlobStoreError'
    this.code = code
    this.details = details
  }

  /**
   * Type guard. Useful on `unknown` caught values without `instanceof`
   * pitfalls across realm boundaries (worker threads, vitest workers).
   */
  public static is(value: unknown): value is BlobStoreError {
    return value instanceof BlobStoreError || (value instanceof Error && value.name === 'BlobStoreError')
  }
}

/**
 * Thrown by the default `BlobStore` factory when nothing has been bound.
 * Distinct subclass for greppability and a friendly message pointing at
 * the canonical bind sites.
 */
export class BlobStoreNotConfiguredError extends BlobStoreError {
  constructor() {
    super(
      'invalid-config',
      'BlobStore has not been configured. Bind a backing adapter ' +
        '(defineFileSystemBlobStore / defineS3BlobStore) or, for tests, ' +
        '`injector.bind(BlobStore, () => new InMemoryBlobStore({ name: "tests" }))`.',
    )
    this.name = 'BlobStoreNotConfiguredError'
  }
}
