import type { BlobStore } from '@furystack/blob-store'
import type { ServiceFactory } from '@furystack/inject'
import { FileSystemBlobStore, type FileSystemBlobStoreOptions } from './filesystem-blob-store.js'

/**
 * Returns a {@link ServiceFactory} bound to the {@link BlobStore} token,
 * resolving a {@link FileSystemBlobStore} on first access. Disposal is
 * wired into the surrounding injector scope.
 *
 * @example
 * ```ts
 * import { BlobStore } from '@furystack/blob-store'
 * import { defineFileSystemBlobStore } from '@furystack/filesystem-blob-store'
 *
 * injector.bind(
 *   BlobStore,
 *   defineFileSystemBlobStore({
 *     root: './data/blobs',
 *     secret: process.env.BLOB_STORE_SECRET!,
 *     publicUrlBase: 'https://api.example.com/blobs',
 *   }),
 * )
 * ```
 */
export const defineFileSystemBlobStore = (options: FileSystemBlobStoreOptions): ServiceFactory<BlobStore> => {
  return ({ onDispose }) => {
    const store = new FileSystemBlobStore(options)
    // eslint-disable-next-line furystack/prefer-using-wrapper -- delegated to onDispose
    onDispose(() => store[Symbol.dispose]())
    return store
  }
}
