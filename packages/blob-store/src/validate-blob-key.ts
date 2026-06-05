import { BlobStoreError } from './blob-store-error.js'

/** Maximum key length, mirrors S3's object-key cap. */
export const MAX_BLOB_KEY_LENGTH = 1024

/**
 * Validates a blob key against the cross-adapter rules:
 *
 * - non-empty
 * - no NUL bytes (`\0`)
 * - no leading `/` (keys are not paths; adapters that map to filesystem
 *   paths normalise internally)
 * - at most {@link MAX_BLOB_KEY_LENGTH} characters
 *
 * Adapters layer additional checks on top (e.g. the filesystem adapter
 * also rejects `..` traversal segments).
 *
 * Throws {@link BlobStoreError} `code: 'invalid-key'` on any violation.
 */
export const validateBlobKey = (key: string): void => {
  if (typeof key !== 'string' || key.length === 0) {
    throw new BlobStoreError('invalid-key', 'Blob key must be a non-empty string')
  }
  if (key.length > MAX_BLOB_KEY_LENGTH) {
    throw new BlobStoreError(
      'invalid-key',
      `Blob key length ${key.length} exceeds the limit of ${MAX_BLOB_KEY_LENGTH}`,
      { key, limit: MAX_BLOB_KEY_LENGTH, actual: key.length },
    )
  }
  if (key.includes('\0')) {
    throw new BlobStoreError('invalid-key', 'Blob key must not contain NUL bytes', { key })
  }
  if (key.startsWith('/')) {
    throw new BlobStoreError('invalid-key', 'Blob key must not start with `/`', { key })
  }
}
