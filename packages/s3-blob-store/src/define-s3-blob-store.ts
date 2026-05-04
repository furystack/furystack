import type { BlobStore } from '@furystack/blob-store'
import type { ServiceFactory } from '@furystack/inject'
import { S3BlobStore, type S3BlobStoreOptions } from './s3-blob-store.js'

/**
 * Returns a {@link ServiceFactory} bound to the {@link BlobStore} token,
 * resolving an {@link S3BlobStore} on first access. The caller still
 * owns the lifecycle of the supplied `S3Client`.
 *
 * @example
 * ```ts
 * import { S3Client } from '@aws-sdk/client-s3'
 * import { BlobStore } from '@furystack/blob-store'
 * import { defineS3BlobStore } from '@furystack/s3-blob-store'
 *
 * const client = new S3Client({
 *   region: 'eu-central-1',
 *   credentials: { accessKeyId, secretAccessKey },
 * })
 *
 * injector.bind(
 *   BlobStore,
 *   defineS3BlobStore({
 *     client,
 *     bucket: 'my-app-blobs',
 *     keyPrefix: 'tenant-a/',
 *   }),
 * )
 * ```
 */
export const defineS3BlobStore = (options: S3BlobStoreOptions): ServiceFactory<BlobStore> => {
  return ({ onDispose }) => {
    const store = new S3BlobStore(options)
    // eslint-disable-next-line furystack/prefer-using-wrapper -- delegated to onDispose
    onDispose(() => store[Symbol.dispose]())
    return store
  }
}
